package com.wordphrases.service;

import com.wordphrases.model.Word;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.DateTimeException;
import java.util.List;

/** Shared definitions consumed by Dashboard, Practice, and Progress. */
public final class LearningPolicy {
    public static final int DAILY_REVIEW_GOAL = 10;
    public static final int MIN_STAGE_SAMPLE = 20;
    public static final int MIN_PATTERN_SAMPLE = 20;

    private LearningPolicy() { }

    public enum Stage { NEW, LEARNING, YOUNG, MATURE, MASTERED }

    public static Stage stage(Word word, boolean hasReviewHistory) {
        if (Boolean.TRUE.equals(word.getMastered())) return Stage.MASTERED;
        if (!hasReviewHistory) return Stage.NEW;
        if (word.getIntervalDays() == null || word.getIntervalDays() < 7) return Stage.LEARNING;
        if (word.getIntervalDays() < 21) return Stage.YOUNG;
        return Stage.MATURE;
    }

    public static int currentStreak(List<LocalDate> datesDescending, LocalDate today) {
        if (datesDescending == null || datesDescending.isEmpty()) return 0;
        LocalDate cursor = datesDescending.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        for (LocalDate date : datesDescending) {
            if (!date.equals(cursor)) continue;
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    public static ZoneId zone(String requested) {
        if (requested != null && !requested.isBlank()) {
            try { return ZoneId.of(requested); } catch (DateTimeException ignored) { }
        }
        return ZoneId.of("UTC");
    }

    public static double expectedRecallFloor(String tier) {
        if (tier == null) return Double.NaN;
        return switch (tier) {
            case "EASY" -> 0.85;
            case "MEDIUM" -> 0.75;
            case "HARD" -> 0.60;
            case "SUPER_HARD" -> 0.45;
            default -> Double.NaN;
        };
    }
}
