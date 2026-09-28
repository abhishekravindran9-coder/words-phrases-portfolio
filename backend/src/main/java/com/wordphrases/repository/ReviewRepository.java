package com.wordphrases.repository;

import com.wordphrases.model.Review;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;

/**
 * Data access layer for {@link Review} entities.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUserAndReviewDateBetweenOrderByReviewDateAsc(User user, LocalDate from, LocalDate to);

    List<Review> findByWordOrderByCreatedAtDesc(Word word);

    List<Review> findByUserAndWordOrderByReviewDateDesc(User user, Word word);

    long countByUser(User user);

    long countByWord(Word word);

    long countByUserAndQualityGreaterThanEqual(User user, Integer quality);

    java.util.Optional<Review> findFirstByUserOrderByReviewDateAsc(User user);

    List<Review> findByUserAndReviewedAtBetweenOrderByReviewedAtAsc(User user, Instant from, Instant to);

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

    long countByUserAndReviewDateBetween(User user, LocalDate from, LocalDate to);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to AND r.quality >= 3")
    long countSuccessfulReviews(@Param("user") User user,
                                @Param("from") LocalDate from,
                                @Param("to") LocalDate to);

    /** Returns category name, color, review count, average SM-2 quality, and failed-review count. */
    @Query("""
        SELECT c.name, c.color, COUNT(r), AVG(r.quality),
               SUM(CASE WHEN r.quality < 3 THEN 1 ELSE 0 END)
        FROM Review r JOIN r.word w JOIN w.category c
        WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to
        GROUP BY c.id, c.name, c.color
        HAVING COUNT(r) >= :minimumReviews
        ORDER BY AVG(r.quality) ASC, COUNT(r) DESC
        """)
    List<Object[]> findWeakestCategoryRecall(@Param("user") User user,
                                              @Param("from") LocalDate from,
                                              @Param("to") LocalDate to,
                                              @Param("minimumReviews") long minimumReviews);

    @Query("SELECT COUNT(r), SUM(CASE WHEN r.quality >= 3 THEN 1 ELSE 0 END) FROM Review r WHERE r.user = :user AND r.intervalBeforeDays >= 21 AND r.reviewDate BETWEEN :from AND :to")
    Object[] summarizeMatureRetention(@Param("user") User user, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT r.questionFormat, COUNT(r), SUM(CASE WHEN r.quality >= 3 THEN 1 ELSE 0 END) FROM Review r WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to AND r.questionFormat IS NOT NULL GROUP BY r.questionFormat")
    List<Object[]> summarizeByFormat(@Param("user") User user, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT r.word.entryType, COUNT(r), SUM(CASE WHEN r.quality >= 3 THEN 1 ELSE 0 END) FROM Review r WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to GROUP BY r.word.entryType")
    List<Object[]> summarizeByEntryType(@Param("user") User user, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT r.reviewDate, COUNT(r) FROM Review r WHERE r.user = :user AND r.intervalBeforeDays < 21 AND r.intervalAfterDays >= 21 AND r.reviewDate BETWEEN :from AND :to GROUP BY r.reviewDate ORDER BY r.reviewDate")
    List<Object[]> countGraduationsByDate(@Param("user") User user, @Param("from") LocalDate from, @Param("to") LocalDate to);

    /** Maximum reviews in a single day (all-time). */
    @Query("SELECT MAX(cnt) FROM (SELECT COUNT(r) AS cnt FROM Review r WHERE r.user = :user GROUP BY r.reviewDate) sub")
    Long maxReviewsInSingleDay(@Param("user") User user);
}
