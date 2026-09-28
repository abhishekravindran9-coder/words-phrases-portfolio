package com.wordphrases.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Payload for creating or updating a vocabulary word / phrase.
 */
@Data
public class WordRequest {

    @NotBlank(message = "Word or phrase is required")
    @Size(max = 200, message = "Word must be at most 200 characters")
    private String word;

    /** "WORD" or "PHRASE". Defaults to "WORD" if omitted. */
    private String entryType;

    private String definition;

    private String exampleSentence;

    /** Optional category ID to associate with this word. */
    private Long categoryId;

    private String imageUrl;

    private String audioUrl;

    private String notes;

    private String difficultyTier;

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
}
