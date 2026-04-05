package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "builder_installments",
    indexes = { @Index(name = "idx_installments_property_id", columnList = "property_id") }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BuilderInstallment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(length = 300)
    private String description;

    @Builder.Default
    private Boolean paid = false;

    /** Portion of this installment funded by the bank loan. */
    @Column(name = "paid_via_loan")
    @Builder.Default
    private Double paidViaLoan = 0.0;

    /** Portion of this installment funded from own savings. */
    @Column(name = "paid_via_self")
    @Builder.Default
    private Double paidViaSelf = 0.0;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
