package com.wordphrases.service;

import com.wordphrases.dto.response.TodayResponse;
import com.wordphrases.model.Word;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TodayPlanningPolicyTest {
    private final LocalDate today = LocalDate.of(2026, 9, 28);

    @Test
    void mixPrioritizesOverdueBeforeTodayAndAtRiskAndReturnsStableReasons() {
        Word overdue = word(1L, today.minusDays(18), 2);
        Word dueToday = word(2L, today, 0);
        Word atRisk = word(3L, today.plusDays(1), 0);

        List<TodayResponse.SessionWord> selected = TodayPlanningPolicy.selectSession(
                List.of(overdue), List.of(dueToday), List.of(atRisk), List.of(), List.of(), List.of(),
                "MIX", today, 10);

        assertEquals(List.of(1L, 2L, 3L), selected.stream().map(TodayResponse.SessionWord::getWordId).toList());
        assertEquals("overdue 18 days · missed 2 times", selected.get(0).getReason());
        assertEquals("due today", selected.get(1).getReason());
        assertEquals("due Tue 29 Sep", selected.get(2).getReason());
    }

    @Test
    void focusModesAreNormalizedAndBounded() {
        Word atRisk = word(3L, today.plusDays(2), 0);
        Word overdue = word(1L, today.minusDays(1), 1);
        List<TodayResponse.SessionWord> selected = TodayPlanningPolicy.selectSession(
                List.of(overdue), List.of(), List.of(atRisk), List.of(), List.of(), List.of(),
                "at_risk", today, 1);
        assertEquals("AT_RISK", TodayPlanningPolicy.normalizeFocus("at_risk"));
        assertEquals(List.of(3L), selected.stream().map(TodayResponse.SessionWord::getWordId).toList());
    }

    @Test
    void recallPercentIsSuppressedBelowMinimumSample() {
        TodayResponse.RecallSummary early = TodayPlanningPolicy.recall(7, 11);
        assertTrue(early.isSuppressed());
        assertNull(early.getAccuracy());
        assertEquals(20, early.getMinimumSampleSize());

        TodayResponse.RecallSummary stable = TodayPlanningPolicy.recall(15, 20);
        assertFalse(stable.isSuppressed());
        assertEquals(75, stable.getAccuracy());
    }

    @Test
    void forecastAlwaysCoversSevenLocalDatesStartingTomorrow() {
        List<TodayResponse.DailyCount> forecast = TodayPlanningPolicy.forecast(today, Map.of(today.plusDays(2), 3L));
        assertEquals(7, forecast.size());
        assertEquals(today.plusDays(1), forecast.get(0).getDate());
        assertEquals(3L, forecast.get(1).getCount());
        assertEquals(today.plusDays(7), forecast.get(6).getDate());
    }

    private Word word(Long id, LocalDate dueDate, int lapseCount) {
        return Word.builder().id(id).word("sample").nextReviewDate(dueDate).lapseCount(lapseCount)
                .easeFactor(1.3).mastered(false).build();
    }
}
