package com.wordphrases.repository;

import com.wordphrases.model.Loan;
import com.wordphrases.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    Optional<Loan> findByProperty(Property property);
}
