package com.wordphrases.repository;

import com.wordphrases.model.JournalEntry;
import com.wordphrases.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Data access layer for {@link JournalEntry} entities.
 */
@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Page<JournalEntry> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Optional<JournalEntry> findByIdAndUser(Long id, User user);

    long countByUser(User user);

    long countByUserAndCreatedAtGreaterThanEqual(User user, LocalDateTime from);

    @Query("SELECT COUNT(DISTINCT w.id) FROM JournalEntry j JOIN j.usedWords w WHERE j.user = :user AND j.createdAt >= :from")
    long countDistinctWordsPracticedInJournal(@Param("user") User user,
                                             @Param("from") LocalDateTime from);
}
