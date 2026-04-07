package com.wordphrases.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuizSessionRequest {

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Must have at least 1 question")
    private Integer questionCount;

    private Integer totalTimeSeconds;

    @NotNull(message = "Answers list is required")
    @NotEmpty(message = "Answers list must not be empty")
    @Valid
    private List<QuizAnswerRequest> answers;
}
