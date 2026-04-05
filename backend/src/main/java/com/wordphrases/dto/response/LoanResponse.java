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
    private LocalDateTime createdAt;

    // Computed
    private Double computedEmi;
    private Double totalInterest;
    private Double totalPayment;
    private Double outstandingBalance;
    private int paidEmiCount;
    private int remainingEmiCount;
    private Double totalPrepaid;
}
