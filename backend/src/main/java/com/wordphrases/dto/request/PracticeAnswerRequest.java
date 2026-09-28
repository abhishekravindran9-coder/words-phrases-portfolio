package com.wordphrases.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** A normalized answer from any Practice prompt format. */
@Data
public class PracticeAnswerRequest {

    @NotNull(message = "Word ID is required")
    private Long wordId;

    /** Shared SM-2 grade: 1 (Again), 3 (Good), or 5 (Easy). */
    @Min(value = 0, message = "Quality must be at least 0")
    @Max(value = 5, message = "Quality must be at most 5")
    private Integer quality;

    @Min(value = 0, message = "Time cannot be negative")
    private Long timeTakenSeconds;

    @NotBlank(message = "Practice format is required")
    private String format;

    private Boolean correct;

    /** IANA timezone reported by the browser for local review-day analytics. */
    private String timezoneId;
}
