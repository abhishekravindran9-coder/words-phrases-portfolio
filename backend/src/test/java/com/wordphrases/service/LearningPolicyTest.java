package com.wordphrases.service;

import com.wordphrases.model.Word;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LearningPolicyTest {
    @Test
    void assignsSharedStageBoundaries() {
        Word word = Word.builder().intervalDays(6).mastered(false).build();
        assertEquals(LearningPolicy.Stage.NEW, LearningPolicy.stage(word, false));
        assertEquals(LearningPolicy.Stage.LEARNING, LearningPolicy.stage(word, true));
        word.setIntervalDays(7);
        assertEquals(LearningPolicy.Stage.YOUNG, LearningPolicy.stage(word, true));
        word.setIntervalDays(21);
        assertEquals(LearningPolicy.Stage.MATURE, LearningPolicy.stage(word, true));
        word.setMastered(true);
        assertEquals(LearningPolicy.Stage.MASTERED, LearningPolicy.stage(word, true));
    }

    @Test
    void currentStreakAllowsTodayOrYesterdayAndStopsAtGap() {
        LocalDate today = LocalDate.of(2026, 9, 28);
        assertEquals(3, LearningPolicy.currentStreak(
                List.of(today, today.minusDays(1), today.minusDays(2), today.minusDays(4)), today));
        assertEquals(3, LearningPolicy.currentStreak(
                List.of(today.minusDays(1), today.minusDays(2), today.minusDays(3)), today));
        assertEquals(0, LearningPolicy.currentStreak(List.of(today.minusDays(2)), today));
    }
}