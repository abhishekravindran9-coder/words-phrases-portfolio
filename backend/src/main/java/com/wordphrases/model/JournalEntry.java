package com.wordphrases.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a user's journal entry – a short story or reflection using vocabulary words.
 * Words used in the entry are linked via a many-to-many join table.
 */
@Entity
@Table(
    name = "journal_entries",
    indexes = {
        @Index(name = "idx_journal_user_id", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Mood tag, e.g. "happy", "motivated", "challenged". */
    @Column(length = 50)
    private String mood;

    /** Vocabulary words explicitly used or referenced in this entry. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "journal_words",
        joinColumns = @JoinColumn(name = "journal_id"),
        inverseJoinColumns = @JoinColumn(name = "word_id")
    )
    @Builder.Default
    private List<Word> usedWords = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
