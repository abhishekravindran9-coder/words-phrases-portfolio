package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Aggregate counts for the My Words page stats bar.
 */
@Data
@Builder
public class WordStatsResponse {
    private long total;
    private long mastered;
    private long words;
    private long phrases;
}
