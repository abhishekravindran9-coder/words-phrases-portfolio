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
}
