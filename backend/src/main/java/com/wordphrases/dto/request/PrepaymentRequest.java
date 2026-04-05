package com.wordphrases.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PrepaymentRequest {
    private Double amount;
    private LocalDate prepaymentDate;
    private String prepaymentType; // REDUCE_TENURE | REDUCE_EMI
    /** When true, the prepayment is NOT persisted — used for simulation only. */
    private Boolean simulate;
}
