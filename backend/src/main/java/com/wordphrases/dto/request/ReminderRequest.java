package com.wordphrases.dto.request;

import com.wordphrases.model.ReminderFrequency;
import com.wordphrases.model.ReminderType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

/**
 * Payload for creating or updating a reminder.
 */
@Data
public class ReminderRequest {

    @NotNull(message = "Reminder type is required")
    private ReminderType type;

    @NotNull(message = "Frequency is required")
    private ReminderFrequency frequency;

    @NotNull(message = "Reminder time is required")
    private LocalTime reminderTime;

    /**
     * For WEEKLY reminders: list of abbreviated day names, e.g. ["MON","WED","FRI"].
     * Ignored for DAILY reminders.
     */
    private List<String> daysOfWeek;

    private Boolean enabled = true;
}
