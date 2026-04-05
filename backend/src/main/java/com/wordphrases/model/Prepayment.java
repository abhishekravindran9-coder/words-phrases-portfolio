package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "loan_prepayments",
    indexes = { @Index(name = "idx_loan_prepayments_loan_id", columnList = "loan_id") }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prepayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "prepayment_date", nullable = false)
    private LocalDate prepaymentDate;

    @Column(name = "prepayment_type", length = 20)
    @Builder.Default
    private String prepaymentType = "REDUCE_TENURE"; // REDUCE_TENURE | REDUCE_EMI

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
