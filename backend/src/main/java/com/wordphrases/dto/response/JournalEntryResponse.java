package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a single journal entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryResponse {

    private Long id;
    private String title;
    private String content;
    private String mood;

    /** Abbreviated info about vocabulary words referenced in this entry. */
    private List<WordSummary> usedWords;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordSummary {
        private Long id;
        private String word;
        private String definition;
    }
}
