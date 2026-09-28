package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for a single vocabulary word or phrase.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WordResponse {

    private Long id;
    private String word;
    private String entryType;
    private String definition;
    private String exampleSentence;
    private String imageUrl;
    private String audioUrl;
    private String notes;
    private String difficultyTier;
    private Integer lapseCount;
    private String pronunciation;
    private String partOfSpeech;
    private String etymology;
    private String mnemonic;
    private String usageNote;
    private String synonyms;
    private String antonyms;
    private String sourceContext;
    private String userExample;
    private String userMnemonic;
    private String aiEnrichmentStatus;

    // Category info
    private Long categoryId;
    private String categoryName;
    private String categoryColor;

    // SM-2 fields
    private Double easeFactor;
    private Integer intervalDays;
    private Integer repetitions;
    private LocalDate nextReviewDate;
    private Boolean mastered;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Total number of reviews performed on this word. */
    private Integer totalReviews;
}
