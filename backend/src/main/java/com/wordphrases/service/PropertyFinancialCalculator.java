package com.wordphrases.service;

import com.wordphrases.dto.response.AmortizationEntryResponse;
import com.wordphrases.model.EmiPayment;
import com.wordphrases.model.Loan;
import com.wordphrases.model.Prepayment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/** Pure financial calculations. Database access and presentation stay outside this class. */
public final class PropertyFinancialCalculator {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal TWELVE = BigDecimal.valueOf(12);
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal CENT = BigDecimal.valueOf(0.01);

    private PropertyFinancialCalculator() { }

    public static BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualRate, int tenureMonths) {
        if (tenureMonths <= 0) throw new IllegalArgumentException("Tenure must be positive");
        BigDecimal monthlyRate = annualRate.divide(TWELVE.multiply(HUNDRED), 20, RoundingMode.HALF_UP);
        if (monthlyRate.signum() == 0) return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        BigDecimal growth = BigDecimal.ONE.add(monthlyRate).pow(tenureMonths);
        return principal.multiply(monthlyRate).multiply(growth)
                .divide(growth.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
    }

    public static List<AmortizationEntryResponse> buildSchedule(Loan loan,
                                                                  List<EmiPayment> payments,
                                                                  List<Prepayment> prepayments) {
        if (loan.getEmiStartDate() == null || loan.getSanctionedAmount() == null) return List.of();

        BigDecimal balance = money(loan.getSanctionedAmount());
        BigDecimal annualRate = money(loan.getInterestRate());
        BigDecimal monthlyRate = annualRate.divide(TWELVE.multiply(HUNDRED), 20, RoundingMode.HALF_UP);
        int remaining = loan.getTenureMonths();
        BigDecimal emi = calculateEmi(balance, annualRate, remaining);
        Set<Integer> paidMonths = payments.stream().filter(p -> Boolean.TRUE.equals(p.getPaid()))
                .map(EmiPayment::getMonthNumber).collect(Collectors.toSet());
        Map<String, List<Prepayment>> byMonth = prepayments.stream().collect(Collectors.groupingBy(
                p -> p.getPrepaymentDate().getYear() + "-" + p.getPrepaymentDate().getMonthValue()));
        List<AmortizationEntryResponse> schedule = new ArrayList<>();
        LocalDate date = loan.getEmiStartDate();

        for (int month = 1; balance.compareTo(BigDecimal.valueOf(0.50)) > 0 && month <= 600; month++) {
            String key = date.getYear() + "-" + date.getMonthValue();
            List<Prepayment> monthPrepayments = byMonth.getOrDefault(key, List.of());
            BigDecimal prepaid = monthPrepayments.stream().map(Prepayment::getAmount).map(PropertyFinancialCalculator::money)
                    .reduce(ZERO, BigDecimal::add);
            boolean reduceEmi = monthPrepayments.stream().anyMatch(p -> "REDUCE_EMI".equals(p.getPrepaymentType()));
            if (prepaid.signum() > 0) {
                balance = balance.subtract(prepaid).max(ZERO);
                if (balance.compareTo(BigDecimal.valueOf(0.50)) <= 0) {
                    schedule.add(entry(month, date, ZERO, ZERO, ZERO, ZERO, paidMonths.contains(month), true, prepaid));
                    break;
                }
                if (reduceEmi) emi = calculateEmi(balance, annualRate, Math.max(1, remaining));
                else remaining = computeRemainingTenure(balance, annualRate, emi);
            }
            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = emi.subtract(interest).min(balance);
            if (principal.signum() <= 0) principal = balance;
            balance = balance.subtract(principal).max(ZERO);
            remaining = Math.max(0, remaining - 1);
            schedule.add(entry(month, date, interest.add(principal), interest, principal, balance,
                    paidMonths.contains(month), prepaid.signum() > 0, prepaid.signum() > 0 ? prepaid : null));
            date = date.plusMonths(1);
        }
        return schedule;
    }

    public static boolean isClosed(List<AmortizationEntryResponse> schedule) {
        if (schedule.isEmpty()) return false;
        return schedule.get(schedule.size() - 1).getBalance() <= 0.01
                && schedule.stream().allMatch(e -> Boolean.TRUE.equals(e.getPaid()));
    }

    public static BigDecimal sumInterest(List<AmortizationEntryResponse> schedule) {
        return schedule.stream().map(e -> money(e.getInterest())).reduce(ZERO, BigDecimal::add);
    }

    public static BigDecimal sumPrincipal(List<AmortizationEntryResponse> schedule) {
        return schedule.stream().map(e -> money(e.getPrincipal())).reduce(ZERO, BigDecimal::add);
    }

    private static int computeRemainingTenure(BigDecimal principal, BigDecimal annualRate, BigDecimal emi) {
        BigDecimal monthlyRate = annualRate.divide(TWELVE.multiply(HUNDRED), 20, RoundingMode.HALF_UP);
        if (monthlyRate.signum() == 0) return principal.divide(emi, 0, RoundingMode.CEILING).intValue();
        if (emi.compareTo(principal.multiply(monthlyRate)) <= 0) return 600;
        double result = -Math.log(1 - principal.doubleValue() * monthlyRate.doubleValue() / emi.doubleValue())
                / Math.log(1 + monthlyRate.doubleValue());
        return (int) Math.ceil(result);
    }

    private static AmortizationEntryResponse entry(int month, LocalDate date, BigDecimal emi, BigDecimal interest,
                                                    BigDecimal principal, BigDecimal balance, boolean paid,
                                                    boolean prepaymentMonth, BigDecimal prepaid) {
        return AmortizationEntryResponse.builder().month(month).date(date)
                .emi(emi.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .interest(interest.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .principal(principal.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .balance(balance.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .paid(paid).prepaymentMonth(prepaymentMonth)
                .prepaidAmount(prepaid == null ? null : prepaid.setScale(2, RoundingMode.HALF_UP).doubleValue())
                .build();
    }

    private static BigDecimal money(Double value) { return value == null ? ZERO : BigDecimal.valueOf(value); }
}
