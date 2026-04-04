package com.wordphrases.repository;

import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Data access layer for {@link Word} entities.
 */
@Repository
public interface WordRepository extends JpaRepository<Word, Long> {

    Page<Word> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<Word> findByUserAndEntryTypeOrderByCreatedAtDesc(User user, String entryType, Pageable pageable);

    /** Full-text search scoped to an entry type. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.entryType = :entryType AND (LOWER(w.word) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.definition) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Word> searchByUserAndEntryType(@Param("user") User user, @Param("query") String query, @Param("entryType") String entryType, Pageable pageable);

    Optional<Word> findByIdAndUser(Long id, User user);

    List<Word> findByUserAndCategoryId(User user, Long categoryId);

    /** Words due for review today or overdue. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND (w.nextReviewDate IS NULL OR w.nextReviewDate <= :today) AND w.mastered = false ORDER BY w.nextReviewDate ASC NULLS FIRST")
    List<Word> findDueForReview(@Param("user") User user, @Param("today") LocalDate today);

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
        """)
    Page<Word> findWithFilters(
        @Param("user")       User    user,
        @Param("entryType")  String  entryType,
        @Param("categoryId") Long    categoryId,
        @Param("mastered")   Boolean mastered,
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
          AND (LOWER(w.word)       LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(w.definition) LIKE LOWER(CONCAT('%', :query, '%')))
        """)
    Page<Word> findWithFiltersAndSearch(
        @Param("user")       User    user,
        @Param("query")      String  query,
        @Param("entryType")  String  entryType,
        @Param("categoryId") Long    categoryId,
        @Param("mastered")   Boolean mastered,
        Pageable pageable
    );

    /** Top N hardest words: lowest ease factor, not yet mastered. */
    @Query("SELECT w FROM Word w WHERE w.user = :user AND w.mastered = false ORDER BY w.easeFactor ASC, w.repetitions ASC")
    List<Word> findWeakestWords(@Param("user") User user, Pageable pageable);

    /** Words overdue by more than 1 day. */
    @Query("SELECT COUNT(w) FROM Word w WHERE w.user = :user AND w.nextReviewDate < :yesterday AND w.mastered = false")
    long countOverdue(@Param("user") User user, @Param("yesterday") LocalDate yesterday);

    long countByUserAndEntryType(User user, String entryType);

    /** Mastered count per category for a user. */
    @Query("SELECT w.category.id, COUNT(w) FROM Word w WHERE w.user = :user AND w.mastered = true AND w.category IS NOT NULL GROUP BY w.category.id")
    List<Object[]> countMasteredByCategory(@Param("user") User user);
}
