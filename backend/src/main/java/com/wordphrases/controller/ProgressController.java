package com.wordphrases.controller;

import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.ProgressInsightsResponse;
import com.wordphrases.dto.response.ProgressResponse;
import com.wordphrases.service.ProgressInsightsService;
import com.wordphrases.service.ProgressNarrativeService;
import com.wordphrases.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for progress tracking data (charts, stats).
 */
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController extends BaseController {

    private final ProgressService progressService;
    private final ProgressInsightsService progressInsightsService;
    private final ProgressNarrativeService progressNarrativeService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProgressResponse>> getProgress() {
        return ResponseEntity.ok(ApiResponse.ok(progressService.getProgress(getCurrentUserId())));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<ProgressInsightsResponse>> getInsights(
            @RequestParam(defaultValue = "30d") String range,
            @RequestParam(required = false) String timezone) {
        return ResponseEntity.ok(ApiResponse.ok(
                progressInsightsService.getInsights(getCurrentUserId(), range, timezone)));
    }

    @GetMapping("/narrative")
    public ResponseEntity<ApiResponse<ProgressInsightsResponse.Narrative>> getNarrative(
            @RequestParam(required = false) String timezone) {
        return ResponseEntity.ok(ApiResponse.ok(
                progressNarrativeService.getNarrative(getCurrentUserId(), timezone)));
    }
}
