package com.wordphrases.service;

import com.wordphrases.dto.response.ProgressInsightsResponse;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.JournalEntryRepository;
import com.wordphrases.repository.QuizAnswerRepository;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProgressInsightsService {
    private static final int RETENTION_UNLOCK_SAMPLE = 20;

    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final UserService userService;

    @Cacheable(cacheNames = "progressInsights", key = "#userId + ':' + #range + ':' + #timezone")
    @Transactional(readOnly = true)
    public ProgressInsightsResponse getInsights(Long userId, String range, String timezone) {
        User user = userService.getUserById(userId);
            ZoneId zone = LearningPolicy.zone(user.getTimezone());
        LocalDate today = LearningPolicy.today(zone);
        String normalizedRange = normalizeRange(range);
        LocalDate from = rangeStart(normalizedRange, today, user);

        long totalCards = wordRepository.countByUser(user);
        long dueNow = wordRepository.countDueForReview(user, today);
        long totalEvents = reviewRepository.countByUserAndReviewDateBetween(user, from, today);
        long quizAnswers = quizAnswerRepository.countAllByUser(user);
        long mastered = wordRepository.countByUserAndMastered(user, true);

        List<Object[]> activityRows = reviewRepository.countReviewsPerDay(user, from, today);
        Map<LocalDate, Long> activityCounts = new HashMap<>();
        for (Object[] row : activityRows) activityCounts.put((LocalDate) row[0], ((Number) row[1]).longValue());
        List<ProgressInsightsResponse.DailyCount> activity = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            activity.add(ProgressInsightsResponse.DailyCount.builder().date(day).count(activityCounts.getOrDefault(day, 0L)).build());
        }

        long masteredStage = wordRepository.countByUserAndMastered(user, true);
        long newStage = wordRepository.countNewCards(user);
        long learningStage = wordRepository.countLearningCards(user);
        long youngStage = wordRepository.countYoungCards(user);
        long matureStage = wordRepository.countMatureCards(user);
        List<ProgressInsightsResponse.StageCount> stages = List.of(
                stage("NEW", newStage), stage("LEARNING", learningStage), stage("YOUNG", youngStage),
                stage("MATURE", matureStage), stage("MASTERED", masteredStage));

        List<ProgressInsightsResponse.StageCard> closest = wordRepository.findClosestToMature(user, PageRequest.of(0, 5))
                .stream().map(this::toStageCard).toList();

        Object[] retentionRow = unwrapAggregateRow(reviewRepository.summarizeMatureRetention(user, from, today));
        long retentionSample = value(retentionRow, 0);
        long retentionSuccesses = value(retentionRow, 1);
        Integer retentionRate = retentionSample >= RETENTION_UNLOCK_SAMPLE
                ? (int) Math.round(retentionSuccesses * 100.0 / retentionSample) : null;
        ProgressInsightsResponse.Retention retention = ProgressInsightsResponse.Retention.builder()
                .rate(retentionRate)
                .target(85)
                .sampleSize(retentionSample)
                .reviewsUntilUnlock(Math.max(0, RETENTION_UNLOCK_SAMPLE - (int) retentionSample))
                .matureOnly(true)
                .build();

        List<ProgressInsightsResponse.AccuracyGroup> formats = mapAccuracy(reviewRepository.summarizeByFormat(user, from, today));
        List<ProgressInsightsResponse.AccuracyGroup> entryTypes = mapAccuracy(reviewRepository.summarizeByEntryType(user, from, today));
        List<Object[]> scheduledRows = wordRepository.countScheduledReviewsByDate(user, today.plusDays(1), today.plusDays(7));
        Map<LocalDate, Long> scheduledByDate = new HashMap<>();
        for (Object[] row : scheduledRows) scheduledByDate.put((LocalDate) row[0], ((Number) row[1]).longValue());
        List<ProgressInsightsResponse.DailyCount> forecast = new ArrayList<>();
        for (LocalDate day = today.plusDays(1); !day.isAfter(today.plusDays(7)); day = day.plusDays(1)) {
            forecast.add(ProgressInsightsResponse.DailyCount.builder().date(day).count(scheduledByDate.getOrDefault(day, 0L)).build());
        }

        List<Object[]> leechRows = wordRepository.findLeeches(user, from, today, 3, 2.5, PageRequest.of(0, 10));
        List<ProgressInsightsResponse.Leech> leeches = leechRows.stream().map(this::toLeech).toList();
            long overdue = wordRepository.countOverdue(user, today);
        int dailyPace = overdue == 0 ? 0 : (int) Math.ceil(overdue / 14.0);

        List<LocalDate> reviewDates = reviewRepository.findDistinctReviewDatesByUser(user);
        int currentStreak = LearningPolicy.currentStreak(reviewDates, today);
        long nextMilestone = nextMilestone(mastered);

        LocalDateTime localFrom = from.atStartOfDay();
        LocalDateTime localTo = today.plusDays(1).atStartOfDay().minusNanos(1);
        long legacyQuizInRange = quizAnswerRepository.summarizeLegacyEntryTypeAccuracy(user, localFrom, localTo)
                .stream().mapToLong(row -> ((Number) row[1]).longValue()).sum();
        List<ProgressInsightsResponse.WeeklyGraduation> graduations = weeklyGraduations(
                reviewRepository.countGraduationsByDate(user, from, today));

        return ProgressInsightsResponse.builder()
                .range(normalizedRange)
                .timezoneId(zone.getId())
                .fromDate(from)
                .toDate(today)
                .totalCards(totalCards)
                .dueNow(dueNow)
                .matureCards(matureStage)
                .totalReviewEvents(totalEvents)
                .legacyReviewEvents(0L)
                .totalQuizAnswers(legacyQuizInRange)
                .stages(stages)
                .closestToGraduating(closest)
                .retention(retention)
                .leeches(leeches)
                .leechCount((long) leeches.size())
                .backlogForecast(forecast)
                .overdueBacklog(overdue)
                .suggestedDailyPace(dailyPace)
                .backlogBurnDownDays(dailyPace == 0 ? 0 : (int) Math.ceil(overdue / (double) dailyPace))
                .byFormat(formats)
                .byEntryType(entryTypes)
                .difficultyCalibration(List.of())
                .fluencyTrend(List.of())
                .correctFastCount(0L)
                .correctSlowCount(0L)
                .activity(activity)
                .weekdayPattern(List.of())
                .studyWindows(List.of())
                .journalComparison(null)
                .weeklyGraduations(graduations)
                .weeksWithGraduationData((int) graduations.stream().filter(point -> point.getGraduated() > 0).count())
                .reviewsUntilProjectionUnlock(null)
                .personalBestStreak(bestStreak(reviewDates))
                .currentStreak(currentStreak)
                .dailyGoal((long) LearningPolicy.DAILY_REVIEW_GOAL)
                .reviewsToday(reviewRepository.countByUserAndReviewDate(user, today))
                .reviewsUntilGoal(Math.max(0, LearningPolicy.DAILY_REVIEW_GOAL - reviewRepository.countByUserAndReviewDate(user, today)))
                .nextMilestone(nextMilestone)
                .cardsUntilMilestone(Math.max(0, nextMilestone - mastered))
                .build();
    }

    private String normalizeRange(String range) {
        if (range == null) return "30d";
        return switch (range.toLowerCase()) {
            case "7d", "30d", "90d", "365d", "all" -> range.toLowerCase();
            default -> "30d";
        };
    }

    private LocalDate rangeStart(String range, LocalDate today, User user) {
        return switch (range) {
            case "7d" -> today.minusDays(6);
            case "90d" -> today.minusDays(89);
            case "365d" -> today.minusDays(364);
            case "all" -> reviewRepository.findFirstByUserOrderByReviewDateAsc(user)
                    .map(review -> review.getReviewDate()).orElse(today);
            default -> today.minusDays(29);
        };
    }

    private List<ProgressInsightsResponse.AccuracyGroup> mapAccuracy(List<Object[]> rows) {
        return rows.stream().map(row -> {
            long attempts = ((Number) row[1]).longValue();
            long correct = row[2] == null ? 0 : ((Number) row[2]).longValue();
            String key = row[0] == null ? "UNKNOWN" : row[0].toString();
            return ProgressInsightsResponse.AccuracyGroup.builder()
                    .key(key).label(key.replace('_', ' ')).total(attempts).correct(correct)
                    .accuracy(attempts == 0 ? null : (int) Math.round(correct * 100.0 / attempts))
                    .legacyTotal(0L).build();
        }).toList();
    }

    private ProgressInsightsResponse.StageCard toStageCard(Word word) {
        return ProgressInsightsResponse.StageCard.builder()
                .id(word.getId()).word(word.getWord()).entryType(word.getEntryType())
                .categoryName(word.getCategory() == null ? null : word.getCategory().getName())
                .difficultyTier(word.getDifficultyTier()).repetitions(word.getRepetitions())
                .intervalDays(word.getIntervalDays()).lapseCount(word.getLapseCount() == null ? 0L : word.getLapseCount().longValue())
                .stepsToGraduation(Math.max(0, 21 - (word.getIntervalDays() == null ? 0 : word.getIntervalDays())))
                .build();
    }

    private ProgressInsightsResponse.Leech toLeech(Object[] row) {
        Word word = (Word) row[0];
        long attempts = ((Number) row[1]).longValue();
        double average = row[2] == null ? 0 : ((Number) row[2]).doubleValue();
        long lapses = row[3] == null ? 0 : ((Number) row[3]).longValue();
        return ProgressInsightsResponse.Leech.builder().wordId(word.getId()).word(word.getWord())
                .entryType(word.getEntryType()).categoryName(word.getCategory() == null ? null : word.getCategory().getName())
                .definition(word.getDefinition()).notes(word.getNotes()).difficultyTier(word.getDifficultyTier())
                .lapseCount(lapses).attempts(attempts).averageGrade((int) Math.round(average))
                .recallRate((int) Math.round((attempts - lapses) * 100.0 / attempts)).build();
    }

    private List<ProgressInsightsResponse.WeeklyGraduation> weeklyGraduations(List<Object[]> rows) {
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate weekStart = ((LocalDate) row[0]).with(DayOfWeek.MONDAY);
            counts.merge(weekStart, ((Number) row[1]).longValue(), Long::sum);
        }
        return counts.entrySet().stream().map(entry -> ProgressInsightsResponse.WeeklyGraduation.builder()
                .weekStart(entry.getKey()).graduated(entry.getValue()).build()).toList();
    }

    private int bestStreak(List<LocalDate> datesDescending) {
        List<LocalDate> dates = datesDescending.stream().distinct().sorted().toList();
        int best = 0;
        int current = 0;
        LocalDate previous = null;
        for (LocalDate date : dates) {
            current = previous != null && date.equals(previous.plusDays(1)) ? current + 1 : 1;
            best = Math.max(best, current);
            previous = date;
        }
        return best;
    }

    private long nextMilestone(long mastered) {
        for (long milestone : new long[]{25, 50, 100, 250, 500, 1000}) {
            if (mastered < milestone) return milestone;
        }
        return ((mastered / 1000) + 1) * 1000;
    }

    private ProgressInsightsResponse.StageCount stage(String key, long count) {
        return ProgressInsightsResponse.StageCount.builder().stage(key).count(count).build();
    }

    private long value(Object[] row, int index) {
        return row == null || row.length <= index || row[index] == null ? 0 : ((Number) row[index]).longValue();
    }

    private Object[] unwrapAggregateRow(Object[] row) {
        if (row != null && row.length == 1 && row[0] instanceof Object[] nestedRow) return nestedRow;
        return row;
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }
}
