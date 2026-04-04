package com.wordphrases.repository;

import com.wordphrases.model.JournalEntry;
import com.wordphrases.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
