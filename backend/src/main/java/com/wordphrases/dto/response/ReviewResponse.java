package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO returned after a review session event.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long reviewId;
    private Long wordId;
    private String word;
    private Integer quality;
    private LocalDate reviewDate;
    private Long timeTakenSeconds;

    // Updated SM-2 values after processing
    private Double newEaseFactor;
    private Integer newIntervalDays;
    private Integer newRepetitions;
    private LocalDate nextReviewDate;
    private Boolean mastered;

    private LocalDateTime createdAt;
}
