package com.wordphrases.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * Payload for creating or updating a journal entry.
 */
@Data
public class JournalEntryRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String mood;

    /** IDs of vocabulary words referenced in this entry. */
    private List<Long> usedWordIds;
}
