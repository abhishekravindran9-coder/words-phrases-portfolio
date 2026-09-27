package com.wordphrases.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Word queue and counts for one Practice session configuration. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeQueueResponse {
    private String mode;
    private int requestedSize;
    private int availableCount;
    private List<WordResponse> words;
}
