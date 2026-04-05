package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class PrepaymentResponse {
    private Long id;
    private Double amount;
    private LocalDate prepaymentDate;
    private String prepaymentType;
    private LocalDateTime createdAt;
}
