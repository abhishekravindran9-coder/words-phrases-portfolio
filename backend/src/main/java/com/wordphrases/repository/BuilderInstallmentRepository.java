package com.wordphrases.repository;

import com.wordphrases.model.BuilderInstallment;
import com.wordphrases.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BuilderInstallmentRepository extends JpaRepository<BuilderInstallment, Long> {

    List<BuilderInstallment> findByPropertyOrderByDueDateAsc(Property property);

    Optional<BuilderInstallment> findByIdAndProperty(Long id, Property property);
}
