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
}
