package com.wordphrases.controller;

import com.wordphrases.dto.request.PracticeAnswerRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.PracticeOverviewResponse;
import com.wordphrases.dto.response.PracticeQueueResponse;
import com.wordphrases.dto.response.ReviewResponse;
import com.wordphrases.service.PracticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController extends BaseController {

    private final PracticeService practiceService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<PracticeOverviewResponse>> overview() {
        return ResponseEntity.ok(ApiResponse.ok(practiceService.getOverview(getCurrentUserId())));
    }

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<PracticeQueueResponse>> queue(
            @RequestParam(defaultValue = "DUE") String mode,
            @RequestParam(defaultValue = "10") int size) {
        if (!"DUE".equalsIgnoreCase(mode) && !"CUSTOM".equalsIgnoreCase(mode)
                && !"LEECHES".equalsIgnoreCase(mode)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mode must be DUE, CUSTOM, or LEECHES"));
        }
        return ResponseEntity.ok(ApiResponse.ok(practiceService.getQueue(getCurrentUserId(), mode, size)));
    }

    @PostMapping("/answers")
    public ResponseEntity<ApiResponse<ReviewResponse>> submitAnswer(
            @Valid @RequestBody PracticeAnswerRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Practice answer recorded", practiceService.submitAnswer(getCurrentUserId(), request)));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(ApiResponse.error(exception.getMessage()));
        }
    }
}
