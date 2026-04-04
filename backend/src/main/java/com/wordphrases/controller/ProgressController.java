package com.wordphrases.controller;

import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.ProgressResponse;
import com.wordphrases.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for progress tracking data (charts, stats).
 */
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController extends BaseController {

    private final ProgressService progressService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProgressResponse>> getProgress() {
        return ResponseEntity.ok(ApiResponse.ok(progressService.getProgress(getCurrentUserId())));
    }
}
