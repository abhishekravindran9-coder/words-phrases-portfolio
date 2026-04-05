package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AmortizationEntryResponse {
    private int month;
    private LocalDate date;
    private Double emi;
    private Double interest;
    private Double principal;
    private Double balance;
    private Boolean paid;
    private boolean prepaymentMonth;
    private Double prepaidAmount;
}
