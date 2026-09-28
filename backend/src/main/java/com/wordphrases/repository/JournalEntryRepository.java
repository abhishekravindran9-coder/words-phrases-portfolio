package com.wordphrases.repository;

import com.wordphrases.model.JournalEntry;
import com.wordphrases.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Data access layer for {@link JournalEntry} entities.
 */
@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Page<JournalEntry> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Optional<JournalEntry> findByIdAndUser(Long id, User user);

    long countByUser(User user);

    Optional<JournalEntry> findFirstByUserOrderByCreatedAtDesc(User user);

    long countByUserAndCreatedAtGreaterThanEqual(User user, LocalDateTime from);

    @Query("SELECT COUNT(DISTINCT w.id) FROM JournalEntry j JOIN j.usedWords w WHERE j.user = :user AND j.createdAt >= :from")
    long countDistinctWordsPracticedInJournal(@Param("user") User user,
                                             @Param("from") LocalDateTime from);

    @Query("SELECT DISTINCT w.id, MIN(j.createdAt) FROM JournalEntry j JOIN j.usedWords w WHERE j.user = :user AND j.createdAt >= :from GROUP BY w.id")
    List<Object[]> findJournalPracticedWordsSince(@Param("user") User user, @Param("from") LocalDateTime from);
}
