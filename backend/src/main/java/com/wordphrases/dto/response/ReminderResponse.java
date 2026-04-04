package com.wordphrases.dto.response;

import com.wordphrases.model.ReminderFrequency;
import com.wordphrases.model.ReminderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Response DTO for a reminder.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderResponse {

    private Long id;
    private ReminderType type;
    private ReminderFrequency frequency;
    private LocalTime reminderTime;
    private String daysOfWeek;
    private Boolean enabled;
    private LocalDateTime createdAt;
}
