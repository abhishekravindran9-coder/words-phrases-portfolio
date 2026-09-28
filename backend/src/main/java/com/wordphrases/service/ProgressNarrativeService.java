package com.wordphrases.service;

import com.wordphrases.dto.response.ProgressInsightsResponse;
import com.wordphrases.model.ProgressWeeklyNarrative;
import com.wordphrases.model.User;
import com.wordphrases.repository.ProgressWeeklyNarrativeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class ProgressNarrativeService {
    private final ProgressInsightsService insightsService;
    private final ProgressWeeklyNarrativeRepository narrativeRepository;
    private final GeminiService geminiService;
    private final UserService userService;

    @Transactional
    public ProgressInsightsResponse.Narrative getNarrative(Long userId, String timezone) {
        User user = userService.getUserById(userId);
        ZoneId zone = LearningPolicy.zone(timezone == null ? user.getTimezone() : timezone);
        LocalDate today = LocalDate.now(zone);
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        ProgressInsightsResponse insights = insightsService.getInsights(userId, "7d", zone.getId());
        String facts = "reviews=" + insights.getTotalReviewEvents()
                + ", due=" + insights.getDueNow()
                + ", streak=" + insights.getCurrentStreak()
                + ", matureCards=" + insights.getMatureCards()
                + ", maturedThisWeek=" + insights.getWeeklyGraduations().stream().mapToLong(point -> point.getGraduated()).sum();
        String hash = sha256(facts);
        var existing = narrativeRepository.findByUserIdAndWeekStartAndTimezoneId(userId, weekStart, zone.getId());
        if (existing.isPresent() && hash.equals(existing.get().getFactsHash())) {
            return toResponse(existing.get(), true);
        }

        String text;
        boolean generated = true;
        try {
            text = geminiService.generateWeeklyNarrative(facts);
        } catch (RuntimeException exception) {
            generated = false;
            text = fallback(insights);
        }
        ProgressWeeklyNarrative saved = narrativeRepository.save(ProgressWeeklyNarrative.builder()
                .userId(userId).weekStart(weekStart).timezoneId(zone.getId())
                .narrative(text).factsHash(hash).build());
        return toResponse(saved, generated);
    }

    private String fallback(ProgressInsightsResponse insights) {
        if (insights.getCurrentStreak() > 0) return "Your review rhythm is holding steady. Keep returning to the cards that are due so this momentum turns into durable recall.";
        if (insights.getDueNow() > 0) return "There is a useful next step waiting in your queue. A short review session will give the cards that need attention another chance to settle.";
        return "This is a quiet week in the record. Add a small review session when you are ready and the dashboard will begin to show your learning pattern.";
    }

    private ProgressInsightsResponse.Narrative toResponse(ProgressWeeklyNarrative narrative, boolean generated) {
        return ProgressInsightsResponse.Narrative.builder().text(narrative.getNarrative())
                .generated(generated).weekStart(narrative.getWeekStart()).cachedAt(null).build();
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash narrative facts", exception);
        }
    }
}