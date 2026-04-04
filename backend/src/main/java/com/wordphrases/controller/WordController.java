package com.wordphrases.controller;

import com.wordphrases.dto.request.WordRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.service.WordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for vocabulary word / phrase management.
 * All endpoints require authentication.
 */
@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController extends BaseController {

    private final WordService wordService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WordResponse>>> getWords(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<WordResponse> words = wordService.getWordsForUser(getCurrentUserId(), query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(words));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WordResponse>> getWord(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(wordService.getWordById(getCurrentUserId(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WordResponse>> createWord(@Valid @RequestBody WordRequest request) {
        WordResponse word = wordService.createWord(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Word added successfully", word));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WordResponse>> updateWord(
            @PathVariable Long id,
            @Valid @RequestBody WordRequest request) {

        return ResponseEntity.ok(ApiResponse.ok("Word updated", wordService.updateWord(getCurrentUserId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWord(@PathVariable Long id) {
        wordService.deleteWord(getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Word deleted", null));
    }
}
