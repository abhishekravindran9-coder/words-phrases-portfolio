package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PropertyResponse {
    private Long id;
    private String name;
    private String builderName;
    private Double totalCost;
    private String location;
    private LocalDate possessionDate;
    private Double selfContributionPlanned;
    private Double loanAmountPlanned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Summary
    private int totalInstallments;
    private int paidInstallments;
    private Double totalInstallmentAmount;
    private Double paidInstallmentAmount;
    private Double percentComplete;
    private boolean hasLoan;
}
