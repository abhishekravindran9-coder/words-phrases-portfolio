package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayResponse {
    private LocalDate localDate;
    private LocalDate lastReviewDate;
    private boolean returningAfterBreak;
    private LocalDate estimatedCatchUpDate;
    private int catchUpDailyPace;
    private long totalWords;
    private long totalReviewCount;
    private String firstName;
    private long dueCount;
    private long dueTodayCount;
    private long overdueCount;
    private long unscheduledDueCount;
    private long atRiskCount;
    private int dailyGoal;
    private long reviewedToday;
    private int currentStreakDays;
    private int bestStreakDays;
    private String focus;
    private int estimatedSecondsPerCard;
    private int estimatedSessionMinutes;
    private boolean usingFallbackTimeEstimate;
    private List<SessionWord> suggestedSession;
    private List<SessionWord> atRiskSession;
    private RecallSummary recall30Days;
    private List<RecallPoint> recallTrend;
    private List<DailyCount> lastSevenDays;
    private long reviewsLastSevenDays;
    private int activeDaysLastSevenDays;
    private List<StageCount> stages;
    private List<DailyCount> forecast;
    private List<ClosestWord> closestToMastery;
    private JournalSummary journal;
    private PortfolioSummary portfolio;
    private WordResponse wordOfTheDay;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SessionWord {
        private Long wordId;
        private WordResponse word;
        private String reason;
        private String priority;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecallSummary {
        private Integer accuracy;
        private long successful;
        private long sampleSize;
        private int minimumSampleSize;
        private boolean suppressed;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyCount {
        private LocalDate date;
        private long count;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecallPoint {
        private LocalDate date;
        private Integer accuracy;
        private long sampleSize;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StageCount {
        private String stage;
        private long count;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClosestWord {
        private Long id;
        private String word;
        private String entryType;
        private int stepsToMastery;
        private int repetitions;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class JournalSummary {
        private long entriesThisWeek;
        private LocalDate lastEntryDate;
        private Long daysSinceLastEntry;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PortfolioSummary {
        private long propertyCount;
        private double pendingAmount;
        private double paidAmount;
        private double totalAmount;
        private double paidPercent;
        private long overduePayments;
        private double overdueAmount;
        private long longestOverdueDays;
    }
}
