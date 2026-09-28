package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "property_loans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false, unique = true)
    private Property property;

    @Column(name = "sanctioned_amount", nullable = false)
    private Double sanctionedAmount;

    /** Annual interest rate in percent (e.g. 8.5 for 8.5%). */
    @Column(name = "interest_rate", nullable = false)
    private Double interestRate;

    /** FIXED or FLOATING */
    @Column(name = "interest_type", length = 20)
    @Builder.Default
    private String interestType = "FIXED";

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "emi_start_date")
    private LocalDate emiStartDate;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "emi_due_day") private Integer emiDueDay;
    @Column(name = "bank_confirmed_rate", precision = 12, scale = 6) private BigDecimal bankConfirmedRate;
    @Column(name = "bank_confirmed_rate_date") private LocalDate bankConfirmedRateDate;
    @Column(name = "bank_confirmed_emi_start_date") private LocalDate bankConfirmedEmiStartDate;
    @Column(name = "bank_confirmed_outstanding", precision = 19, scale = 2) private BigDecimal bankConfirmedOutstanding;
    @Column(name = "bank_checkpoint_date") private LocalDate bankCheckpointDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Tracks which EMIs have been marked as paid. */
    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<EmiPayment> emiPayments = new ArrayList<>();

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Prepayment> prepayments = new ArrayList<>();
}
