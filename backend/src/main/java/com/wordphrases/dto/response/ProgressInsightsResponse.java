package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressInsightsResponse {
    private String range;
    private String timezoneId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Long totalCards;
    private Long dueNow;
    private Long matureCards;
    private Long totalReviewEvents;
    private Long legacyReviewEvents;
    private Long totalQuizAnswers;
    private List<StageCount> stages;
    private List<StageCard> closestToGraduating;
    private Retention retention;
    private List<Leech> leeches;
    private Long leechCount;
    private List<DailyCount> backlogForecast;
    private Long overdueBacklog;
    private Integer suggestedDailyPace;
    private Integer backlogBurnDownDays;
    private List<AccuracyGroup> byFormat;
    private List<AccuracyGroup> byEntryType;
    private List<DifficultyCalibration> difficultyCalibration;
    private List<FluencyPoint> fluencyTrend;
    private Long correctFastCount;
    private Long correctSlowCount;
    private List<DailyCount> activity;
    private List<TimeBucket> weekdayPattern;
    private List<TimeBucket> studyWindows;
    private JournalComparison journalComparison;
    private List<WeeklyGraduation> weeklyGraduations;
    private Integer weeksWithGraduationData;
    private Double projectedDaysToNextStage;
    private LocalDate projectedMasteryDate;
    private Integer reviewsUntilProjectionUnlock;
    private Integer personalBestStreak;
    private Integer currentStreak;
    private Long dailyGoal;
    private Long reviewsToday;
    private Long reviewsUntilGoal;
    private Long nextMilestone;
    private Long cardsUntilMilestone;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StageCount { private String stage; private Long count; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StageCard { private Long id; private String word; private String entryType; private String categoryName; private String difficultyTier; private Integer repetitions; private Integer intervalDays; private Long lapseCount; private Integer stepsToGraduation; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Retention { private Integer rate; private Integer target; private Long sampleSize; private Integer previousRate; private Long previousSampleSize; private Integer reviewsUntilUnlock; private Boolean matureOnly; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Leech { private Long wordId; private String word; private String entryType; private String categoryName; private String definition; private String notes; private String difficultyTier; private Long lapseCount; private Long attempts; private Integer averageGrade; private Integer recallRate; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyCount { private LocalDate date; private Long count; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AccuracyGroup { private String key; private String label; private Long total; private Long correct; private Integer accuracy; private Long legacyTotal; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DifficultyCalibration { private String tier; private Long total; private Integer accuracy; private String calibration; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FluencyPoint { private LocalDate date; private Long correctFast; private Long correctSlow; private Double averageCorrectSeconds; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TimeBucket { private String key; private Long total; private Long correct; private Integer accuracy; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class JournalComparison { private Long linkedReviews; private Long linkedCorrect; private Integer linkedRecall; private Long unlinkedReviews; private Long unlinkedCorrect; private Integer unlinkedRecall; private Boolean available; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WeeklyGraduation { private LocalDate weekStart; private Long graduated; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Narrative { private String text; private boolean generated; private LocalDate weekStart; private LocalDateTime cachedAt; }
}
