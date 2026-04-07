package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Records a completed quiz session for a user.
 */
@Entity
@Table(
    name = "quiz_sessions",
    indexes = {
        @Index(name = "idx_quiz_sessions_user_id", columnList = "user_id"),
        @Index(name = "idx_quiz_sessions_completed_at", columnList = "completed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Total number of questions in this session. */
    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    /** Number of correctly answered questions. */
    @Column(name = "correct_count", nullable = false)
    private Integer correctCount;

    /** Total elapsed time for the session, in seconds. */
    @Column(name = "total_time_seconds")
    private Integer totalTimeSeconds;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @Builder.Default
    @OneToMany(mappedBy = "quizSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<QuizAnswer> answers = new ArrayList<>();
}
