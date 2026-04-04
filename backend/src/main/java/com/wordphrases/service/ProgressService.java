package com.wordphrases.service;

import com.wordphrases.dto.response.ProgressResponse;
import com.wordphrases.model.Category;
import com.wordphrases.model.User;
import com.wordphrases.repository.CategoryRepository;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Computes aggregated progress statistics for the progress-tracking screen.
 */
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final CategoryRepository categoryRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public ProgressResponse getProgress(Long userId) {
        User user = userService.getUserById(userId);
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);

        long totalWords = wordRepository.countByUser(user);
        long masteredWords = wordRepository.countByUserAndMastered(user, true);
        long dueReviews = wordRepository.countDueForReview(user, today);
        long totalReviews = reviewRepository.countByUser(user);
        double masteryRate = totalWords > 0 ? (double) masteredWords / totalWords * 100 : 0.0;

        // Reviews per day (last 30 days)
        List<Object[]> dailyRows = reviewRepository.countReviewsPerDay(user, thirtyDaysAgo, today);
        Map<LocalDate, Long> reviewsPerDay = new LinkedHashMap<>();
        dailyRows.forEach(row -> reviewsPerDay.put((LocalDate) row[0], (Long) row[1]));

        Double avgQuality = reviewRepository.averageQuality(user, thirtyDaysAgo, today);

        int streak = computeStreak(reviewRepository.findDistinctReviewDatesByUser(user));

        // Top categories
        List<Object[]> catRows = categoryRepository.findCategoriesWithWordCount(user);
        List<ProgressResponse.CategoryStatsDto> topCategories = catRows.stream()
                .limit(5)
                .map(row -> {
                    Category c = (Category) row[0];
                    long wordCount = (Long) row[1];
                    long masteredCount = wordRepository.countByUserAndMastered(user, true);
                    return ProgressResponse.CategoryStatsDto.builder()
                            .categoryId(c.getId())
                            .categoryName(c.getName())
                            .categoryColor(c.getColor())
                            .wordCount(wordCount)
                            .masteredCount(masteredCount)
                            .build();
                })
                .toList();

        return ProgressResponse.builder()
                .totalWords(totalWords)
                .masteredWords(masteredWords)
                .wordsInProgress(totalWords - masteredWords)
                .totalReviews(totalReviews)
                .masteryRate(masteryRate)
                .reviewsPerDay(reviewsPerDay)
                .averageQuality(avgQuality != null ? avgQuality : 0.0)
                .dueReviews(dueReviews)
                .currentStreakDays(streak)
                .topCategories(topCategories)
                .build();
    }

    /**
     * Counts the current consecutive-day review streak.
     * Dates are already sorted descending by the repository query.
     */
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
