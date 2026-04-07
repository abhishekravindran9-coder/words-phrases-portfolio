package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class QuizStatsResponse {

    // ── Totals ──────────────────────────────────────────────────────────────
    private long totalQuizzesTaken;
    private long totalQuestionsAnswered;
    private long totalCorrect;
    /** Overall accuracy across all answers, as a percentage (0–100). */
    private double overallAccuracy;
    /** Average score per quiz session, as a percentage. */
    private double averageScore;
    /** Best score achieved in a single session, as a percentage. */
    private double bestScore;
    /** Average time spent per question, in seconds. */
    private double averageTimePerQuestion;

    // ── By question type ────────────────────────────────────────────────────
    private Map<String, TypeAccuracy> accuracyByType;

    // ── Session trend (last 10) ──────────────────────────────────────────────
    private List<SessionSummary> recentSessions;

    // ── Weak spots ──────────────────────────────────────────────────────────
    /** Top words most frequently answered incorrectly. */
    private List<WeakWordStat> mostMissedWords;

    // ── Streaks ─────────────────────────────────────────────────────────────
    /** Consecutive days with at least one passing quiz (≥ 60%). */
    private int currentPassingStreak;
    private int longestPassingStreak;

    // ── Today ────────────────────────────────────────────────────────────────
    private long quizzesToday;
    private long questionsToday;

    // ── Nested types ────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class TypeAccuracy {
        private long total;
        private long correct;
        /** Accuracy as a percentage (0–100). */
        private double accuracy;
    }

    @Data
    @Builder
    public static class SessionSummary {
        private Long sessionId;
        private LocalDateTime completedAt;
        private int questionCount;
        private int correctCount;
        private double scorePercent;
        private int totalTimeSeconds;
    }

    @Data
    @Builder
    public static class WeakWordStat {
        private Long wordId;
        private String word;
        private long wrongCount;
        private long totalAttempts;
        /** Accuracy as a percentage (0–100). */
        private double accuracy;
    }
}
