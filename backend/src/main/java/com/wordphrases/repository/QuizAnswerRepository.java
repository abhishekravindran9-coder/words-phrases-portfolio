package com.wordphrases.repository;

import com.wordphrases.model.QuizAnswer;
import com.wordphrases.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {

    @Query("SELECT COUNT(qa) FROM QuizAnswer qa WHERE qa.quizSession.user = :user")
    long countAllByUser(@Param("user") User user);

    @Query("SELECT COUNT(qa) FROM QuizAnswer qa WHERE qa.quizSession.user = :user AND qa.correct = true")
    long countCorrectByUser(@Param("user") User user);

    /** Returns [questionType, total] per type. */
    @Query("SELECT qa.questionType, COUNT(qa) FROM QuizAnswer qa WHERE qa.quizSession.user = :user GROUP BY qa.questionType")
    List<Object[]> countByTypeForUser(@Param("user") User user);

    /** Returns [questionType, correctTotal] per type. */
    @Query("SELECT qa.questionType, COUNT(qa) FROM QuizAnswer qa WHERE qa.quizSession.user = :user AND qa.correct = true GROUP BY qa.questionType")
    List<Object[]> countCorrectByTypeForUser(@Param("user") User user);

    /** Returns [word, wrongCount] ordered by most missed. */
    @Query("SELECT qa.word, COUNT(qa) FROM QuizAnswer qa WHERE qa.quizSession.user = :user AND qa.correct = false GROUP BY qa.word ORDER BY COUNT(qa) DESC")
    List<Object[]> findMostMissedWordsForUser(@Param("user") User user);

    /** Returns [word, totalAttempts] for all attempted words. */
    @Query("SELECT qa.word, COUNT(qa) FROM QuizAnswer qa WHERE qa.quizSession.user = :user GROUP BY qa.word")
    List<Object[]> countAllByWordForUser(@Param("user") User user);

    @Query("SELECT AVG(qa.timeTakenSeconds) FROM QuizAnswer qa WHERE qa.quizSession.user = :user AND qa.timeTakenSeconds IS NOT NULL AND qa.timeTakenSeconds > 0")
    Double findAverageTimePerQuestionForUser(@Param("user") User user);
}
