package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Aggregated progress data for the progress-tracking screen.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressResponse {

    private Long totalWords;
    private Long masteredWords;
    private Long wordsInProgress;
    private Long totalReviews;

    /** Mastery percentage (0–100). */
    private Double masteryRate;

    /** Words reviewed per day: date → count. */
    private Map<LocalDate, Long> reviewsPerDay;

    /** Average quality score over the last 30 days. */
    private Double averageQuality;

    /** Number of outstanding reviews due today or earlier. */
    private Long dueReviews;

    /** Streak of consecutive days with at least one review. */
    private Integer currentStreakDays;

    /** Top 5 categories by word count. */
    private List<CategoryStatsDto> topCategories;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStatsDto {
        private Long categoryId;
        private String categoryName;
        private String categoryColor;
        private Long wordCount;
        private Long masteredCount;
    }
}
