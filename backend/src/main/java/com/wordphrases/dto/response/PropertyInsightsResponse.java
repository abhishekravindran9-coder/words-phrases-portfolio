package com.wordphrases.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class PropertyInsightsResponse {
    private List<String> alerts;
    private List<String> suggestions;
    private List<UpcomingPayment> upcomingPayments;
    /** Key financial snapshot metrics shown as dashboard cards. */
    private Map<String, String> metrics;
    private ChartData chartData;

    @Data
    @Builder
    public static class UpcomingPayment {
        private String type;       // INSTALLMENT | EMI
        private String label;
        private String dueDate;
        private Double amount;
        private Boolean overdue;
    }

    @Data
    @Builder
    public static class ChartData {
        /** Monthly labels: "Jan-25", "Feb-25", … */
        private List<String> labels;
        /** Outstanding balance after each month. */
        private List<Double> balance;
        /** Principal component of each monthly EMI. */
        private List<Double> principal;
        /** Interest component of each monthly EMI. */
        private List<Double> interest;
        /** Index in the above lists that corresponds to the most recent paid/current month. */
        private int todayIndex;

        /** Aggregated per-year labels for bar chart. */
        private List<String> yearLabels;
        private List<Double> yearlyPrincipal;
        private List<Double> yearlyInterest;

        // Donut: loan cost breakdown
        private Double principalPaid;
        private Double principalRemaining;
        private Double interestPaid;
        private Double interestRemaining;

        // Donut: builder progress (null when no builder installments)
        private Double builderPaid;
        private Double builderRemaining;
    }
}
