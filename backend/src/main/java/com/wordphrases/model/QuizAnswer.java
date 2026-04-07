package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Records a single answer within a quiz session.
 */
@Entity
@Table(
    name = "quiz_answers",
    indexes = {
        @Index(name = "idx_quiz_answers_session_id", columnList = "quiz_session_id"),
        @Index(name = "idx_quiz_answers_word_id", columnList = "word_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_session_id", nullable = false)
    private QuizSession quizSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    /** MULTIPLE_CHOICE | FILL_BLANK_WORD | FILL_BLANK_SENTENCE */
    @Column(name = "question_type", nullable = false, length = 30)
    private String questionType;

    @Column(name = "correct", nullable = false)
    private Boolean correct;

    /** Time spent on this question, in seconds. */
    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;
}
