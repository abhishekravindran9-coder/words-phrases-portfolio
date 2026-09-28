package com.wordphrases.service;

import com.wordphrases.dto.request.BuilderInstallmentRequest;
import com.wordphrases.dto.request.MarkInstallmentPaidRequest;
import com.wordphrases.dto.request.PropertyRequest;
import com.wordphrases.dto.response.BuilderInstallmentResponse;
import com.wordphrases.dto.response.PropertyResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.BuilderInstallment;
import com.wordphrases.model.Property;
import com.wordphrases.model.User;
import com.wordphrases.model.Prepayment;
import com.wordphrases.model.EmiPayment;
import com.wordphrases.model.PropertyMoneyAudit;
import com.wordphrases.repository.BuilderInstallmentRepository;
import com.wordphrases.repository.EmiPaymentRepository;
import com.wordphrases.repository.PrepaymentRepository;
import com.wordphrases.repository.PropertyRepository;
import com.wordphrases.repository.PropertyMoneyAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final BuilderInstallmentRepository installmentRepository;
    private final EmiPaymentRepository emiPaymentRepository;
    private final PrepaymentRepository prepaymentRepository;
    private final UserService userService;
    private final PropertyMoneyAuditRepository auditRepository;

    // ─── Property CRUD ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PropertyResponse> getAll(Long userId) {
        return getAll(userId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getAll(Long userId, LocalDate today) {
        User user = userService.getUserById(userId);
        return propertyRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(property -> toResponse(property, today)).toList();
    }

    @Transactional(readOnly = true)
    public PropertyResponse getById(Long userId, Long propertyId) {
        return toResponse(findOwned(userId, propertyId), LocalDate.now());
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public PropertyResponse create(Long userId, PropertyRequest req) {
        User user = userService.getUserById(userId);
        Property property = Property.builder()
                .user(user)
                .name(req.getName())
                .builderName(req.getBuilderName())
                .totalCost(req.getTotalCost())
                .location(req.getLocation())
                .possessionDate(req.getPossessionDate())
                .selfContributionPlanned(nullOr(req.getSelfContributionPlanned(), 0.0))
                .loanAmountPlanned(nullOr(req.getLoanAmountPlanned(), 0.0))
                .build();
        return toResponse(propertyRepository.save(property), LocalDate.now());
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public PropertyResponse update(Long userId, Long propertyId, PropertyRequest req) {
        Property property = findOwned(userId, propertyId);
        if (req.getName() != null)                          property.setName(req.getName());
        if (req.getBuilderName() != null)                   property.setBuilderName(req.getBuilderName());
        if (req.getTotalCost() != null) {
            audit(userId, "PROPERTY", propertyId, "totalCost", property.getTotalCost(), req.getTotalCost());
            property.setTotalCost(req.getTotalCost());
        }
        if (req.getLocation() != null)                      property.setLocation(req.getLocation());
        if (req.getPossessionDate() != null)                property.setPossessionDate(req.getPossessionDate());
        if (req.getSelfContributionPlanned() != null) {
            audit(userId, "PROPERTY", propertyId, "selfContributionPlanned", property.getSelfContributionPlanned(), req.getSelfContributionPlanned());
            property.setSelfContributionPlanned(req.getSelfContributionPlanned());
        }
        if (req.getLoanAmountPlanned() != null) {
            audit(userId, "PROPERTY", propertyId, "loanAmountPlanned", property.getLoanAmountPlanned(), req.getLoanAmountPlanned());
            property.setLoanAmountPlanned(req.getLoanAmountPlanned());
        }
        return toResponse(propertyRepository.save(property), LocalDate.now());
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public void delete(Long userId, Long propertyId) {
        Property property = findOwned(userId, propertyId);
        property.setDeletedAt(java.time.Instant.now());
        propertyRepository.save(property);
    }

    private void audit(Long userId, String entityType, Long entityId, String field, Object oldValue, Object newValue) {
        if (java.util.Objects.equals(oldValue, newValue)) return;
        auditRepository.save(PropertyMoneyAudit.builder().userId(userId).entityType(entityType)
                .entityId(entityId).fieldName(field).oldValue(String.valueOf(oldValue))
                .newValue(String.valueOf(newValue)).changedAt(java.time.Instant.now()).build());
    }

    @Transactional(readOnly = true)
    public java.util.List<PropertyMoneyAudit> getAudit(Long userId, Long propertyId) {
        findOwned(userId, propertyId);
        return auditRepository.findAll().stream().filter(a -> a.getEntityId().equals(propertyId)
                || ("INSTALLMENT".equals(a.getEntityType()) && a.getEntityId() != null)).toList();
    }

    // ─── Builder Installments ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BuilderInstallmentResponse> getInstallments(Long userId, Long propertyId) {
        Property property = findOwned(userId, propertyId);
        return installmentRepository.findByPropertyOrderByDueDateAsc(property)
                .stream().map(this::toInstallmentResponse).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public BuilderInstallmentResponse addInstallment(Long userId, Long propertyId, BuilderInstallmentRequest req) {
        Property property = findOwned(userId, propertyId);
        BuilderInstallment inst = BuilderInstallment.builder()
                .property(property)
                .amount(req.getAmount())
                .dueDate(req.getDueDate())
                .description(req.getDescription())
                .build();
        return toInstallmentResponse(installmentRepository.save(inst));
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public BuilderInstallmentResponse updateInstallment(Long userId, Long propertyId, Long instId,
                                                        BuilderInstallmentRequest req) {
        Property property = findOwned(userId, propertyId);
        BuilderInstallment inst = installmentRepository.findByIdAndProperty(instId, property)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found"));
        if (req.getAmount() != null) {
            audit(userId, "INSTALLMENT", instId, "amount", inst.getAmount(), req.getAmount());
            inst.setAmount(req.getAmount());
        }
        if (req.getDueDate() != null)     inst.setDueDate(req.getDueDate());
        if (req.getDescription() != null) inst.setDescription(req.getDescription());
        if (req.getPayeeType() != null) inst.setPayeeType(req.getPayeeType());
        if (req.getPaymentReference() != null) inst.setPaymentReference(req.getPaymentReference());
        if (req.getPaymentMode() != null) inst.setPaymentMode(req.getPaymentMode());
        return toInstallmentResponse(installmentRepository.save(inst));
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public BuilderInstallmentResponse markInstallmentPaid(Long userId, Long propertyId, Long instId,
                                                          MarkInstallmentPaidRequest req) {
        Property property = findOwned(userId, propertyId);
        BuilderInstallment inst = installmentRepository.findByIdAndProperty(instId, property)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found"));
        inst.setPaid(true);
        audit(userId, "INSTALLMENT", instId, "paid", inst.getPaid(), true);
        audit(userId, "INSTALLMENT", instId, "paidViaLoan", inst.getPaidViaLoan(), nullOr(req.getPaidViaLoan(), 0.0));
        audit(userId, "INSTALLMENT", instId, "paidViaSelf", inst.getPaidViaSelf(), nullOr(req.getPaidViaSelf(), 0.0));
        inst.setPaidViaLoan(nullOr(req.getPaidViaLoan(), 0.0));
        inst.setPaidViaSelf(nullOr(req.getPaidViaSelf(), 0.0));
        inst.setPaidDate(req.getPaidDate() != null ? req.getPaidDate() : LocalDate.now());
        inst.setPayeeType(req.getPayeeType());
        inst.setPaymentReference(req.getPaymentReference());
        inst.setPaymentMode(req.getPaymentMode());
        return toInstallmentResponse(installmentRepository.save(inst));
    }

    @Transactional
    @CacheEvict(cacheNames = "today", allEntries = true)
    public void deleteInstallment(Long userId, Long propertyId, Long instId) {
        Property property = findOwned(userId, propertyId);
        BuilderInstallment inst = installmentRepository.findByIdAndProperty(instId, property)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found"));
        installmentRepository.delete(inst);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public Property findOwned(Long userId, Long propertyId) {
        User user = userService.getUserById(userId);
        return propertyRepository.findByIdAndUser(propertyId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
    }

    private PropertyResponse toResponse(Property p, LocalDate today) {
        List<BuilderInstallment> installments = installmentRepository.findByPropertyOrderByDueDateAsc(p);
        int totalInst = installments.size();
        int paidInst  = (int) installments.stream().filter(i -> Boolean.TRUE.equals(i.getPaid())).count();
        double totalAmt = installments.stream().mapToDouble(i -> nullOr(i.getAmount(), 0.0)).sum();
        double paidAmt  = installments.stream()
                .filter(i -> Boolean.TRUE.equals(i.getPaid()))
                .mapToDouble(i -> nullOr(i.getAmount(), 0.0)).sum();
        double paidViaSelf = installments.stream().mapToDouble(i -> nullOr(i.getPaidViaSelf(), 0.0)).sum();
        double paidViaLoan = installments.stream().mapToDouble(i -> nullOr(i.getPaidViaLoan(), 0.0)).sum();
        int overdueCount = (int) installments.stream().filter(i -> !Boolean.TRUE.equals(i.getPaid())
            && i.getDueDate() != null && i.getDueDate().isBefore(today)).count();
        double overdueAmount = installments.stream().filter(i -> !Boolean.TRUE.equals(i.getPaid())
            && i.getDueDate() != null && i.getDueDate().isBefore(today))
            .mapToDouble(i -> nullOr(i.getAmount(), 0.0)).sum();
        LocalDate oldestOverdueDate = installments.stream().filter(i -> !Boolean.TRUE.equals(i.getPaid())
            && i.getDueDate() != null && i.getDueDate().isBefore(today))
            .map(BuilderInstallment::getDueDate).min(LocalDate::compareTo).orElse(null);
        double pct = totalAmt > 0 ? (paidAmt / totalAmt) * 100 : 0.0;

        // Possession countdown
        Long daysToPoassession = p.getPossessionDate() != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), p.getPossessionDate()) : null;

        // Next unpaid installment
        Optional<BuilderInstallment> nextOpt = installments.stream()
                .filter(i -> !Boolean.TRUE.equals(i.getPaid()) && i.getDueDate() != null)
                .min(Comparator.comparing(BuilderInstallment::getDueDate));
        Double nextInstAmt  = nextOpt.map(BuilderInstallment::getAmount).orElse(null);
        LocalDate nextInstDate = nextOpt.map(BuilderInstallment::getDueDate).orElse(null);
        String nextInstDesc = nextOpt.map(BuilderInstallment::getDescription).orElse(null);

        // Loan enrichment
        var loan = p.getLoan();
        Double loanEmi = null;
        Double loanOutstanding = null;
        Integer loanPaidCount = null;
        Integer loanTotalMonths = null;
        Double loanPercentRepaid = null;
        boolean loanClosed = false;
        LocalDate loanActualClosureDate = null;
        Integer loanMonthsSaved = null;
        if (loan != null) {
            loanTotalMonths = loan.getTenureMonths();
            double r = loan.getInterestRate() / 1200.0;
            double n = loanTotalMonths;
            double principal = loan.getSanctionedAmount();
            loanEmi = r == 0 ? round(principal / n)
                    : round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
            int paid = (int) emiPaymentRepository.findByLoanOrderByMonthNumberAsc(loan)
                    .stream().filter(ep -> Boolean.TRUE.equals(ep.getPaid())).count();
            loanPaidCount = paid;

            List<Prepayment> prepList = prepaymentRepository.findByLoanOrderByPrepaymentDateAsc(loan);
            List<EmiPayment> payments = emiPaymentRepository.findByLoanOrderByMonthNumberAsc(loan);
            List<com.wordphrases.dto.response.AmortizationEntryResponse> schedule = PropertyFinancialCalculator.buildSchedule(loan, payments, prepList);
            double balance = schedule.stream().filter(e -> Boolean.TRUE.equals(e.getPaid()))
                    .mapToDouble(com.wordphrases.dto.response.AmortizationEntryResponse::getBalance)
                    .reduce((first, second) -> second).orElse(principal);
            loanOutstanding = round(balance);
            loanPercentRepaid = round(Math.min(100, ((principal - balance) / principal) * 100));
            loanClosed = PropertyFinancialCalculator.isClosed(schedule);
            loanActualClosureDate = schedule.isEmpty() ? null : schedule.get(schedule.size() - 1).getDate();
            loanMonthsSaved = Math.max(0, loan.getTenureMonths() - schedule.size());
        }

        return PropertyResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .builderName(p.getBuilderName())
                .totalCost(p.getTotalCost())
                .location(p.getLocation())
                .possessionDate(p.getPossessionDate())
                .selfContributionPlanned(p.getSelfContributionPlanned())
                .loanAmountPlanned(p.getLoanAmountPlanned())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .totalInstallments(totalInst)
                .paidInstallments(paidInst)
                .totalInstallmentAmount(totalAmt)
                .paidInstallmentAmount(paidAmt)
                .percentComplete(round(pct))
                .hasLoan(loan != null)
                .daysToPoassession(daysToPoassession)
                .loanEmi(loanEmi)
                .loanOutstanding(loanOutstanding)
                .loanPaidCount(loanPaidCount)
                .loanTotalMonths(loanTotalMonths)
                .loanPercentRepaid(loanPercentRepaid)
                .loanClosed(loanClosed)
                .loanActualClosureDate(loanActualClosureDate)
                .loanMonthsSaved(loanMonthsSaved)
                .nextInstallmentAmount(nextInstAmt)
                .nextInstallmentDate(nextInstDate)
                .nextInstallmentDescription(nextInstDesc)
                .pendingInstallmentAmount(Math.max(0, totalAmt - paidAmt))
                .paidViaSelf(paidViaSelf)
                .paidViaLoan(paidViaLoan)
                .overdueInstallmentCount(overdueCount)
                .overdueInstallmentAmount(overdueAmount)
                .longestOverdueDays(oldestOverdueDate == null ? 0L : ChronoUnit.DAYS.between(oldestOverdueDate, today))
                .propertyStatus(p.getPossessionDate() != null && !p.getPossessionDate().isAfter(today) ? "POSSESSED" : "IN_PROGRESS")
                .build();
    }

    private BuilderInstallmentResponse toInstallmentResponse(BuilderInstallment i) {
        return BuilderInstallmentResponse.builder()
                .id(i.getId())
                .amount(i.getAmount())
                .dueDate(i.getDueDate())
                .description(i.getDescription())
                .paid(i.getPaid())
                .paidViaLoan(i.getPaidViaLoan())
                .paidViaSelf(i.getPaidViaSelf())
                .paidDate(i.getPaidDate())
                .createdAt(i.getCreatedAt())
                .payeeType(i.getPayeeType())
                .paymentReference(i.getPaymentReference())
                .paymentMode(i.getPaymentMode())
                .build();
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double nullOr(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
