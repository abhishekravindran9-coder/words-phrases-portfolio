package com.wordphrases.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Records a single review event for a vocabulary word.
 * The quality field follows the SM-2 scale (0–5).
 * <pre>
 *   0 – Complete blackout
 *   1 – Incorrect; correct was easy to recall
 *   2 – Incorrect; correct recalled only on seeing the answer
 *   3 – Correct with significant difficulty
 *   4 – Correct after hesitation
 *   5 – Perfect recall
 * </pre>
 */
@Entity
@Table(
    name = "reviews",
    indexes = {
        @Index(name = "idx_reviews_user_id", columnList = "user_id"),
        @Index(name = "idx_reviews_review_date", columnList = "review_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    /** SM-2 quality rating: 0 (worst) – 5 (best). */
    @Min(0)
    @Max(5)
    @Column(nullable = false)
    private Integer quality;

    /** How long the user spent on this card, in seconds. */
    @Column(name = "time_taken_seconds")
    private Long timeTakenSeconds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
