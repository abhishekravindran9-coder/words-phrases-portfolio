package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * A scheduled reminder associated with a user.
 * Supports EMAIL and PUSH delivery at configurable times and days.
 */
@Entity
@Table(name = "reminders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReminderType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReminderFrequency frequency;

    /** Time of day to send the reminder (stored in user's local timezone). */
    @Column(name = "reminder_time", nullable = false)
    private LocalTime reminderTime;

    /**
     * Comma-separated day abbreviations for WEEKLY reminders.
     * E.g. "MON,WED,FRI". Null for DAILY reminders.
     */
    @Column(name = "days_of_week", length = 50)
    private String daysOfWeek;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
