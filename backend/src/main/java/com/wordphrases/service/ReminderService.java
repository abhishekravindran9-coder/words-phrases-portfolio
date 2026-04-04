package com.wordphrases.service;

import com.wordphrases.dto.request.ReminderRequest;
import com.wordphrases.dto.response.ReminderResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.Reminder;
import com.wordphrases.model.User;
import com.wordphrases.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for user-configured reminders (CRUD).
 */
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ReminderResponse> getReminders(Long userId) {
        User user = userService.getUserById(userId);
        return reminderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReminderResponse createReminder(Long userId, ReminderRequest request) {
        User user = userService.getUserById(userId);
        String daysStr = buildDaysString(request);

        Reminder reminder = Reminder.builder()
                .user(user)
                .type(request.getType())
                .frequency(request.getFrequency())
                .reminderTime(request.getReminderTime())
                .daysOfWeek(daysStr)
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .build();

        return toResponse(reminderRepository.save(reminder));
    }

    @Transactional
    public ReminderResponse updateReminder(Long userId, Long reminderId, ReminderRequest request) {
        User user = userService.getUserById(userId);
        Reminder reminder = reminderRepository.findByIdAndUser(reminderId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder", "id", reminderId));

        reminder.setType(request.getType());
        reminder.setFrequency(request.getFrequency());
        reminder.setReminderTime(request.getReminderTime());
        reminder.setDaysOfWeek(buildDaysString(request));
        if (request.getEnabled() != null) reminder.setEnabled(request.getEnabled());

        return toResponse(reminderRepository.save(reminder));
    }

    @Transactional
    public void deleteReminder(Long userId, Long reminderId) {
        User user = userService.getUserById(userId);
        Reminder reminder = reminderRepository.findByIdAndUser(reminderId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder", "id", reminderId));
        reminderRepository.delete(reminder);
    }

    private String buildDaysString(ReminderRequest request) {
        if (request.getDaysOfWeek() == null || request.getDaysOfWeek().isEmpty()) return null;
        return String.join(",", request.getDaysOfWeek());
    }

    private ReminderResponse toResponse(Reminder reminder) {
        return ReminderResponse.builder()
                .id(reminder.getId())
                .type(reminder.getType())
                .frequency(reminder.getFrequency())
                .reminderTime(reminder.getReminderTime())
                .daysOfWeek(reminder.getDaysOfWeek())
                .enabled(reminder.getEnabled())
                .createdAt(reminder.getCreatedAt())
                .build();
    }
}
