package com.wordphrases.repository;

import com.wordphrases.model.User;
import com.wordphrases.model.Review;
import com.wordphrases.model.Word;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Data access layer for {@link Word} entities.
 */
@Repository
public interface WordRepository extends JpaRepository<Word, Long> {

    @Modifying
    @Query(value = "UPDATE words SET deleted_at = NULL, deleted_by = NULL WHERE id = :wordId AND user_id = :userId", nativeQuery = true)
    int restoreByIdAndUser(@Param("wordId") Long wordId, @Param("userId") Long userId);

    Page<Word> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query(value = "SELECT * FROM words WHERE user_id = :userId ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Word> findRandomPracticeWords(@Param("userId") Long userId, @Param("limit") int limit);

    Page<Word> findByUserAndEntryTypeOrderByCreatedAtDesc(User user, String entryType, Pageable pageable);

    /** Full-text search scoped to an entry type. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.entryType = :entryType AND (LOWER(w.word) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.definition) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Word> searchByUserAndEntryType(@Param("user") User user, @Param("query") String query, @Param("entryType") String entryType, Pageable pageable);

    Optional<Word> findByIdAndUser(Long id, User user);

    @Query("SELECT w FROM Word w WHERE w.user = :user AND LOWER(w.word) = LOWER(:word) AND (:entryType IS NULL OR w.entryType = :entryType) AND (:excludeId IS NULL OR w.id <> :excludeId)")
    List<Word> findDuplicates(@Param("user") User user,
                              @Param("word") String word,
                              @Param("entryType") String entryType,
                              @Param("excludeId") Long excludeId);

    List<Word> findByUserAndCategoryId(User user, Long categoryId);

    /** Words due for review today or overdue. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND (w.nextReviewDate IS NULL OR w.nextReviewDate <= :today) AND w.mastered = false ORDER BY w.nextReviewDate ASC NULLS FIRST")
    List<Word> findDueForReview(@Param("user") User user, @Param("today") LocalDate today);

    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false AND w.nextReviewDate < :today ORDER BY w.easeFactor ASC, w.lapseCount DESC, w.nextReviewDate ASC, w.id ASC")
    List<Word> findOverdueForToday(@Param("user") User user, @Param("today") LocalDate today, Pageable pageable);

    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false AND w.nextReviewDate = :today ORDER BY w.easeFactor ASC, w.lapseCount DESC, w.id ASC")
    List<Word> findDueToday(@Param("user") User user, @Param("today") LocalDate today, Pageable pageable);

    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false AND w.nextReviewDate IS NULL ORDER BY w.easeFactor ASC, w.lapseCount DESC, w.id ASC")
    List<Word> findUnscheduledDue(@Param("user") User user, Pageable pageable);

    @Query("SELECT DISTINCT w FROM Word w LEFT JOIN Review r ON r.word = w WHERE w.user = :user AND w.mastered = false AND r.id IS NULL ORDER BY w.createdAt DESC, w.id ASC")
    List<Word> findNewCards(@Param("user") User user, Pageable pageable);

    /** Non-mastered cards approaching their due date, prioritised by lower ease factor. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false AND w.nextReviewDate > :today AND w.nextReviewDate <= :through ORDER BY w.easeFactor ASC, w.lapseCount DESC, w.nextReviewDate ASC, w.id ASC")
    List<Word> findApproachingDueWords(@Param("user") User user,
                                       @Param("today") LocalDate today,
                                       @Param("through") LocalDate through,
                                       Pageable pageable);

    @Query("SELECT COUNT(w) FROM Word w WHERE w.user = :user AND w.mastered = false AND w.nextReviewDate > :today AND w.nextReviewDate <= :through")
    long countApproachingDueWords(@Param("user") User user,
                                  @Param("today") LocalDate today,
                                  @Param("through") LocalDate through);

    long countByUser(User user);

    long countByUserAndMastered(User user, Boolean mastered);

    @Query("SELECT COUNT(w) FROM Word w WHERE w.user = :user AND (w.nextReviewDate IS NULL OR w.nextReviewDate <= :today) AND w.mastered = false")
    long countDueForReview(@Param("user") User user, @Param("today") LocalDate today);

    /** Full-text search across word, definition and example sentence. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND (LOWER(w.word) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.definition) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Word> searchByUser(@Param("user") User user, @Param("query") String query, Pageable pageable);

    /** Pick one random word for the daily highlight (simple random approach). */
    @Query(value = "SELECT * FROM words WHERE user_id = :userId ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Word> findRandomByUser(@Param("userId") Long userId);

    /**
     * Filtered + sorted browse query — no text search.
     * Called when no search query is present so LOWER() is never
     * applied to an untyped null parameter (avoids lower(bytea) on PostgreSQL).
     */
    @Query("""
        SELECT w FROM Word w
        WHERE w.user = :user
          AND (:entryType  IS NULL OR w.entryType   = :entryType)
          AND (:categoryId IS NULL OR w.category.id = :categoryId)
          AND (:mastered   IS NULL OR w.mastered    = :mastered)
        AND (:dueOnly IS NULL OR :dueOnly = false OR (w.mastered = false AND (w.nextReviewDate IS NULL OR w.nextReviewDate <= :today)))
          AND (:scheduledDate IS NULL OR (w.mastered = false AND w.nextReviewDate = :scheduledDate))
        AND (:stage IS NULL OR (:stage = 'MASTERED' AND w.mastered = true)
            OR (:stage = 'NEW' AND w.mastered = false AND NOT EXISTS (SELECT r.id FROM Review r WHERE r.word = w))
            OR (:stage = 'LEARNING' AND w.mastered = false AND w.intervalDays < 7 AND EXISTS (SELECT r.id FROM Review r WHERE r.word = w))
            OR (:stage = 'YOUNG' AND w.mastered = false AND w.intervalDays >= 7 AND w.intervalDays < 21)
            OR (:stage = 'MATURE' AND w.mastered = false AND w.intervalDays >= 21))
        """)
    Page<Word> findWithFilters(
        @Param("user")       User    user,
        @Param("entryType")  String  entryType,
        @Param("categoryId") Long    categoryId,
        @Param("mastered")   Boolean mastered,
        @Param("dueOnly")    Boolean dueOnly,
        @Param("scheduledDate") LocalDate scheduledDate,
        @Param("today")      LocalDate today,
        @Param("stage")      String stage,
        Pageable pageable
    );

    /**
     * Filtered + sorted browse query WITH text search.
     * Only called when query is non-null, so LOWER() always receives a
     * properly typed varchar — never a null bytea.
     */
    @Query("""
        SELECT w FROM Word w
        WHERE w.user = :user
          AND (:entryType  IS NULL OR w.entryType   = :entryType)
          AND (:categoryId IS NULL OR w.category.id = :categoryId)
          AND (:mastered   IS NULL OR w.mastered    = :mastered)
        AND (:dueOnly IS NULL OR :dueOnly = false OR (w.mastered = false AND (w.nextReviewDate IS NULL OR w.nextReviewDate <= :today)))
          AND (:scheduledDate IS NULL OR (w.mastered = false AND w.nextReviewDate = :scheduledDate))
        AND (:stage IS NULL OR (:stage = 'MASTERED' AND w.mastered = true)
            OR (:stage = 'NEW' AND w.mastered = false AND NOT EXISTS (SELECT r.id FROM Review r WHERE r.word = w))
            OR (:stage = 'LEARNING' AND w.mastered = false AND w.intervalDays < 7 AND EXISTS (SELECT r.id FROM Review r WHERE r.word = w))
            OR (:stage = 'YOUNG' AND w.mastered = false AND w.intervalDays >= 7 AND w.intervalDays < 21)
            OR (:stage = 'MATURE' AND w.mastered = false AND w.intervalDays >= 21))
        AND (LOWER(w.word) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(w.definition) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(w.exampleSentence) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(w.notes) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(w.mnemonic) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(w.userExample) LIKE LOWER(CONCAT('%', :query, '%')))
        """)
    Page<Word> findWithFiltersAndSearch(
        @Param("user")       User    user,
        @Param("query")      String  query,
        @Param("entryType")  String  entryType,
        @Param("categoryId") Long    categoryId,
        @Param("mastered")   Boolean mastered,
        @Param("dueOnly")    Boolean dueOnly,
        @Param("scheduledDate") LocalDate scheduledDate,
        @Param("today")      LocalDate today,
        @Param("stage")      String stage,
        Pageable pageable
    );

    /** Top N hardest words: lowest ease factor, not yet mastered. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false ORDER BY w.easeFactor ASC, w.lapseCount DESC, w.nextReviewDate ASC, w.id ASC")
    List<Word> findWeakestWords(@Param("user") User user, Pageable pageable);

    /** Words due before the user's local calendar date. */
    @Query("SELECT COUNT(w) FROM Word w WHERE w.user = :user AND w.nextReviewDate < :today AND w.mastered = false")
    long countOverdue(@Param("user") User user, @Param("today") LocalDate today);

    long countByUserAndMasteredFalseAndNextReviewDate(User user, LocalDate nextReviewDate);

    long countByUserAndEntryType(User user, String entryType);

    @Query("SELECT COUNT(DISTINCT w) FROM Word w LEFT JOIN Review r ON r.word = w WHERE w.user = :user AND w.mastered = false AND r.id IS NULL")
    long countNewCards(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT w) FROM Word w JOIN Review r ON r.word = w WHERE w.user = :user AND w.mastered = false AND w.intervalDays < 7")
    long countLearningCards(@Param("user") User user);

    @Query("SELECT COUNT(w) FROM Word w WHERE w.user = :user AND w.mastered = false AND w.intervalDays >= 7 AND w.intervalDays < 21")
    long countYoungCards(@Param("user") User user);

    @Query("SELECT COUNT(w) FROM Word w WHERE w.user = :user AND w.mastered = false AND w.intervalDays >= 21")
    long countMatureCards(@Param("user") User user);

    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false AND w.intervalDays < 21 ORDER BY w.intervalDays DESC, w.repetitions DESC, w.easeFactor ASC")
    List<Word> findClosestToMature(User user, Pageable pageable);

    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false ORDER BY w.repetitions DESC, w.easeFactor ASC, w.lapseCount DESC, w.id ASC")
    List<Word> findClosestToMastery(User user, Pageable pageable);

    @Query("""
        SELECT w, COUNT(r), AVG(r.quality), SUM(CASE WHEN r.quality < 3 THEN 1 ELSE 0 END)
        FROM Word w JOIN Review r ON r.word = w
        WHERE w.user = :user AND r.reviewDate BETWEEN :from AND :to
        GROUP BY w
        HAVING SUM(CASE WHEN r.quality < 3 THEN 1 ELSE 0 END) >= :minLapses OR AVG(r.quality) < :maxAverage
        ORDER BY SUM(CASE WHEN r.quality < 3 THEN 1 ELSE 0 END) DESC, AVG(r.quality) ASC
        """)
    List<Object[]> findLeeches(@Param("user") User user,
                               @Param("from") LocalDate from,
                               @Param("to") LocalDate to,
                               @Param("minLapses") long minLapses,
                               @Param("maxAverage") double maxAverage,
                               Pageable pageable);

    @Query("SELECT w.nextReviewDate, COUNT(w) FROM Word w WHERE w.user = :user AND w.mastered = false AND w.nextReviewDate BETWEEN :from AND :to GROUP BY w.nextReviewDate ORDER BY w.nextReviewDate")
    List<Object[]> countScheduledReviewsByDate(@Param("user") User user,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    @Query("SELECT w.difficultyTier, COUNT(r), SUM(CASE WHEN r.quality >= 3 THEN 1 ELSE 0 END) FROM Review r JOIN r.word w WHERE r.user = :user AND r.reviewDate BETWEEN :from AND :to AND w.difficultyTier IS NOT NULL GROUP BY w.difficultyTier")
    List<Object[]> summarizeRecallByDifficulty(@Param("user") User user,
                                                @Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    /** Mastered count per category for a user. */
    @Query("SELECT w.category.id, COUNT(w) FROM Word w WHERE w.user = :user AND w.mastered = true AND w.category IS NOT NULL GROUP BY w.category.id")
    List<Object[]> countMasteredByCategory(@Param("user") User user);
}
