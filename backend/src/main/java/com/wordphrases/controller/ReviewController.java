package com.wordphrases.controller;

import com.wordphrases.dto.request.ReviewResultRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.ReviewResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the spaced-repetition review session.
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController extends BaseController {

    private final ReviewService reviewService;

    /** Returns the list of words due for review today (or overdue). */
    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<WordResponse>>> getDueWords() {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getDueWords(getCurrentUserId())));
    }

    /** Submits a review result and returns the updated SM-2 schedule for that word. */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(@Valid @RequestBody ReviewResultRequest request) {
        ReviewResponse response = reviewService.submitReview(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Review recorded", response));
    }
}
