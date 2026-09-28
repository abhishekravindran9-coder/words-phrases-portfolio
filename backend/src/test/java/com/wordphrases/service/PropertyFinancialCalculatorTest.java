package com.wordphrases.service;

import com.wordphrases.dto.response.AmortizationEntryResponse;
import com.wordphrases.model.EmiPayment;
import com.wordphrases.model.Loan;
import com.wordphrases.model.Prepayment;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PropertyFinancialCalculatorTest {
    private Loan loan() {
        return Loan.builder()
                .sanctionedAmount(2_022_500.0)
                .interestRate(8.5)
                .tenureMonths(120)
                .emiStartDate(LocalDate.of(2025, 1, 31))
                .build();
    }

    @Test
    void computesExpectedEmiWithHalfUpCents() {
        assertEquals(new BigDecimal("25076.11"),
                PropertyFinancialCalculator.calculateEmi(
                        new BigDecimal("2022500"), new BigDecimal("8.5"), 120));
    }

    @Test
    void prepaymentsCloseLoanAndPreservePrincipalInvariant() {
        Loan loan = loan();
        List<EmiPayment> payments = java.util.stream.IntStream.rangeClosed(1, 20)
                .mapToObj(month -> EmiPayment.builder().loan(loan).monthNumber(month).paid(true).build())
                .toList();
        List<Prepayment> prepayments = List.of(
                Prepayment.builder().loan(loan).amount(600_000.0).prepaymentDate(LocalDate.of(2026, 4, 8)).build(),
                Prepayment.builder().loan(loan).amount(790_318.0).prepaymentDate(LocalDate.of(2026, 7, 3)).build(),
                Prepayment.builder().loan(loan).amount(376_112.0).prepaymentDate(LocalDate.of(2026, 7, 20)).build());

        List<AmortizationEntryResponse> schedule = PropertyFinancialCalculator.buildSchedule(loan, payments, prepayments);
        BigDecimal emiPrincipal = PropertyFinancialCalculator.sumPrincipal(schedule);
        BigDecimal prepaid = new BigDecimal("1766430");
        BigDecimal totalPrincipal = emiPrincipal.add(prepaid).setScale(2);

        assertEquals(20, schedule.size());
        assertEquals(0.0, schedule.get(schedule.size() - 1).getBalance());
        assertEquals(new BigDecimal("2022500.00"), totalPrincipal);
        assertTrue(PropertyFinancialCalculator.isClosed(schedule));
    }
}
