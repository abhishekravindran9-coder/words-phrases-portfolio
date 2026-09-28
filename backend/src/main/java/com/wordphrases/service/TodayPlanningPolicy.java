package com.wordphrases.service;

import com.wordphrases.model.Word;
import com.wordphrases.dto.response.TodayResponse;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class TodayPlanningPolicy {
    public static final int RECALL_MINIMUM_SAMPLE = 20;
    public static final int SESSION_SIZE = 10;
    public static final int DEFAULT_SECONDS_PER_CARD = 20;

    private TodayPlanningPolicy() { }

    public static List<TodayResponse.SessionWord> selectSession(
            List<Word> overdue, List<Word> dueToday, List<Word> atRisk,
            List<Word> unscheduled, List<Word> weakest, List<Word> newWords,
            String requestedFocus, LocalDate today, int size) {
        String focus = normalizeFocus(requestedFocus);
        Map<Long, TodayResponse.SessionWord> selected = new LinkedHashMap<>();
        switch (focus) {
            case "AT_RISK" -> {
                add(selected, atRisk, "AT_RISK", today);
                add(selected, overdue, "OVERDUE", today);
                add(selected, dueToday, "DUE_TODAY", today);
            }
            case "WEAKEST" -> add(selected, weakest, "WEAKEST", today);
            case "NEW" -> {
                add(selected, newWords, "NEW", today);
                add(selected, overdue, "OVERDUE", today);
                add(selected, dueToday, "DUE_TODAY", today);
            }
            default -> {
                add(selected, overdue, "OVERDUE", today);
                add(selected, dueToday, "DUE_TODAY", today);
                add(selected, atRisk, "AT_RISK", today);
                add(selected, unscheduled, "UNSCHEDULED", today);
                add(selected, newWords, "NEW", today);
                add(selected, weakest, "WEAKEST", today);
            }
        }
        return new ArrayList<>(selected.values()).stream().limit(Math.max(0, size)).toList();
    }

    public static String normalizeFocus(String focus) {
        if (focus == null) return "MIX";
        return switch (focus.trim().toUpperCase()) {
            case "AT_RISK", "WEAKEST", "NEW" -> focus.trim().toUpperCase();
            default -> "MIX";
        };
    }

    public static TodayResponse.RecallSummary recall(long successful, long sampleSize) {
        boolean suppressed = sampleSize < RECALL_MINIMUM_SAMPLE;
        return TodayResponse.RecallSummary.builder()
                .accuracy(suppressed || sampleSize == 0 ? null : (int) Math.round(successful * 100.0 / sampleSize))
                .successful(successful)
                .sampleSize(sampleSize)
                .minimumSampleSize(RECALL_MINIMUM_SAMPLE)
                .suppressed(suppressed)
                .build();
    }

    public static List<TodayResponse.DailyCount> forecast(LocalDate today, Map<LocalDate, Long> counts) {
        List<TodayResponse.DailyCount> forecast = new ArrayList<>();
        for (int offset = 1; offset <= 7; offset++) {
            LocalDate date = today.plusDays(offset);
            forecast.add(TodayResponse.DailyCount.builder().date(date).count(counts.getOrDefault(date, 0L)).build());
        }
        return forecast;
    }

    private static void add(Map<Long, TodayResponse.SessionWord> selected, List<Word> words,
                            String priority, LocalDate today) {
        for (Word word : words) {
            if (word.getId() == null || selected.containsKey(word.getId())) continue;
            selected.put(word.getId(), TodayResponse.SessionWord.builder()
                    .wordId(word.getId())
                    .word(null)
                    .reason(reason(word, priority, today))
                    .priority(priority)
                    .build());
        }
    }

    public static String reason(Word word, String priority, LocalDate today) {
        int lapses = word.getLapseCount() == null ? 0 : word.getLapseCount();
        String missed = lapses == 1 ? " · missed once" : lapses > 1 ? " · missed " + lapses + " times" : "";
        LocalDate due = word.getNextReviewDate();
        return switch (priority) {
            case "OVERDUE" -> "overdue " + Math.max(1, ChronoUnit.DAYS.between(due, today)) + " days" + missed;
            case "DUE_TODAY" -> "due today" + missed;
            case "AT_RISK" -> "due " + due.format(DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH)) + missed;
            case "NEW" -> "new to your collection";
            case "WEAKEST" -> "lower memory strength" + missed;
            default -> "ready when you are";
        };
    }
}
