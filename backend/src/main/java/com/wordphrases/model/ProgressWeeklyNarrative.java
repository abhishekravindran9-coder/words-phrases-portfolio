package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "progress_weekly_narratives", uniqueConstraints = @UniqueConstraint(
        name = "uk_progress_weekly_narrative", columnNames = {"user_id", "week_start", "timezone_id"}),
        indexes = @Index(name = "idx_progress_narrative_user_week", columnList = "user_id, week_start"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProgressWeeklyNarrative {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "timezone_id", nullable = false, length = 64)
    private String timezoneId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String narrative;

    @Column(name = "facts_hash", nullable = false, length = 64)
    private String factsHash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
