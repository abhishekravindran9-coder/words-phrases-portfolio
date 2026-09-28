package com.wordphrases.service;

import com.wordphrases.dto.response.PropertyResponse;
import com.wordphrases.dto.response.TodayResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.model.JournalEntry;
import com.wordphrases.model.Review;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.JournalEntryRepository;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TodayService {
    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final UserService userService;
    private final WordService wordService;
    private final PropertyService propertyService;

        @Transactional(readOnly = true)
        @Cacheable(cacheNames = "today", key = "#userId + ':' + #requestedFocus")
    public TodayResponse getToday(Long userId, String requestedFocus) {
        User user = userService.getUserById(userId);
        ZoneId zone = LearningPolicy.zone(user.getTimezone());
        LocalDate today = LearningPolicy.today(zone);
        LocalDate threeDaysOut = today.plusDays(3);
        LocalDate weekStart = today.minusDays(6);
        LocalDate monthStart = today.minusDays(29);
        int limit = TodayPlanningPolicy.SESSION_SIZE;
        String focus = TodayPlanningPolicy.normalizeFocus(requestedFocus);

        long dueCount = wordRepository.countDueForReview(user, today);
        long overdueCount = wordRepository.countOverdue(user, today);
        long dueTodayCount = wordRepository.countByUserAndMasteredFalseAndNextReviewDate(user, today);
        long unscheduledCount = Math.max(0, dueCount - overdueCount - dueTodayCount);
        long atRiskCount = wordRepository.countApproachingDueWords(user, today, threeDaysOut);
        long reviewedToday = reviewRepository.countByUserAndReviewDate(user, today);

        List<Word> overdue = wordRepository.findOverdueForToday(user, today, PageRequest.of(0, limit * 5));
        List<Word> dueToday = wordRepository.findDueToday(user, today, PageRequest.of(0, limit * 5));
        List<Word> unscheduled = wordRepository.findUnscheduledDue(user, PageRequest.of(0, limit * 5));
        List<Word> atRisk = wordRepository.findApproachingDueWords(user, today, threeDaysOut, PageRequest.of(0, limit * 5));
        List<Word> weakest = wordRepository.findWeakestWords(user, PageRequest.of(0, limit * 5));
        List<Word> newWords = wordRepository.findNewCards(user, PageRequest.of(0, limit * 5));

        List<Word> sessionWords = TodayPlanningPolicy.selectSession(overdue, dueToday, atRisk, unscheduled,
                weakest, newWords, focus, today, limit).stream()
                .map(item -> findCandidate(item.getWordId(), overdue, dueToday, atRisk, unscheduled, weakest, newWords))
                .filter(java.util.Objects::nonNull).toList();
        Map<Long, TodayResponse.SessionWord> sessionMetadata = new HashMap<>();
        TodayPlanningPolicy.selectSession(overdue, dueToday, atRisk, unscheduled, weakest, newWords, focus, today, limit)
                .forEach(item -> sessionMetadata.put(item.getWordId(), item));
        List<TodayResponse.SessionWord> session = sessionWords.stream().map(word -> {
            TodayResponse.SessionWord metadata = sessionMetadata.get(word.getId());
            metadata.setWord(wordService.toWordResponse(word));
            return metadata;
        }).toList();
        List<TodayResponse.SessionWord> atRiskSession = atRisk.stream().limit(limit).map(word ->
                TodayResponse.SessionWord.builder().wordId(word.getId()).word(wordService.toWordResponse(word))
                        .priority("AT_RISK").reason(TodayPlanningPolicy.reason(word, "AT_RISK", today)).build()).toList();

        List<Review> recentReviews = reviewRepository.findByUserAndReviewDateBetweenOrderByReviewDateAsc(user, monthStart, today);
        long recallSample = recentReviews.size();
        long successful = recentReviews.stream().filter(review -> review.getQuality() >= 3).count();
        long timedSamples = recentReviews.stream().filter(review -> review.getTimeTakenSeconds() != null).count();
        boolean fallbackTime = timedSamples < TodayPlanningPolicy.RECALL_MINIMUM_SAMPLE;
        int secondsPerCard = fallbackTime ? TodayPlanningPolicy.DEFAULT_SECONDS_PER_CARD
                : (int) Math.max(1, Math.round(recentReviews.stream().filter(review -> review.getTimeTakenSeconds() != null)
                .mapToLong(Review::getTimeTakenSeconds).average().orElse(TodayPlanningPolicy.DEFAULT_SECONDS_PER_CARD)));

        Map<LocalDate, Long> activityCounts = new HashMap<>();
        reviewRepository.countReviewsPerDay(user, weekStart, today).forEach(row ->
                activityCounts.put((LocalDate) row[0], ((Number) row[1]).longValue()));
        List<TodayResponse.DailyCount> lastSevenDays = new ArrayList<>();
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate date = today.minusDays(offset);
            lastSevenDays.add(TodayResponse.DailyCount.builder().date(date).count(activityCounts.getOrDefault(date, 0L)).build());
        }
                List<TodayResponse.RecallPoint> recallTrend = recallTrend(recentReviews, today);
                long reviewsLastSevenDays = lastSevenDays.stream().mapToLong(TodayResponse.DailyCount::getCount).sum();
                int activeDaysLastSevenDays = (int) lastSevenDays.stream().filter(day -> day.getCount() > 0).count();

        List<TodayResponse.StageCount> stages = List.of(
                stage("NEW", wordRepository.countNewCards(user)),
                stage("LEARNING", wordRepository.countLearningCards(user)),
                stage("YOUNG", wordRepository.countYoungCards(user)),
                stage("MATURE", wordRepository.countMatureCards(user)),
                stage("MASTERED", wordRepository.countByUserAndMastered(user, true)));
        List<TodayResponse.ClosestWord> closest = wordRepository.findClosestToMastery(user, PageRequest.of(0, 3)).stream()
                .map(word -> TodayResponse.ClosestWord.builder().id(word.getId()).word(word.getWord())
                        .entryType(word.getEntryType()).repetitions(word.getRepetitions() == null ? 0 : word.getRepetitions())
                        .stepsToMastery(Math.max(0, 5 - (word.getRepetitions() == null ? 0 : word.getRepetitions()))).build())
                .toList();

        Map<LocalDate, Long> forecastCounts = new LinkedHashMap<>();
        wordRepository.countScheduledReviewsByDate(user, today.plusDays(1), today.plusDays(7)).forEach(row ->
                forecastCounts.put((LocalDate) row[0], ((Number) row[1]).longValue()));

        TodayResponse.JournalSummary journal = journalStats(user, today, weekStart, zone);
        TodayResponse.PortfolioSummary portfolio = portfolioSummary(propertyService.getAll(userId, today));
        List<LocalDate> reviewDates = reviewRepository.findDistinctReviewDatesByUser(user);
        LocalDate lastReviewDate = reviewDates.isEmpty() ? null : reviewDates.get(0);
        int sessionMinutes = session.isEmpty() ? 0 : (int) Math.ceil(session.size() * secondsPerCard / 60.0);
        long totalWords = wordRepository.countByUser(user);
        long totalReviewCount = reviewRepository.countByUser(user);
        Word wordOfTheDay = !atRisk.isEmpty() ? atRisk.get(0)
                : !overdue.isEmpty() ? overdue.get(0)
                : !dueToday.isEmpty() ? dueToday.get(0)
                : !unscheduled.isEmpty() ? unscheduled.get(0) : null;

        return TodayResponse.builder()
                .localDate(today)
                .lastReviewDate(lastReviewDate)
                .returningAfterBreak(totalWords > 0 && lastReviewDate != null && lastReviewDate.isBefore(today.minusDays(7)))
                .catchUpDailyPace(overdueCount > 0 ? 15 : 0)
                .estimatedCatchUpDate(overdueCount > 0 ? today.plusDays((long) Math.ceil(overdueCount / 15.0)) : null)
                .totalWords(totalWords)
                .totalReviewCount(totalReviewCount)
                .firstName(firstName(user))
                .dueCount(dueCount).dueTodayCount(dueTodayCount).overdueCount(overdueCount)
                .unscheduledDueCount(unscheduledCount).atRiskCount(atRiskCount)
                .dailyGoal(LearningPolicy.DAILY_REVIEW_GOAL).reviewedToday(reviewedToday)
                .currentStreakDays(LearningPolicy.currentStreak(reviewDates, today))
                .bestStreakDays(bestStreak(reviewDates))
                .focus(focus).estimatedSecondsPerCard(secondsPerCard).estimatedSessionMinutes(sessionMinutes)
                .usingFallbackTimeEstimate(fallbackTime)
                .suggestedSession(session).atRiskSession(atRiskSession)
                .recall30Days(TodayPlanningPolicy.recall(successful, recallSample))
                .recallTrend(recallTrend)
                .lastSevenDays(lastSevenDays).reviewsLastSevenDays(reviewsLastSevenDays)
                .activeDaysLastSevenDays(activeDaysLastSevenDays).stages(stages)
                .forecast(TodayPlanningPolicy.forecast(today, forecastCounts)).closestToMastery(closest)
                .journal(journal).portfolio(portfolio)
                .wordOfTheDay(wordOfTheDay == null ? null : wordService.toWordResponse(wordOfTheDay))
                .build();
    }

    private TodayResponse.StageCount stage(String name, long count) {
        return TodayResponse.StageCount.builder().stage(name).count(count).build();
    }

    private Word findCandidate(Long id, List<Word>... groups) {
        for (List<Word> group : groups) for (Word word : group) if (word.getId().equals(id)) return word;
        return null;
    }

    private TodayResponse.PortfolioSummary portfolioSummary(List<PropertyResponse> properties) {
        double pending = properties.stream().mapToDouble(p -> value(p.getPendingInstallmentAmount())).sum();
        double paid = properties.stream().mapToDouble(p -> value(p.getPaidInstallmentAmount())).sum();
        double total = properties.stream().mapToDouble(p -> value(p.getTotalInstallmentAmount())).sum();
        return TodayResponse.PortfolioSummary.builder()
                .propertyCount(properties.size())
                .pendingAmount(pending)
                .paidAmount(paid)
                .totalAmount(total)
                .paidPercent(total > 0 ? Math.round(paid * 10000.0 / total) / 100.0 : 0)
                .overduePayments(properties.stream().mapToLong(p -> p.getOverdueInstallmentCount() == null ? 0 : p.getOverdueInstallmentCount()).sum())
                .overdueAmount(properties.stream().mapToDouble(p -> value(p.getOverdueInstallmentAmount())).sum())
                .longestOverdueDays(properties.stream().mapToLong(p -> p.getLongestOverdueDays() == null ? 0 : p.getLongestOverdueDays()).max().orElse(0))
                .build();
    }

    private double value(Double amount) { return amount == null ? 0 : amount; }

        private TodayResponse.JournalSummary journalStats(User user, LocalDate today, LocalDate weekStart, ZoneId zone) {
                ZoneId systemZone = ZoneId.systemDefault();
                LocalDateTime systemWeekStart = weekStart.atStartOfDay(zone).withZoneSameInstant(systemZone).toLocalDateTime();
                long thisWeek = journalEntryRepository.countByUserAndCreatedAtGreaterThanEqual(user, systemWeekStart);
        LocalDate lastEntryDate = journalEntryRepository.findFirstByUserOrderByCreatedAtDesc(user)
                                .map(JournalEntry::getCreatedAt)
                                .map(created -> created.atZone(systemZone).withZoneSameInstant(zone).toLocalDate()).orElse(null);
        Long daysSince = lastEntryDate == null ? null : Math.max(0, ChronoUnit.DAYS.between(lastEntryDate, today));
        return TodayResponse.JournalSummary.builder()
                .entriesThisWeek(thisWeek).lastEntryDate(lastEntryDate).daysSinceLastEntry(daysSince).build();
    }

        private List<TodayResponse.RecallPoint> recallTrend(List<Review> reviews, LocalDate today) {
                Map<LocalDate, long[]> byDate = new HashMap<>();
                for (Review review : reviews) {
                        long[] counts = byDate.computeIfAbsent(review.getReviewDate(), ignored -> new long[2]);
                        counts[0]++;
                        if (review.getQuality() >= 3) counts[1]++;
                }
                List<TodayResponse.RecallPoint> trend = new ArrayList<>();
                for (int offset = 29; offset >= 0; offset--) {
                        LocalDate date = today.minusDays(offset);
                        long sample = 0;
                        long successes = 0;
                        for (int rollingOffset = 0; rollingOffset < 7; rollingOffset++) {
                                long[] counts = byDate.get(date.minusDays(rollingOffset));
                                if (counts != null) { sample += counts[0]; successes += counts[1]; }
                        }
                        Integer accuracy = sample >= TodayPlanningPolicy.RECALL_MINIMUM_SAMPLE
                                        ? (int) Math.round(successes * 100.0 / sample) : null;
                        trend.add(TodayResponse.RecallPoint.builder().date(date).accuracy(accuracy).sampleSize(sample).build());
                }
                return trend;
        }

    private String firstName(User user) {
        String name = user.getDisplayName() == null || user.getDisplayName().isBlank() ? user.getUsername() : user.getDisplayName().trim();
        return name.split("\\s+", 2)[0];
    }

    private int bestStreak(List<LocalDate> datesDescending) {
        if (datesDescending.isEmpty()) return 0;
        List<LocalDate> dates = datesDescending.stream().distinct().sorted().toList();
        int best = 1;
        int current = 1;
        for (int index = 1; index < dates.size(); index++) {
            if (dates.get(index).equals(dates.get(index - 1).plusDays(1))) current++;
            else current = 1;
            best = Math.max(best, current);
        }
        return best;
    }
}
