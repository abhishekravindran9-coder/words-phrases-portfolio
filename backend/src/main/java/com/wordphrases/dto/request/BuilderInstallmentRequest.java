package com.wordphrases.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BuilderInstallmentRequest {
    private Double amount;
    private LocalDate dueDate;
    private String description;
}
