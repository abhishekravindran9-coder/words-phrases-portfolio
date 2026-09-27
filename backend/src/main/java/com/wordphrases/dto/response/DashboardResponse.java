package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Aggregated dashboard summary shown to the user on first login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private Long totalWords;
    private Long masteredWords;
    private Long dueToday;
    private Long overdueCount;
    private Integer currentStreakDays;
    private Double masteryRate;

    /** Reviews completed today. */
    private Long reviewedToday;

    /** Daily review goal (fixed at 10 for now). */
    private int dailyGoal;

    /** Next 5 words due for review. */
    private List<WordResponse> upcomingReviews;

    /** A random word from the user's collection as a "daily highlight". */
    private WordResponse dailyHighlight;

    /** Top 5 hardest words by lowest ease factor. */
    private List<WordResponse> weakestWords;

    /** Review activity map: date string -> count, for last 90 days (heatmap). */
    private Map<String, Long> reviewActivity;

    /** Reviews in the latest seven days and the seven days before that. */
    private Long reviewsThisWeek;
    private Long reviewsPreviousWeek;

    /** Percentage of reviews rated 3–5 over the latest 30 days. */
    private Integer recentRecallRate;
    private Long recentReviewCount;

    /** Non-mastered vocabulary scheduled within the next three days, ordered by lower ease factor first. */
    private List<WordResponse> atRiskWords;
        private Long atRiskCount;

    /** Category groups with the lowest successful-recall rate in the latest 30 days. */
    private List<CategoryLearningInsight> weakestCategories;

    /** Journal entries and distinct linked vocabulary touched during the latest seven days. */
    private Long journalEntriesThisWeek;
    private Long journalWordsPracticedThisWeek;

    /** Best-ever review streak, calculated from existing review dates. */
    private Integer bestStreakDays;

    /** Next total-mastered count milestone and remaining words to reach it. */
    private Long nextMasteryMilestone;
    private Long wordsToNextMasteryMilestone;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryLearningInsight {
        private String categoryName;
        private String categoryColor;
        private Long reviewCount;
        private Integer recallRate;
    }
}
