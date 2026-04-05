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
import com.wordphrases.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final BuilderInstallmentRepository installmentRepository;
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
                .hasLoan(p.getLoan() != null)
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
