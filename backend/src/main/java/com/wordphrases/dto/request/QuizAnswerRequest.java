package com.wordphrases.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizAnswerRequest {

    @NotNull(message = "Word ID is required")
    private Long wordId;

    @NotBlank(message = "Question type is required")
    private String questionType;

    @NotNull(message = "Correct flag is required")
    private Boolean correct;

    private Integer timeTakenSeconds;

    private String userAnswer;

    private String correctAnswer;
}
