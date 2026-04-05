package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BuilderInstallmentResponse {
    private Long id;
    private Double amount;
    private LocalDate dueDate;
    private String description;
    private Boolean paid;
    private Double paidViaLoan;
    private Double paidViaSelf;
    private LocalDate paidDate;
    private LocalDateTime createdAt;
}
