package com.wordphrases.service;

import com.wordphrases.dto.response.DashboardResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final UserService userService;
    private final WordService wordService;
    private final ProgressService progressService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        User user = userService.getUserById(userId);
        LocalDate today = LocalDate.now();
        int dailyGoal = 10;

        long totalWords    = wordRepository.countByUser(user);
        long masteredWords = wordRepository.countByUserAndMastered(user, true);
        long dueToday      = wordRepository.countDueForReview(user, today);
        long overdueCount  = wordRepository.countOverdue(user, today.minusDays(1));
        long reviewedToday = reviewRepository.countByUserAndReviewDate(user, today);
        double masteryRate = totalWords > 0 ? (double) masteredWords / totalWords * 100 : 0.0;

        List<LocalDate> reviewDates = reviewRepository.findDistinctReviewDatesByUser(user);
        int streak = computeStreak(reviewDates);

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
                .reviewActivity(activity)
                .build();
    }

    private int computeStreak(List<LocalDate> sortedDates) {
        if (sortedDates.isEmpty()) return 0;
        LocalDate cursor = LocalDate.now();
        int streak = 0;
        for (LocalDate date : sortedDates) {
            if (date.equals(cursor) || date.equals(cursor.minusDays(1))) {
                streak++;
                cursor = date;
            } else {
                break;
            }
        }
        return streak;
    }
}
