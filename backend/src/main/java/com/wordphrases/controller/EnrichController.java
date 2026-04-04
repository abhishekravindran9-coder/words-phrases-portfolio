package com.wordphrases.controller;

import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.EnrichResponse;
import com.wordphrases.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Provides auto-enrichment for vocabulary entries via Gemini.
 * Both words and phrases are handled server-side so the API key
 * is never exposed to the browser.
 */
@RestController
@RequestMapping("/api/enrich")
@RequiredArgsConstructor
public class EnrichController extends BaseController {

    private final GeminiService geminiService;

    /**
     * POST /api/enrich/word
     * Body: {"word": "serendipity"}
     */
    @PostMapping("/word")
    public ResponseEntity<ApiResponse<EnrichResponse>> enrichWord(@RequestBody Map<String, String> body) {
        return enrich(body.get("word"), "word", geminiService::enrichWord);
    }

    /**
     * POST /api/enrich/phrase
     * Body: {"phrase": "break a leg"}
     */
    @PostMapping("/phrase")
    public ResponseEntity<ApiResponse<EnrichResponse>> enrichPhrase(@RequestBody Map<String, String> body) {
        return enrich(body.get("phrase"), "phrase", geminiService::enrichPhrase);
    }

    private ResponseEntity<ApiResponse<EnrichResponse>> enrich(
            String input, String fieldName,
            java.util.function.Function<String, EnrichResponse> enrichFn) {
        if (input == null || input.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("'" + fieldName + "' field is required"));
        }
        try {
            return ResponseEntity.ok(ApiResponse.ok("Enriched successfully", enrichFn.apply(input.trim())));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(ApiResponse.error("Enrichment failed: " + e.getMessage()));
        }
    }
}
