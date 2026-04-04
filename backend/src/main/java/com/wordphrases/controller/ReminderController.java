package com.wordphrases.controller;

import com.wordphrases.dto.request.ReminderRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.ReminderResponse;
import com.wordphrases.service.ReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for user reminder settings.
 */
@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController extends BaseController {

    private final ReminderService reminderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReminderResponse>>> getReminders() {
        return ResponseEntity.ok(ApiResponse.ok(reminderService.getReminders(getCurrentUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReminderResponse>> createReminder(@Valid @RequestBody ReminderRequest request) {
        ReminderResponse reminder = reminderService.createReminder(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Reminder created", reminder));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReminderResponse>> updateReminder(
            @PathVariable Long id,
            @Valid @RequestBody ReminderRequest request) {

        return ResponseEntity.ok(ApiResponse.ok("Reminder updated",
                reminderService.updateReminder(getCurrentUserId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReminder(@PathVariable Long id) {
        reminderService.deleteReminder(getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Reminder deleted", null));
    }
}
