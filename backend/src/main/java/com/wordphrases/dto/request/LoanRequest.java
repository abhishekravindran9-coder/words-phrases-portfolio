package com.wordphrases.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class LoanRequest {
    private Double sanctionedAmount;
    private Double interestRate;
    private String interestType; // FIXED | FLOATING
    private Integer tenureMonths;
    private LocalDate emiStartDate;
    private String bankName;
    private String accountNumber;
    private Integer emiDueDay;
    private Double bankConfirmedRate;
    private LocalDate bankConfirmedRateDate;
    private LocalDate bankConfirmedEmiStartDate;
    private Double bankConfirmedOutstanding;
    private LocalDate bankCheckpointDate;
}
