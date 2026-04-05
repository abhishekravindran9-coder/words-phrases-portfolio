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
import com.wordphrases.repository.BuilderInstallmentRepository;
import com.wordphrases.repository.EmiPaymentRepository;
import com.wordphrases.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
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
    private final UserService userService;

    // ─── Property CRUD ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PropertyResponse> getAll(Long userId) {
        User user = userService.getUserById(userId);
        return propertyRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PropertyResponse getById(Long userId, Long propertyId) {
        return toResponse(findOwned(userId, propertyId));
    }

    @Transactional
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
        return toResponse(propertyRepository.save(property));
    }

    @Transactional
    public PropertyResponse update(Long userId, Long propertyId, PropertyRequest req) {
        Property property = findOwned(userId, propertyId);
        if (req.getName() != null)                          property.setName(req.getName());
        if (req.getBuilderName() != null)                   property.setBuilderName(req.getBuilderName());
        if (req.getTotalCost() != null)                     property.setTotalCost(req.getTotalCost());
        if (req.getLocation() != null)                      property.setLocation(req.getLocation());
        if (req.getPossessionDate() != null)                property.setPossessionDate(req.getPossessionDate());
        if (req.getSelfContributionPlanned() != null)       property.setSelfContributionPlanned(req.getSelfContributionPlanned());
        if (req.getLoanAmountPlanned() != null)             property.setLoanAmountPlanned(req.getLoanAmountPlanned());
        return toResponse(propertyRepository.save(property));
    }

    @Transactional
    public void delete(Long userId, Long propertyId) {
        Property property = findOwned(userId, propertyId);
        propertyRepository.delete(property);
    }

    // ─── Builder Installments ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BuilderInstallmentResponse> getInstallments(Long userId, Long propertyId) {
        Property property = findOwned(userId, propertyId);
        return installmentRepository.findByPropertyOrderByDueDateAsc(property)
                .stream().map(this::toInstallmentResponse).toList();
    }

    @Transactional
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
    public BuilderInstallmentResponse updateInstallment(Long userId, Long propertyId, Long instId,
                                                        BuilderInstallmentRequest req) {
        Property property = findOwned(userId, propertyId);
        BuilderInstallment inst = installmentRepository.findByIdAndProperty(instId, property)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found"));
        if (req.getAmount() != null)      inst.setAmount(req.getAmount());
        if (req.getDueDate() != null)     inst.setDueDate(req.getDueDate());
        if (req.getDescription() != null) inst.setDescription(req.getDescription());
        return toInstallmentResponse(installmentRepository.save(inst));
    }

    @Transactional
    public BuilderInstallmentResponse markInstallmentPaid(Long userId, Long propertyId, Long instId,
                                                          MarkInstallmentPaidRequest req) {
        Property property = findOwned(userId, propertyId);
        BuilderInstallment inst = installmentRepository.findByIdAndProperty(instId, property)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found"));
        inst.setPaid(true);
        inst.setPaidViaLoan(nullOr(req.getPaidViaLoan(), 0.0));
        inst.setPaidViaSelf(nullOr(req.getPaidViaSelf(), 0.0));
        inst.setPaidDate(req.getPaidDate() != null ? req.getPaidDate() : LocalDate.now());
        return toInstallmentResponse(installmentRepository.save(inst));
    }

    @Transactional
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

    private PropertyResponse toResponse(Property p) {
        List<BuilderInstallment> installments = installmentRepository.findByPropertyOrderByDueDateAsc(p);
        int totalInst = installments.size();
        int paidInst  = (int) installments.stream().filter(i -> Boolean.TRUE.equals(i.getPaid())).count();
        double totalAmt = installments.stream().mapToDouble(i -> nullOr(i.getAmount(), 0.0)).sum();
        double paidAmt  = installments.stream()
                .filter(i -> Boolean.TRUE.equals(i.getPaid()))
                .mapToDouble(i -> nullOr(i.getAmount(), 0.0)).sum();
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
            loanPercentRepaid = round((paid * 100.0) / n);
            double k = paid;
            loanOutstanding = r == 0
                    ? round(Math.max(0, principal - loanEmi * k))
                    : round(Math.max(0, principal * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1)));
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
                .nextInstallmentAmount(nextInstAmt)
                .nextInstallmentDate(nextInstDate)
                .nextInstallmentDescription(nextInstDesc)
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
                .build();
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double nullOr(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
