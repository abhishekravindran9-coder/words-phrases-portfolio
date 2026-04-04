package com.wordphrases.service;

import com.wordphrases.model.Reminder;
import com.wordphrases.model.ReminderFrequency;
import com.wordphrases.model.ReminderType;
import com.wordphrases.repository.ReminderRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Sends email reminders via Spring Mail.
 * The scheduler runs every minute and delivers reminders whose configured time
 * falls within the current minute window.
 */
@Service
@ConditionalOnBean(JavaMailSender.class)
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final ReminderRepository reminderRepository;
    private final WordRepository wordRepository;

    private static final Map<String, DayOfWeek> DAY_MAP = Map.of(
            "MON", DayOfWeek.MONDAY,
            "TUE", DayOfWeek.TUESDAY,
            "WED", DayOfWeek.WEDNESDAY,
            "THU", DayOfWeek.THURSDAY,
            "FRI", DayOfWeek.FRIDAY,
            "SAT", DayOfWeek.SATURDAY,
            "SUN", DayOfWeek.SUNDAY
    );

    /**
     * Runs every minute. Finds enabled email reminders due right now and dispatches emails.
     */
    @Scheduled(cron = "0 * * * * *")
    public void processEmailReminders() {
        LocalTime now = LocalTime.now().withSecond(0).withNano(0);
        DayOfWeek today = LocalDate.now().getDayOfWeek();

        List<Reminder> reminders = reminderRepository.findByTypeAndEnabled(ReminderType.EMAIL, true);

        for (Reminder reminder : reminders) {
            if (!reminder.getReminderTime().equals(now)) continue;
            if (reminder.getFrequency() == ReminderFrequency.WEEKLY && !isScheduledToday(reminder, today)) continue;

            try {
                sendReminderEmail(reminder);
            } catch (Exception e) {
                log.error("Failed to send reminder email to user {}: {}",
                        reminder.getUser().getEmail(), e.getMessage());
            }
        }
    }

    private boolean isScheduledToday(Reminder reminder, DayOfWeek today) {
        if (reminder.getDaysOfWeek() == null) return false;
        return Arrays.stream(reminder.getDaysOfWeek().split(","))
                .map(String::trim)
                .map(DAY_MAP::get)
                .anyMatch(day -> day == today);
    }

    private void sendReminderEmail(Reminder reminder) {
        long dueCount = wordRepository.countDueForReview(reminder.getUser(), LocalDate.now());
        String userEmail = reminder.getUser().getEmail();
        String displayName = reminder.getUser().getDisplayName() != null
                ? reminder.getUser().getDisplayName()
                : reminder.getUser().getUsername();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(userEmail);
        message.setSubject("📚 Words & Phrases – Time to Review!");
        message.setText(String.format(
                "Hi %s,%n%nYou have %d word(s) due for review today.%n%n" +
                "Keep your streak going! Visit your dashboard to start reviewing.%n%n" +
                "Happy learning,%nWords & Phrases Team",
                displayName, dueCount
        ));

        mailSender.send(message);
        log.info("Reminder email sent to {}", userEmail);
    }
}
