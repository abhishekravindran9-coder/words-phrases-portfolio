package com.wordphrases.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "properties",
    indexes = { @Index(name = "idx_properties_user_id", columnList = "user_id") }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "builder_name", length = 200)
    private String builderName;

    @Column(name = "total_cost", nullable = false)
    private Double totalCost;

    @Column(length = 300)
    private String location;

    @Column(name = "possession_date")
    private LocalDate possessionDate;

    @Column(name = "self_contribution_planned")
    @Builder.Default
    private Double selfContributionPlanned = 0.0;

    @Column(name = "loan_amount_planned")
    @Builder.Default
    private Double loanAmountPlanned = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<BuilderInstallment> installments = new ArrayList<>();

    @OneToOne(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Loan loan;
}
