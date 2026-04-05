package com.wordphrases.repository;

import com.wordphrases.model.Property;
import com.wordphrases.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    List<Property> findByUserOrderByCreatedAtDesc(User user);

    Optional<Property> findByIdAndUser(Long id, User user);
}
