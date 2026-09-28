package com.wordphrases.service;

import com.wordphrases.model.Word;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class WordSafetyTest {
    @Test
    void softDeleteMetadataDoesNotAlterLearningState() {
        Word word = Word.builder()
                .word("Frenetic")
                .easeFactor(1.8)
                .intervalDays(6)
                .repetitions(3)
                .nextReviewDate(java.time.LocalDate.of(2026, 9, 30))
                .mastered(false)
                .lapseCount(2)
                .build();
        word.setDeletedAt(Instant.parse("2026-09-28T10:00:00Z"));
        word.setDeletedBy(2L);

        assertNotNull(word.getDeletedAt());
        assertEquals(2L, word.getDeletedBy());
        assertEquals(1.8, word.getEaseFactor());
        assertEquals(6, word.getIntervalDays());
        assertEquals(3, word.getRepetitions());
        assertEquals(2, word.getLapseCount());
        assertEquals(java.time.LocalDate.of(2026, 9, 30), word.getNextReviewDate());
    }
}