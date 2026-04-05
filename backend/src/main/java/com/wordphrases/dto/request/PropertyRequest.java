package com.wordphrases.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PropertyRequest {
    private String name;
    private String builderName;
    private Double totalCost;
    private String location;
    private LocalDate possessionDate;
    private Double selfContributionPlanned;
    private Double loanAmountPlanned;
}
