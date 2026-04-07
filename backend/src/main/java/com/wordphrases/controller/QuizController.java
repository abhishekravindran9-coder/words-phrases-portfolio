package com.wordphrases.controller;

import com.wordphrases.dto.request.QuizSessionRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.QuizStatsResponse;
import com.wordphrases.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for quiz session persistence and statistics.
 *
 * POST /api/quiz/sessions  — save a completed quiz session
 * GET  /api/quiz/stats     — retrieve detailed quiz statistics for the current user
 */
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController extends BaseController {

    private final QuizService quizService;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<Map<String, Long>>> saveSession(
            @Valid @RequestBody QuizSessionRequest request) {
        Long sessionId = quizService.saveSession(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Quiz session saved", Map.of("id", sessionId)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<QuizStatsResponse>> getStats() {
        QuizStatsResponse stats = quizService.getStats(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
