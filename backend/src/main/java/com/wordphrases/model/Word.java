package com.wordphrases.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a vocabulary word or phrase belonging to a user.
 * Contains SM-2 spaced-repetition scheduling fields: easeFactor, intervalDays, repetitions.
 */
@Entity
@Table(
    name = "words",
    indexes = {
        @Index(name = "idx_words_user_id", columnList = "user_id"),
        @Index(name = "idx_words_next_review", columnList = "next_review_date"),
        @Index(name = "idx_words_user_difficulty", columnList = "user_id, difficulty_tier")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("deleted_at IS NULL")
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String word;

    /** "WORD" or "PHRASE" — distinguishes vocabulary words from multi-word expressions. */
    @Column(name = "entry_type", length = 10)
    @Builder.Default
    private String entryType = "WORD";

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Difficulty assigned at creation/enrichment; null means not rated. */
    @Column(name = "difficulty_tier", length = 20)
    private String difficultyTier;

    @Column(name = "deleted_at")
    private java.time.Instant deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    private String pronunciation;

    @Column(name = "part_of_speech", length = 80)
    private String partOfSpeech;

    @Column(columnDefinition = "TEXT")
    private String etymology;

    @Column(columnDefinition = "TEXT")
    private String mnemonic;

    @Column(name = "usage_note", columnDefinition = "TEXT")
    private String usageNote;

    @Column(columnDefinition = "TEXT")
    private String synonyms;

    @Column(columnDefinition = "TEXT")
    private String antonyms;

    @Column(name = "source_context", columnDefinition = "TEXT")
    private String sourceContext;

    @Column(name = "user_example", columnDefinition = "TEXT")
    private String userExample;

    @Column(name = "user_mnemonic", columnDefinition = "TEXT")
    private String userMnemonic;

    @Column(name = "ai_enrichment_status", length = 32)
    private String aiEnrichmentStatus;

    @Column(name = "ai_enrichment_version", length = 32)
    private String aiEnrichmentVersion;

    // ── SM-2 Spaced Repetition Fields ──────────────────────────────────

    /** Easiness factor (≥1.3). Default 2.5. Controls how quickly intervals grow. */
    @Column(name = "ease_factor", nullable = false)
    @Builder.Default
    private Double easeFactor = 2.5;

    /** Days until the next review. Starts at 1. */
    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private Integer intervalDays = 1;

    /** Number of successful repetitions in a row. */
    @Column(nullable = false)
    @Builder.Default
    private Integer repetitions = 0;

    /** Scheduled date for next review. */
    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    /** True when the word has been consistently answered correctly (repetitions >= 5). */
    @Column(nullable = false)
    @Builder.Default
    private Boolean mastered = false;

    /** Count of failed recalls observed by the scheduler. */
    @Column(name = "lapse_count", nullable = false)
    @Builder.Default
    private Integer lapseCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "word", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @ManyToMany(mappedBy = "usedWords", fetch = FetchType.LAZY)
    @Builder.Default
    private List<JournalEntry> journalEntries = new ArrayList<>();
}
