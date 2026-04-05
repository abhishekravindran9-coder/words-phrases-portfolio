package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LoanResponse {
    private Long id;
    private Double sanctionedAmount;
    private Double interestRate;
    private String interestType;
    private Integer tenureMonths;
    private LocalDate emiStartDate;
    private String bankName;
    private String accountNumber;
    private LocalDateTime createdAt;

    // Computed — basic
    private Double computedEmi;
    private Double totalInterest;
    private Double totalPayment;
    private Double outstandingBalance;
    private int paidEmiCount;
    private int remainingEmiCount;
    private Double totalPrepaid;

    // Computed — enriched
    private LocalDate closureDate;
    private LocalDate nextEmiDueDate;
    private Long daysUntilNextEmi;
    private Double principalRepaid;
    private Double percentComplete;
    private Double interestCostRatio;
    private Double currentMonthInterest;
    private Double currentMonthPrincipal;
}
