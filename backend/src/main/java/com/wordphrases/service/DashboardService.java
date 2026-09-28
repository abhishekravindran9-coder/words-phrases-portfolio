package com.wordphrases.service;

import com.wordphrases.dto.response.DashboardResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.dto.response.DashboardResponse.CategoryLearningInsight;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import com.wordphrases.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Assembles the personalised dashboard summary for the logged-in user.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final UserService userService;
    private final WordService wordService;
    private final ProgressService progressService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        User user = userService.getUserById(userId);
        LocalDate today = LocalDate.now(LearningPolicy.zone(user.getTimezone()));
        LocalDate weekStart = today.minusDays(6);
        LocalDate previousWeekStart = today.minusDays(13);
        LocalDate previousWeekEnd = today.minusDays(7);
        LocalDate thirtyDaysStart = today.minusDays(29);
        int dailyGoal = 10;

        long totalWords    = wordRepository.countByUser(user);
        long masteredWords = wordRepository.countByUserAndMastered(user, true);
        long dueToday      = wordRepository.countDueForReview(user, today);
        long overdueCount  = wordRepository.countOverdue(user, today.minusDays(1));
        long reviewedToday = reviewRepository.countByUserAndReviewDate(user, today);
        long reviewsThisWeek = reviewRepository.countByUserAndReviewDateBetween(user, weekStart, today);
        long reviewsPreviousWeek = reviewRepository.countByUserAndReviewDateBetween(user, previousWeekStart, previousWeekEnd);
        long reviewsLast30Days = reviewRepository.countByUserAndReviewDateBetween(user, thirtyDaysStart, today);
        long successfulReviewsLast30Days = reviewRepository.countSuccessfulReviews(user, thirtyDaysStart, today);
        int recentRecallRate = reviewsLast30Days > 0
            ? (int) Math.round(successfulReviewsLast30Days * 100.0 / reviewsLast30Days)
            : 0;
        double masteryRate = totalWords > 0 ? (double) masteredWords / totalWords * 100 : 0.0;

        List<LocalDate> reviewDates = reviewRepository.findDistinctReviewDatesByUser(user);
        int streak = LearningPolicy.currentStreak(reviewDates, today);
        int bestStreak = computeBestStreak(reviewDates);

        // Upcoming reviews (first 5)
        List<WordResponse> upcoming = wordRepository.findDueForReview(user, today)
                .stream().limit(5).map(wordService::toWordResponse).toList();

        // Daily highlight (random word)
        WordResponse highlight = wordRepository.findRandomByUser(userId)
                .map(wordService::toWordResponse).orElse(null);

        // Weakest 5 words
        List<WordResponse> weakest = wordRepository
                .findWeakestWords(user, PageRequest.of(0, 5))
                .stream().map(wordService::toWordResponse).toList();

        List<WordResponse> atRisk = wordRepository
            .findApproachingDueWords(user, today, today.plusDays(3), PageRequest.of(0, 5))
            .stream().map(wordService::toWordResponse).toList();
            long atRiskCount = wordRepository.countApproachingDueWords(user, today, today.plusDays(3));

        List<CategoryLearningInsight> weakestCategories = reviewRepository
            .findWeakestCategoryRecall(user, thirtyDaysStart, today, 3)
            .stream()
            .limit(3)
            .map(row -> {
                long reviewCount = ((Number) row[2]).longValue();
                long failedReviews = ((Number) row[4]).longValue();
                long successfulReviews = Math.max(0, reviewCount - failedReviews);
                int recallRate = (int) Math.round(successfulReviews * 100.0 / reviewCount);
                return CategoryLearningInsight.builder()
                    .categoryName((String) row[0])
                    .categoryColor((String) row[1])
                    .reviewCount(reviewCount)
                    .recallRate(recallRate)
                    .build();
            })
            .toList();

        LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
        long journalEntriesThisWeek = journalEntryRepository.countByUserAndCreatedAtGreaterThanEqual(user, weekStartDateTime);
        long journalWordsPracticedThisWeek = journalEntryRepository.countDistinctWordsPracticedInJournal(user, weekStartDateTime);
        long nextMilestone = nextMasteryMilestone(masteredWords);

        // Activity heatmap: last 90 days
        LocalDate from = today.minusDays(89);
        List<Object[]> raw = reviewRepository.countReviewsPerDay(user, from, today);
        Map<String, Long> activity = new LinkedHashMap<>();
        // Pre-fill all 90 days with 0 so the frontend heatmap always has every cell
        for (int i = 0; i < 90; i++) {
            activity.put(from.plusDays(i).format(DateTimeFormatter.ISO_LOCAL_DATE), 0L);
        }
        for (Object[] row : raw) {
            String dateKey = ((LocalDate) row[0]).format(DateTimeFormatter.ISO_LOCAL_DATE);
            activity.put(dateKey, (Long) row[1]);
        }

        return DashboardResponse.builder()
                .totalWords(totalWords)
                .masteredWords(masteredWords)
                .dueToday(dueToday)
                .overdueCount(overdueCount)
                .reviewedToday(reviewedToday)
                .dailyGoal(dailyGoal)
                .currentStreakDays(streak)
                .masteryRate(masteryRate)
                .upcomingReviews(upcoming)
                .dailyHighlight(highlight)
                .weakestWords(weakest)
                .reviewsThisWeek(reviewsThisWeek)
                .reviewsPreviousWeek(reviewsPreviousWeek)
                .recentRecallRate(recentRecallRate)
                .recentReviewCount(reviewsLast30Days)
                .atRiskWords(atRisk)
                    .atRiskCount(atRiskCount)
                .weakestCategories(weakestCategories)
                .journalEntriesThisWeek(journalEntriesThisWeek)
                .journalWordsPracticedThisWeek(journalWordsPracticedThisWeek)
                .bestStreakDays(bestStreak)
                .nextMasteryMilestone(nextMilestone)
                .wordsToNextMasteryMilestone(Math.max(0, nextMilestone - masteredWords))
                .reviewActivity(activity)
                .build();
    }

    private int computeBestStreak(List<LocalDate> datesDescending) {
        if (datesDescending.isEmpty()) return 0;
        List<LocalDate> dates = datesDescending.stream().distinct().sorted().toList();
        int best = 1;
        int current = 1;
        for (int i = 1; i < dates.size(); i++) {
            if (dates.get(i).equals(dates.get(i - 1).plusDays(1))) {
                current++;
                best = Math.max(best, current);
            } else {
                current = 1;
            }
        }
        return best;
    }

    private long nextMasteryMilestone(long masteredWords) {
        long[] milestones = {10, 25, 50, 100, 250, 500, 1000};
        for (long milestone : milestones) {
            if (masteredWords < milestone) return milestone;
        }
        return ((masteredWords / 1000) + 1) * 1000;
    }
}
