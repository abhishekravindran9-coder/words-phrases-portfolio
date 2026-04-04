package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Auto-enrichment result returned by the dictionary / Gemini lookup.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrichResponse {
    private String definition;
    private List<String> examples;
    private String partOfSpeech;   // present for words, null for phrases
    private String phonetic;       // present for words, null for phrases
    private String source;         // "dictionary" | "gemini"
}
