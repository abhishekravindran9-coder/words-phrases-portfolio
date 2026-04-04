package com.wordphrases.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Payload sent when a user completes a review for a word.
 */
@Data
public class ReviewResultRequest {

    @NotNull(message = "Word ID is required")
    private Long wordId;

    /**
     * SM-2 quality rating provided by the user.
     * 0 = complete blackout, 5 = perfect recall.
     */
    @NotNull(message = "Quality rating is required")
    @Min(value = 0, message = "Quality must be at least 0")
    @Max(value = 5, message = "Quality must be at most 5")
    private Integer quality;

    /** Time spent reviewing this card, in seconds. */
    private Long timeTakenSeconds;
}
