package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class PrepaymentSimulationResponse {
    // ── Current loan state (before simulated prepayments) ──────────────────────
    private int    monthsElapsed;
    private Double interestAlreadyPaid;
    private Double principalAlreadyPaid;
    private Double currentOutstanding;

    // ── Simulation inputs summary ──────────────────────────────────────────────
    private Double totalPrepaymentAmount;
    /** Outstanding balance right after the last simulated prepayment is applied. */
    private Double principalAfterPrepayments;

    // ── Original schedule ──────────────────────────────────────────────────────
    private Double    originalEmi;
    private int       originalTenureMonths;
    private int       originalMonthsRemaining;
    private LocalDate originalClosureDate;
    private Double    originalTotalInterest;
    private Double    originalTotalOutflow;

    // ── New schedule (with simulated prepayments) ──────────────────────────────
    private Double    newEmi;
    private int       newTenureMonths;
    private int       newMonthsRemaining;
    private LocalDate newClosureDate;
    private Double    newTotalInterest;
    private Double    newTotalOutflow;

    // ── Savings ────────────────────────────────────────────────────────────────
    private Double interestSaved;
    private int    monthsSaved;
    /** For REDUCE_EMI: how much less you pay each month after all prepayments. */
    private Double monthlyEmiSaving;
}
