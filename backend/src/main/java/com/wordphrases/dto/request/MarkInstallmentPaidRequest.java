package com.wordphrases.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class MarkInstallmentPaidRequest {
    private Double paidViaLoan;
    private Double paidViaSelf;
    private LocalDate paidDate;
}
