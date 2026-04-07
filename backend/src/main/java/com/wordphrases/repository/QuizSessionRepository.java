package com.wordphrases.repository;

import com.wordphrases.model.QuizSession;
import com.wordphrases.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {

    long countByUser(User user);

    List<QuizSession> findByUserOrderByCompletedAtDesc(User user);

    List<QuizSession> findTop10ByUserOrderByCompletedAtDesc(User user);

    @Query("SELECT MAX(CAST(qs.correctCount AS double) / qs.questionCount * 100) FROM QuizSession qs WHERE qs.user = :user AND qs.questionCount > 0")
    Double findBestScoreByUser(@Param("user") User user);

    @Query("SELECT AVG(CAST(qs.correctCount AS double) / qs.questionCount * 100) FROM QuizSession qs WHERE qs.user = :user AND qs.questionCount > 0")
    Double findAverageScoreByUser(@Param("user") User user);
}
