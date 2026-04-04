package com.wordphrases.repository;

import com.wordphrases.model.Reminder;
import com.wordphrases.model.ReminderType;
import com.wordphrases.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access layer for {@link Reminder} entities.
 */
@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByUserOrderByCreatedAtDesc(User user);

    Optional<Reminder> findByIdAndUser(Long id, User user);

    /** Fetches all enabled reminders of a given type – used by the scheduler. */
    List<Reminder> findByTypeAndEnabled(ReminderType type, Boolean enabled);
}
