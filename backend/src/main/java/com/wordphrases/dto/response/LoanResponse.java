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
    private LocalDate actualClosureDate;
    private LocalDate nextEmiDueDate;
    private Long daysUntilNextEmi;
    private Double principalRepaid;
    /** Principal repaid as a % of sanctioned amount (accurate measure of progress). */
    private Double percentComplete;
    /** EMIs paid as a % of original tenure months (time-based proxy). */
    private Double timelinePercent;
    private Double interestCostRatio;
    private Double currentMonthInterest;
    private Double currentMonthPrincipal;
    // Prepayment impact
    private Double originalTotalInterest;
    private Double interestSaved;
    private Integer monthsSaved;
    private Integer prepaymentCount;
    private Double interestPaidTillNow;
}
