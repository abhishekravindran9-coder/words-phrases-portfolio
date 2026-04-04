package com.wordphrases.repository;

import com.wordphrases.model.Review;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Data access layer for {@link Review} entities.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUserAndReviewDateBetweenOrderByReviewDateAsc(User user, LocalDate from, LocalDate to);

    List<Review> findByWordOrderByCreatedAtDesc(Word word);

    long countByUser(User user);

    /** Count reviews per day within a date range – used for progress charts. */
    @Query("SELECT r.reviewDate, COUNT(r) FROM Review r WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to GROUP BY r.reviewDate ORDER BY r.reviewDate ASC")
    List<Object[]> countReviewsPerDay(@Param("user") User user,
                                      @Param("from") LocalDate from,
                                      @Param("to") LocalDate to);

    /** Average quality score over a window. */
    @Query("SELECT AVG(r.quality) FROM Review r WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to")
    Double averageQuality(@Param("user") User user,
                          @Param("from") LocalDate from,
                          @Param("to") LocalDate to);

    /** Returns distinct dates on which at least one review occurred – for streak computation. */
    @Query("SELECT DISTINCT r.reviewDate FROM Review r WHERE r.user = :user ORDER BY r.reviewDate DESC")
    List<LocalDate> findDistinctReviewDatesByUser(@Param("user") User user);

    /** Count reviews done on a specific date. */
    long countByUserAndReviewDate(@Param("user") User user, @Param("date") LocalDate date);

    /** Maximum reviews in a single day (all-time). */
    @Query("SELECT MAX(cnt) FROM (SELECT COUNT(r) AS cnt FROM Review r WHERE r.user = :user GROUP BY r.reviewDate) sub")
    Long maxReviewsInSingleDay(@Param("user") User user);
}
