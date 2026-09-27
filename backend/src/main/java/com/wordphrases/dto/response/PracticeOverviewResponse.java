package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Unified snapshot for the Practice landing screen, based on SRS review history. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeOverviewResponse {
    private Long totalCards;
    private Long masteredCards;
    private Long dueCards;
    private Long totalReviews;
    private Long successfulReviews;
    private Integer recallRate;
    private Integer currentStreakDays;
}
