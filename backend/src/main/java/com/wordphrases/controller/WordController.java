package com.wordphrases.controller;

import com.wordphrases.dto.request.WordRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.dto.response.WordStatsResponse;
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

import java.util.List;

/**
 * REST controller for vocabulary word / phrase management.
 * All endpoints require authentication.
 */
@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController extends BaseController {

    private final WordService wordService;

    /** Aggregate counts used by the stats bar (not affected by browse filters). */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<WordStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(wordService.getStatsForUser(getCurrentUserId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WordResponse>>> getWords(
            @RequestParam(required = false) String  query,
            @RequestParam(required = false) String  entryType,
            @RequestParam(required = false) Long    categoryId,
            @RequestParam(required = false) Boolean mastered,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        // Whitelist sortBy to prevent injection via arbitrary field names
        List<String> allowed = List.of("createdAt", "word", "nextReviewDate", "easeFactor", "repetitions");
        String safeSort = allowed.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(safeSort).ascending()
                : Sort.by(safeSort).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<WordResponse> words = wordService.getWordsForUser(
                getCurrentUserId(), query, entryType, categoryId, mastered, pageable);
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
