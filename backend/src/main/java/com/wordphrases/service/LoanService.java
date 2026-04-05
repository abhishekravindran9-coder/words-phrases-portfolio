package com.wordphrases.service;

import com.wordphrases.dto.request.LoanRequest;
import com.wordphrases.dto.request.PrepaymentRequest;
import com.wordphrases.dto.response.*;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.*;
import com.wordphrases.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final EmiPaymentRepository emiPaymentRepository;
    private final PrepaymentRepository prepaymentRepository;
    private final PropertyService propertyService;

    // ─── EMI Formula ─────────────────────────────────────────────────────────────

    /** @param annualRate annual interest % (e.g. 8.5 for 8.5%) */
    public double calculateEmi(double principal, double annualRate, int tenureMonths) {
        if (annualRate == 0) return round(principal / tenureMonths);
        double r = annualRate / 12.0 / 100.0;
        return round(principal * r * Math.pow(1 + r, tenureMonths)
                / (Math.pow(1 + r, tenureMonths) - 1));
    }

    // ─── Loan CRUD ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LoanResponse getLoan(Long userId, Long propertyId) {
        Loan loan = findLoan(userId, propertyId);
        return toResponse(loan);
    }

    @Transactional
    public LoanResponse saveLoan(Long userId, Long propertyId, LoanRequest req) {
        Property property = propertyService.findOwned(userId, propertyId);
        Loan loan = loanRepository.findByProperty(property).orElse(null);
        if (loan == null) {
            loan = Loan.builder()
                    .property(property)
                    .sanctionedAmount(req.getSanctionedAmount())
                    .interestRate(req.getInterestRate())
                    .interestType(req.getInterestType() != null ? req.getInterestType() : "FIXED")
                    .tenureMonths(req.getTenureMonths())
                    .emiStartDate(req.getEmiStartDate())
                    .bankName(req.getBankName())
                    .accountNumber(req.getAccountNumber())
                    .build();
        } else {
            if (req.getSanctionedAmount() != null)  loan.setSanctionedAmount(req.getSanctionedAmount());
            if (req.getInterestRate() != null)       loan.setInterestRate(req.getInterestRate());
            if (req.getInterestType() != null)       loan.setInterestType(req.getInterestType());
            if (req.getTenureMonths() != null)       loan.setTenureMonths(req.getTenureMonths());
            if (req.getEmiStartDate() != null)       loan.setEmiStartDate(req.getEmiStartDate());
            if (req.getBankName() != null)           loan.setBankName(req.getBankName());
            if (req.getAccountNumber() != null)      loan.setAccountNumber(req.getAccountNumber());
        }
        return toResponse(loanRepository.save(loan));
    }

    // ─── Amortization Schedule ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AmortizationEntryResponse> getSchedule(Long userId, Long propertyId) {
        Loan loan = findLoan(userId, propertyId);
        List<EmiPayment> payments = emiPaymentRepository.findByLoanOrderByMonthNumberAsc(loan);
        List<Prepayment> prepayments = prepaymentRepository.findByLoanOrderByPrepaymentDateAsc(loan);
        return buildSchedule(loan, payments, prepayments);
    }

    // ─── EMI Payment ─────────────────────────────────────────────────────────────

    @Transactional
    public void markEmiPaid(Long userId, Long propertyId, int monthNumber, LocalDate paidDate) {
        Loan loan = findLoan(userId, propertyId);
        EmiPayment payment = emiPaymentRepository.findByLoanAndMonthNumber(loan, monthNumber)
                .orElse(EmiPayment.builder().loan(loan).monthNumber(monthNumber).build());
        payment.setPaid(true);
        payment.setPaidDate(paidDate != null ? paidDate : LocalDate.now());
        emiPaymentRepository.save(payment);
    }

    // ─── Prepayments ─────────────────────────────────────────────────────────────

    @Transactional
    public PrepaymentResponse addPrepayment(Long userId, Long propertyId, PrepaymentRequest req) {
        Loan loan = findLoan(userId, propertyId);
        Prepayment pp = Prepayment.builder()
                .loan(loan)
                .amount(req.getAmount())
                .prepaymentDate(req.getPrepaymentDate() != null ? req.getPrepaymentDate() : LocalDate.now())
                .prepaymentType(req.getPrepaymentType() != null ? req.getPrepaymentType() : "REDUCE_TENURE")
                .build();
        return toPrepaymentResponse(prepaymentRepository.save(pp));
    }

    @Transactional(readOnly = true)
    public List<PrepaymentResponse> getPrepayments(Long userId, Long propertyId) {
        Loan loan = findLoan(userId, propertyId);
        return prepaymentRepository.findByLoanOrderByPrepaymentDateAsc(loan)
                .stream().map(this::toPrepaymentResponse).toList();
    }

    // ─── Prepayment Simulation ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PrepaymentSimulationResponse simulate(Long userId, Long propertyId, List<PrepaymentRequest> reqs) {
        if (reqs == null || reqs.isEmpty()) throw new IllegalArgumentException("At least one prepayment required");
        Loan loan = findLoan(userId, propertyId);
        List<EmiPayment> paidEmis = emiPaymentRepository.findByLoanOrderByMonthNumberAsc(loan);
        List<Prepayment> existingPrepayments = prepaymentRepository.findByLoanOrderByPrepaymentDateAsc(loan);

        // Original schedule (without any new prepayments)
        List<AmortizationEntryResponse> originalSchedule = buildSchedule(loan, paidEmis, existingPrepayments);
        double originalTotalInterest = originalSchedule.stream().mapToDouble(AmortizationEntryResponse::getInterest).sum();
        int originalTenure           = originalSchedule.size();
        LocalDate originalClosure    = originalSchedule.isEmpty() ? null
                : originalSchedule.get(originalSchedule.size() - 1).getDate();

        // Add all hypothetical prepayments
        List<Prepayment> withNew = new ArrayList<>(existingPrepayments);
        boolean anyReduceEmi = false;
        for (PrepaymentRequest req : reqs) {
            String type = req.getPrepaymentType() != null ? req.getPrepaymentType() : "REDUCE_TENURE";
            if ("REDUCE_EMI".equals(type)) anyReduceEmi = true;
            withNew.add(Prepayment.builder()
                    .loan(loan)
                    .amount(req.getAmount())
                    .prepaymentDate(req.getPrepaymentDate() != null ? req.getPrepaymentDate() : LocalDate.now())
                    .prepaymentType(type)
                    .build());
        }
        withNew.sort(Comparator.comparing(Prepayment::getPrepaymentDate));

        List<AmortizationEntryResponse> newSchedule = buildSchedule(loan, paidEmis, withNew);
        double newTotalInterest = newSchedule.stream().mapToDouble(AmortizationEntryResponse::getInterest).sum();
        int newTenure           = newSchedule.size();
        LocalDate newClosure    = newSchedule.isEmpty() ? null
                : newSchedule.get(newSchedule.size() - 1).getDate();

        double originalEmi = calculateEmi(loan.getSanctionedAmount(), loan.getInterestRate(), loan.getTenureMonths());

        // Final EMI = the EMI of the last FULL month (balance > 0 after payment),
        // skipping the closing stub payment where outstanding ≈ 0.
        double newEmi = originalEmi;
        for (int i = newSchedule.size() - 1; i >= 0; i--) {
            AmortizationEntryResponse e = newSchedule.get(i);
            if (e.getEmi() > 0 && e.getBalance() > 0) { newEmi = e.getEmi(); break; }
        }
        // Fallback: if every entry has balance=0 (very short schedule), take last non-zero EMI
        if (newEmi == originalEmi) {
            for (int i = newSchedule.size() - 1; i >= 0; i--) {
                AmortizationEntryResponse e = newSchedule.get(i);
                if (e.getEmi() > 0) { newEmi = e.getEmi(); break; }
            }
        }
        double monthlyEmiSaving = anyReduceEmi ? round(originalEmi - newEmi) : 0.0;

        // ── Current loan state ──────────────────────────────────────────────────
        int monthsElapsed = (int) paidEmis.stream()
                .filter(p -> Boolean.TRUE.equals(p.getPaid())).count();

        double interestAlreadyPaid = 0;
        for (int i = 0; i < Math.min(monthsElapsed, originalSchedule.size()); i++) {
            interestAlreadyPaid += originalSchedule.get(i).getInterest();
        }

        double currentOutstanding;
        if (monthsElapsed == 0) {
            currentOutstanding = loan.getSanctionedAmount();
        } else if (monthsElapsed >= originalSchedule.size()) {
            currentOutstanding = 0;
        } else {
            currentOutstanding = originalSchedule.get(monthsElapsed - 1).getBalance();
        }
        double principalAlreadyPaid = round(loan.getSanctionedAmount() - currentOutstanding);

        // ── Simulation summary ──────────────────────────────────────────────────
        double totalPrepaymentAmount = reqs.stream().mapToDouble(PrepaymentRequest::getAmount).sum();

        // Balance right after the last simulated prepayment is applied in the new schedule
        double principalAfterPrepayments = Math.max(0, currentOutstanding - totalPrepaymentAmount);
        for (int i = newSchedule.size() - 1; i >= 0; i--) {
            if (newSchedule.get(i).isPrepaymentMonth()) {
                principalAfterPrepayments = newSchedule.get(i).getBalance();
                break;
            }
        }

        double originalTotalOutflow = loan.getSanctionedAmount() + originalTotalInterest;
        double newTotalOutflow      = loan.getSanctionedAmount() + newTotalInterest;
        int originalMonthsRemaining = Math.max(0, originalTenure - monthsElapsed);
        int newMonthsRemaining      = Math.max(0, newTenure      - monthsElapsed);

        return PrepaymentSimulationResponse.builder()
                // current state
                .monthsElapsed(monthsElapsed)
                .interestAlreadyPaid(round(interestAlreadyPaid))
                .principalAlreadyPaid(principalAlreadyPaid)
                .currentOutstanding(round(currentOutstanding))
                // simulation inputs
                .totalPrepaymentAmount(round(totalPrepaymentAmount))
                .principalAfterPrepayments(round(principalAfterPrepayments))
                // original
                .originalEmi(round(originalEmi))
                .originalTenureMonths(originalTenure)
                .originalMonthsRemaining(originalMonthsRemaining)
                .originalClosureDate(originalClosure)
                .originalTotalInterest(round(originalTotalInterest))
                .originalTotalOutflow(round(originalTotalOutflow))
                // new
                .newEmi(round(newEmi))
                .newTenureMonths(newTenure)
                .newMonthsRemaining(newMonthsRemaining)
                .newClosureDate(newClosure)
                .newTotalInterest(round(newTotalInterest))
                .newTotalOutflow(round(newTotalOutflow))
                // savings
                .interestSaved(round(originalTotalInterest - newTotalInterest))
                .monthsSaved(originalTenure - newTenure)
                .monthlyEmiSaving(monthlyEmiSaving)
                .build();
    }

    // ─── Insights ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PropertyInsightsResponse getInsights(Long userId, Long propertyId) {
        Property property = propertyService.findOwned(userId, propertyId);
        List<String> alerts = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        List<PropertyInsightsResponse.UpcomingPayment> upcoming = new ArrayList<>();
        java.util.LinkedHashMap<String, String> metrics = new java.util.LinkedHashMap<>();
        PropertyInsightsResponse.ChartData chartData = null;
        LocalDate today = LocalDate.now();

        // ── Builder installment section ──────────────────────────────────────────
        List<com.wordphrases.model.BuilderInstallment> installments = property.getInstallments();
        int totalInst   = installments.size();
        int paidInst    = (int) installments.stream().filter(i -> Boolean.TRUE.equals(i.getPaid())).count();
        double totalInstAmt = installments.stream().mapToDouble(i -> i.getAmount() != null ? i.getAmount() : 0).sum();
        double paidInstAmt  = installments.stream()
                .filter(i -> Boolean.TRUE.equals(i.getPaid()))
                .mapToDouble(i -> i.getAmount() != null ? i.getAmount() : 0).sum();
        int overdueInstCount = 0;

        for (com.wordphrases.model.BuilderInstallment inst : installments) {
            if (!Boolean.TRUE.equals(inst.getPaid()) && inst.getDueDate() != null) {
                boolean overdue = inst.getDueDate().isBefore(today);
                boolean dueSoon = !overdue && !inst.getDueDate().isAfter(today.plusDays(45));
                if (overdue) {
                    overdueInstCount++;
                    alerts.add("Builder installment overdue: \"" + inst.getDescription() +
                            "\" — ₹" + String.format("%,.0f", inst.getAmount()) + " was due on " + inst.getDueDate());
                }
                if (overdue || dueSoon) {
                    upcoming.add(PropertyInsightsResponse.UpcomingPayment.builder()
                            .type("INSTALLMENT")
                            .label(inst.getDescription() != null ? inst.getDescription() : "Installment")
                            .dueDate(inst.getDueDate().toString())
                            .amount(inst.getAmount())
                            .overdue(overdue)
                            .build());
                }
            }
        }

        // Possession date warning
        if (property.getPossessionDate() != null) {
            long daysToPos = today.until(property.getPossessionDate(), java.time.temporal.ChronoUnit.DAYS);
            if (daysToPos < 0) {
                if (paidInst < totalInst) {
                    alerts.add("Possession date has passed but " + (totalInst - paidInst) +
                            " builder installment(s) are still unpaid.");
                }
            } else if (daysToPos <= 90 && paidInst < totalInst) {
                alerts.add("Possession is in " + daysToPos + " days — " + (totalInst - paidInst) +
                        " installment(s) still pending (₹" + String.format("%,.0f", totalInstAmt - paidInstAmt) + ")");
            }
        }

        // Builder metrics
        if (totalInst > 0) {
            double builderPct = totalInstAmt > 0 ? (paidInstAmt / totalInstAmt) * 100 : 0;
            metrics.put("Builder Progress", String.format("%.0f%%", builderPct) +
                    " (" + paidInst + "/" + totalInst + " paid)");
            metrics.put("Builder Paid", "₹" + String.format("%,.0f", paidInstAmt));
            metrics.put("Builder Remaining", "₹" + String.format("%,.0f", totalInstAmt - paidInstAmt));
        }

        // ── Loan / EMI section ───────────────────────────────────────────────────
        Loan loan = loanRepository.findByProperty(property).orElse(null);
        if (loan != null) {
            List<EmiPayment> paidEmis    = emiPaymentRepository.findByLoanOrderByMonthNumberAsc(loan);
            List<Prepayment> prepayments = prepaymentRepository.findByLoanOrderByPrepaymentDateAsc(loan);
            List<AmortizationEntryResponse> schedule = buildSchedule(loan, paidEmis, prepayments);

            double totalInterest  = schedule.stream().mapToDouble(AmortizationEntryResponse::getInterest).sum();
            double paidInterest   = schedule.stream().filter(e -> Boolean.TRUE.equals(e.getPaid()))
                                        .mapToDouble(AmortizationEntryResponse::getInterest).sum();
            double paidPrincipal  = schedule.stream().filter(e -> Boolean.TRUE.equals(e.getPaid()))
                                        .mapToDouble(AmortizationEntryResponse::getPrincipal).sum();
            double totalPrepaid   = prepayments.stream().mapToDouble(Prepayment::getAmount).sum();
            long   paidEmiCount   = schedule.stream().filter(e -> Boolean.TRUE.equals(e.getPaid())).count();
            long   remainingCount = schedule.stream().filter(e -> !Boolean.TRUE.equals(e.getPaid())).count();
            double emi            = calculateEmi(loan.getSanctionedAmount(), loan.getInterestRate(), loan.getTenureMonths());
            double interestBurden = loan.getSanctionedAmount() > 0
                    ? (totalInterest / loan.getSanctionedAmount()) * 100 : 0;
            double principalRepaidPct = loan.getSanctionedAmount() > 0
                    ? ((paidPrincipal + totalPrepaid) / loan.getSanctionedAmount()) * 100 : 0;

            // Estimated closure
            LocalDate closureDate = schedule.isEmpty() ? null
                    : schedule.get(schedule.size() - 1).getDate();

            // Upcoming unpaid EMIs (all overdue + next due-soon)
            int overdueEmiCount = 0;
            boolean nextEmiAdded = false;
            for (AmortizationEntryResponse entry : schedule) {
                if (!Boolean.TRUE.equals(entry.getPaid())) {
                    boolean overdue = entry.getDate().isBefore(today);
                    boolean dueSoon = !overdue && !entry.getDate().isAfter(today.plusDays(45));
                    if (overdue) {
                        overdueEmiCount++;
                        upcoming.add(PropertyInsightsResponse.UpcomingPayment.builder()
                                .type("EMI").label("EMI #" + entry.getMonth())
                                .dueDate(entry.getDate().toString())
                                .amount(entry.getEmi()).overdue(true).build());
                    } else if (dueSoon && !nextEmiAdded) {
                        upcoming.add(PropertyInsightsResponse.UpcomingPayment.builder()
                                .type("EMI").label("EMI #" + entry.getMonth())
                                .dueDate(entry.getDate().toString())
                                .amount(entry.getEmi()).overdue(false).build());
                        nextEmiAdded = true;
                    }
                }
            }
            if (overdueEmiCount > 0) {
                alerts.add(overdueEmiCount + " EMI" + (overdueEmiCount > 1 ? "s are" : " is") +
                        " overdue. Paying quickly avoids credit score impact.");
            }

            // Loan metrics
            metrics.put("EMI", "₹" + String.format("%,.0f", emi) + "/mo");
            metrics.put("EMIs Paid", paidEmiCount + " of " + schedule.size());
            metrics.put("Principal Repaid", String.format("%.1f%%", Math.min(principalRepaidPct, 100)) +
                    " (₹" + String.format("%,.0f", paidPrincipal + totalPrepaid) + ")");
            metrics.put("Interest Burden", String.format("%.1f%%", interestBurden) + " of principal");
            metrics.put("Total Interest", "₹" + String.format("%,.0f", totalInterest));
            metrics.put("Interest Saved via Prepayments",
                    totalPrepaid > 0 ? "₹" + String.format("%,.0f", totalPrepaid) + " prepaid" : "None yet");
            if (closureDate != null) {
                metrics.put("Loan Closure", closureDate.toString());
                long monthsLeft = today.until(closureDate, java.time.temporal.ChronoUnit.MONTHS);
                metrics.put("Years Remaining", monthsLeft > 0 ?
                        String.format("%.1f yrs (%d mo)", monthsLeft / 12.0, monthsLeft) : "Completed");
            }

            // ── Suggestions ──────────────────────────────────────────────────────
            // Interest burden
            if (interestBurden > 60) {
                suggestions.add("Your total interest (" + String.format("%.0f%%", interestBurden) +
                        " of principal) is very high. A lump-sum prepayment now would save substantial interest — " +
                        "even ₹1–2L can close the loan months earlier.");
            } else if (interestBurden > 30 && totalPrepaid == 0) {
                suggestions.add("Total interest is " + String.format("%.0f%%", interestBurden) +
                        " of your principal. Starting prepayments — even ₹50,000/year — can reduce your burden significantly.");
            }

            // Long tenure
            if (remainingCount > 180) {
                long yearsLeft = remainingCount / 12;
                suggestions.add("You have " + yearsLeft + "+ years of EMIs remaining. " +
                        "Increasing your EMI by just 5–10% annually can cut 3–5 years off your tenure.");
            } else if (remainingCount > 60 && remainingCount <= 180) {
                suggestions.add("" + (remainingCount / 12) + " years left. " +
                        "You're in the interest-heavy phase — prepaying principal now gives the highest savings.");
            } else if (remainingCount > 0 && remainingCount <= 24) {
                suggestions.add("Almost done! Only " + remainingCount + " EMIs left. " +
                        "Consider a final prepayment to close the loan early and save on the last bit of interest.");
            }

            // High interest rate
            if (loan.getInterestRate() != null && loan.getInterestRate() > 9.0) {
                suggestions.add("Your interest rate of " + loan.getInterestRate() + "% is above market average. " +
                        "Consider refinancing if a lender offers below 8.5% — the savings over the tenure can be significant.");
            }

            // Prepayment celebration
            if (totalPrepaid > 0 && totalPrepaid >= loan.getSanctionedAmount() * 0.05) {
                suggestions.add("You've prepaid " + String.format("%.1f%%", (totalPrepaid / loan.getSanctionedAmount()) * 100) +
                        " of your principal (₹" + String.format("%,.0f", totalPrepaid) + ") — great discipline! " +
                        "Keep it up to close early.");
            } else if (totalPrepaid > 0) {
                suggestions.add("₹" + String.format("%,.0f", totalPrepaid) + " prepaid so far. " +
                        "Try to prepay at least 1 full EMI extra per year for compounding benefits.");
            }

            // High EMI relative to property value
            if (property.getTotalCost() != null && property.getTotalCost() > 0) {
                double emiPct = (emi / property.getTotalCost()) * 100;
                if (emiPct > 0.5) {
                    suggestions.add("Your monthly EMI is " + String.format("%.2f%%", emiPct) +
                            " of the property value — ensure this fits comfortably within your income.");
                }
            }

            // Possession vs loan closure
            if (property.getPossessionDate() != null && closureDate != null &&
                    property.getPossessionDate().isAfter(closureDate)) {
                suggestions.add("Your loan will close " + closureDate + " — before the possession date " +
                        property.getPossessionDate() + ". Great planning!");
            }

            // ── Chart data ────────────────────────────────────────────────────────────
            List<String> scheduleLabels      = new ArrayList<>();
            List<Double> balanceData         = new ArrayList<>();
            List<Double> principalData       = new ArrayList<>();
            List<Double> interestData        = new ArrayList<>();
            LinkedHashMap<Integer, double[]> yearMap = new LinkedHashMap<>();
            int todayIdx = -1;

            for (int i = 0; i < schedule.size(); i++) {
                AmortizationEntryResponse e = schedule.get(i);
                LocalDate d = e.getDate();
                String lbl = d.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                        + "-" + String.valueOf(d.getYear()).substring(2);
                scheduleLabels.add(lbl);
                balanceData.add(round(e.getBalance()));
                principalData.add(round(e.getPrincipal()));
                interestData.add(round(e.getInterest()));
                double[] ya = yearMap.computeIfAbsent(d.getYear(), k -> new double[]{0.0, 0.0});
                ya[0] += e.getPrincipal();
                ya[1] += e.getInterest();
                if (!d.isAfter(today)) todayIdx = i;
            }

            List<String> yearLabels  = new ArrayList<>(yearMap.keySet().stream().map(String::valueOf).toList());
            List<Double> yrPrincipal = yearMap.values().stream().map(v -> round(v[0])).collect(Collectors.toList());
            List<Double> yrInterest  = yearMap.values().stream().map(v -> round(v[1])).collect(Collectors.toList());

            double principalRetired   = paidPrincipal + totalPrepaid;
            double principalRemaining = Math.max(0, loan.getSanctionedAmount() - principalRetired);
            double interestRemaining  = Math.max(0, totalInterest - paidInterest);

            chartData = PropertyInsightsResponse.ChartData.builder()
                    .labels(scheduleLabels)
                    .balance(balanceData)
                    .principal(principalData)
                    .interest(interestData)
                    .todayIndex(todayIdx)
                    .yearLabels(yearLabels)
                    .yearlyPrincipal(yrPrincipal)
                    .yearlyInterest(yrInterest)
                    .principalPaid(round(principalRetired))
                    .principalRemaining(round(principalRemaining))
                    .interestPaid(round(paidInterest))
                    .interestRemaining(round(interestRemaining))
                    .builderPaid(totalInst > 0 ? round(paidInstAmt) : null)
                    .builderRemaining(totalInst > 0 ? round(totalInstAmt - paidInstAmt) : null)
                    .build();

        } else {
            suggestions.add("No loan added yet. If this property has a bank loan, add it to track EMIs and get a full financial breakdown.");
        }

        // All caught up?
        if (alerts.isEmpty() && overdueInstCount == 0) {
            suggestions.add("No overdue payments — you're on track! Keep your EMI payments timely to maintain a healthy credit score.");
        }

        upcoming.sort(Comparator.comparing(PropertyInsightsResponse.UpcomingPayment::getDueDate));
        return PropertyInsightsResponse.builder()
                .alerts(alerts)
                .suggestions(suggestions)
                .metrics(metrics)
                .upcomingPayments(upcoming)
                .chartData(chartData)
                .build();
    }

    // ─── Schedule Builder ─────────────────────────────────────────────────────────

    /**
     * Builds a full amortization schedule accounting for all prepayments.
     * Respects REDUCE_TENURE (default) and REDUCE_EMI prepayment types.
     */
    private List<AmortizationEntryResponse> buildSchedule(Loan loan,
                                                           List<EmiPayment> payments,
                                                           List<Prepayment> prepayments) {
        if (loan.getEmiStartDate() == null || loan.getSanctionedAmount() == null) return List.of();

        double outstanding = loan.getSanctionedAmount();
        double annualRate  = loan.getInterestRate();
        double monthlyRate = annualRate / 12.0 / 100.0;
        int    remaining   = loan.getTenureMonths();
        double emi         = calculateEmi(outstanding, annualRate, remaining);

        // Index paid months for O(1) lookup
        Set<Integer> paidMonths = payments.stream()
                .filter(p -> Boolean.TRUE.equals(p.getPaid()))
                .map(EmiPayment::getMonthNumber)
                .collect(Collectors.toSet());

        // Group prepayments by year-month for O(1) lookup
        Map<String, List<Prepayment>> prepaymentsByYM = prepayments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPrepaymentDate().getYear() + "-" + p.getPrepaymentDate().getMonthValue()
                ));

        List<AmortizationEntryResponse> schedule = new ArrayList<>();
        LocalDate date = loan.getEmiStartDate();

        for (int month = 1; outstanding > 0.5 && month <= 600; month++) {
            String ym = date.getYear() + "-" + date.getMonthValue();
            List<Prepayment> monthPrepayments = prepaymentsByYM.getOrDefault(ym, List.of());
            double prepaidThisMonth = monthPrepayments.stream().mapToDouble(Prepayment::getAmount).sum();
            boolean isReduceEmi    = monthPrepayments.stream()
                    .anyMatch(p -> "REDUCE_EMI".equals(p.getPrepaymentType()));

            // Apply prepayments first
            if (prepaidThisMonth > 0) {
                outstanding = Math.max(0, outstanding - prepaidThisMonth);
                if (outstanding <= 0.5) {
                    schedule.add(AmortizationEntryResponse.builder()
                            .month(month).date(date).emi(0.0).interest(0.0).principal(0.0)
                            .balance(0.0).paid(paidMonths.contains(month))
                            .prepaymentMonth(true).prepaidAmount(prepaidThisMonth).build());
                    break;
                }
                // Recalculate EMI or remaining tenure
                if (isReduceEmi) {
                    // 'remaining' is already the correct months-left value for this iteration.
                    // Keep tenure the same; only reduce the EMI.
                    emi = calculateEmi(outstanding, annualRate, Math.max(1, remaining));
                } else {
                    // REDUCE_TENURE: recompute remaining tenure with same EMI
                    remaining = computeRemainingTenure(outstanding, annualRate, emi);
                }
            }

            double interest   = outstanding * monthlyRate;
            double principal  = Math.min(emi - interest, outstanding);
            if (principal <= 0) principal = outstanding; // final month adjustment
            outstanding = Math.max(0, outstanding - principal);
            remaining   = Math.max(0, remaining - 1);

            schedule.add(AmortizationEntryResponse.builder()
                    .month(month)
                    .date(date)
                    .emi(round(interest + principal))
                    .interest(round(interest))
                    .principal(round(principal))
                    .balance(round(outstanding))
                    .paid(paidMonths.contains(month))
                    .prepaymentMonth(prepaidThisMonth > 0)
                    .prepaidAmount(prepaidThisMonth > 0 ? prepaidThisMonth : null)
                    .build());

            date = date.plusMonths(1);
        }

        return schedule;
    }

    private int computeRemainingTenure(double principal, double annualRate, double emi) {
        if (annualRate == 0) return (int) Math.ceil(principal / emi);
        double r = annualRate / 12.0 / 100.0;
        if (emi <= principal * r) return 600; // infinite — EMI too small
        return (int) Math.ceil(-Math.log(1 - (principal * r / emi)) / Math.log(1 + r));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private Loan findLoan(Long userId, Long propertyId) {
        Property property = propertyService.findOwned(userId, propertyId);
        return loanRepository.findByProperty(property)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found for this property"));
    }

    private LoanResponse toResponse(Loan loan) {
        List<EmiPayment> payments    = emiPaymentRepository.findByLoanOrderByMonthNumberAsc(loan);
        List<Prepayment> prepayments = prepaymentRepository.findByLoanOrderByPrepaymentDateAsc(loan);
        List<AmortizationEntryResponse> schedule = buildSchedule(loan, payments, prepayments);

        int paidCount = (int) schedule.stream().filter(e -> Boolean.TRUE.equals(e.getPaid())).count();
        double outstanding = schedule.isEmpty() ? loan.getSanctionedAmount()
                : schedule.stream().filter(e -> !Boolean.TRUE.equals(e.getPaid()))
                          .mapToDouble(AmortizationEntryResponse::getBalance).findFirst()
                          .orElse(0.0);
        double totalInterest   = schedule.stream().mapToDouble(AmortizationEntryResponse::getInterest).sum();
        double totalPrepaid    = prepayments.stream().mapToDouble(Prepayment::getAmount).sum();
        double computedEmi     = calculateEmi(loan.getSanctionedAmount(), loan.getInterestRate(), loan.getTenureMonths());

        // Enriched computed fields
        LocalDate start               = loan.getEmiStartDate();
        LocalDate closureDate         = start != null ? start.plusMonths(loan.getTenureMonths() - 1L) : null;
        LocalDate nextEmiDueDate      = start != null ? start.plusMonths(paidCount) : null;
        Long daysUntilNextEmi         = nextEmiDueDate != null
                                        ? ChronoUnit.DAYS.between(LocalDate.now(), nextEmiDueDate) : null;
        double safeOutstanding        = Math.max(0, outstanding);
        double principalRepaid        = round(loan.getSanctionedAmount() - safeOutstanding);
        double percentComplete        = round((paidCount * 100.0) / loan.getTenureMonths());
        double interestCostRatio      = round((totalInterest / loan.getSanctionedAmount()) * 100.0);
        double currentMonthInterest   = round(safeOutstanding * loan.getInterestRate() / 1200.0);
        double currentMonthPrincipal  = round(computedEmi - currentMonthInterest);

        return LoanResponse.builder()
                .id(loan.getId())
                .sanctionedAmount(loan.getSanctionedAmount())
                .interestRate(loan.getInterestRate())
                .interestType(loan.getInterestType())
                .tenureMonths(loan.getTenureMonths())
                .emiStartDate(loan.getEmiStartDate())
                .bankName(loan.getBankName())
                .accountNumber(loan.getAccountNumber())
                .createdAt(loan.getCreatedAt())
                .computedEmi(computedEmi)
                .totalInterest(round(totalInterest))
                .totalPayment(round(loan.getSanctionedAmount() + totalInterest))
                .outstandingBalance(round(safeOutstanding))
                .paidEmiCount(paidCount)
                .remainingEmiCount(schedule.size() - paidCount)
                .totalPrepaid(round(totalPrepaid))
                .closureDate(closureDate)
                .nextEmiDueDate(nextEmiDueDate)
                .daysUntilNextEmi(daysUntilNextEmi)
                .principalRepaid(principalRepaid)
                .percentComplete(percentComplete)
                .interestCostRatio(interestCostRatio)
                .currentMonthInterest(currentMonthInterest)
                .currentMonthPrincipal(currentMonthPrincipal)
                .build();
    }

    private PrepaymentResponse toPrepaymentResponse(Prepayment p) {
        return PrepaymentResponse.builder()
                .id(p.getId())
                .amount(p.getAmount())
                .prepaymentDate(p.getPrepaymentDate())
                .prepaymentType(p.getPrepaymentType())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
