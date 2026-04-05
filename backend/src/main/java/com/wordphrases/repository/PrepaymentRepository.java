package com.wordphrases.repository;

import com.wordphrases.model.Loan;
import com.wordphrases.model.Prepayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrepaymentRepository extends JpaRepository<Prepayment, Long> {

    List<Prepayment> findByLoanOrderByPrepaymentDateAsc(Loan loan);
}
