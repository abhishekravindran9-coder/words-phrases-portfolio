package com.wordphrases.controller;

import com.wordphrases.dto.request.JournalEntryRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.JournalEntryResponse;
import com.wordphrases.service.JournalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for journal entries.
 */
@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController extends BaseController {

    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JournalEntryResponse>>> getEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(journalService.getEntries(getCurrentUserId(), pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> getEntry(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(journalService.getEntryById(getCurrentUserId(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<JournalEntryResponse>> createEntry(@Valid @RequestBody JournalEntryRequest request) {
        JournalEntryResponse entry = journalService.createEntry(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Journal entry created", entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody JournalEntryRequest request) {

        return ResponseEntity.ok(ApiResponse.ok("Journal entry updated",
                journalService.updateEntry(getCurrentUserId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(@PathVariable Long id) {
        journalService.deleteEntry(getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Journal entry deleted", null));
    }
}
