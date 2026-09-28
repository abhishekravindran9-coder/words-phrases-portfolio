package com.wordphrases.repository;

import com.wordphrases.model.ProgressWeeklyNarrative;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface ProgressWeeklyNarrativeRepository extends JpaRepository<ProgressWeeklyNarrative, Long> {
    Optional<ProgressWeeklyNarrative> findByUserIdAndWeekStartAndTimezoneId(Long userId, LocalDate weekStart, String timezoneId);
}
