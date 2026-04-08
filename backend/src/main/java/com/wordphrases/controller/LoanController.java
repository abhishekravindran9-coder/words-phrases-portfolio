package com.wordphrases.controller;

import com.wordphrases.dto.request.LoanRequest;
import com.wordphrases.dto.request.PrepaymentRequest;
import com.wordphrases.dto.response.*;
import com.wordphrases.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/properties/{propertyId}/loan")
@RequiredArgsConstructor
public class LoanController extends BaseController {

    private final LoanService loanService;

    @GetMapping
    public ResponseEntity<ApiResponse<LoanResponse>> getLoan(@PathVariable Long propertyId) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoan(getCurrentUserId(), propertyId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LoanResponse>> saveLoan(@PathVariable Long propertyId,
                                                              @RequestBody LoanRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.saveLoan(getCurrentUserId(), propertyId, req)));
    }

    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<List<AmortizationEntryResponse>>> getSchedule(
            @PathVariable Long propertyId) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getSchedule(getCurrentUserId(), propertyId)));
    }

    @PostMapping("/emi/{month}/mark-paid")
    public ResponseEntity<ApiResponse<Void>> markEmiPaid(@PathVariable Long propertyId,
                                                         @PathVariable int month,
                                                         @RequestParam(required = false) String paidDate) {
        LocalDate date = paidDate != null ? LocalDate.parse(paidDate) : null;
        loanService.markEmiPaid(getCurrentUserId(), propertyId, month, date);
        return ResponseEntity.ok(ApiResponse.ok("EMI #" + month + " marked as paid", null));
    }

    @GetMapping("/prepayments")
    public ResponseEntity<ApiResponse<List<PrepaymentResponse>>> getPrepayments(
            @PathVariable Long propertyId) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getPrepayments(getCurrentUserId(), propertyId)));
    }

    @PostMapping("/prepayments")
    public ResponseEntity<ApiResponse<PrepaymentResponse>> addPrepayment(
            @PathVariable Long propertyId, @RequestBody PrepaymentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.addPrepayment(getCurrentUserId(), propertyId, req)));
    }

    @DeleteMapping("/prepayments/{prepaymentId}")
    public ResponseEntity<ApiResponse<Void>> deletePrepayment(
            @PathVariable Long propertyId, @PathVariable Long prepaymentId) {
        loanService.deletePrepayment(getCurrentUserId(), propertyId, prepaymentId);
        return ResponseEntity.ok(ApiResponse.ok("Prepayment deleted", null));
    }

    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<PrepaymentSimulationResponse>> simulate(
            @PathVariable Long propertyId, @RequestBody List<PrepaymentRequest> reqs) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.simulate(getCurrentUserId(), propertyId, reqs)));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<PropertyInsightsResponse>> insights(@PathVariable Long propertyId) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getInsights(getCurrentUserId(), propertyId)));
    }
}
