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

    // Installment summary
    private int totalInstallments;
    private int paidInstallments;
    private Double totalInstallmentAmount;
    private Double paidInstallmentAmount;
    private Double percentComplete;
    private boolean hasLoan;

    // Enriched card fields
    private Long daysToPoassession;
    private Double loanOutstanding;
    private Double loanEmi;
    private Integer loanPaidCount;
    private Integer loanTotalMonths;
    private Double loanPercentRepaid;
    private boolean loanClosed;
    private LocalDate loanActualClosureDate;
    private Integer loanMonthsSaved;
    private Double nextInstallmentAmount;
    private LocalDate nextInstallmentDate;
    private String nextInstallmentDescription;
    private Double pendingInstallmentAmount;
    private Double paidViaSelf;
    private Double paidViaLoan;
    private Integer overdueInstallmentCount;
    private Double overdueInstallmentAmount;
    private Long longestOverdueDays;
    private String propertyStatus;
}
