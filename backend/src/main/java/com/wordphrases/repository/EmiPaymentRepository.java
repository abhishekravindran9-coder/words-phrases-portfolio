package com.wordphrases.repository;

import com.wordphrases.model.EmiPayment;
import com.wordphrases.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmiPaymentRepository extends JpaRepository<EmiPayment, Long> {

    List<EmiPayment> findByLoanOrderByMonthNumberAsc(Loan loan);

    Optional<EmiPayment> findByLoanAndMonthNumber(Loan loan, Integer monthNumber);
}
