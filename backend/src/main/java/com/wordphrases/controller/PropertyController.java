package com.wordphrases.controller;

import com.wordphrases.dto.request.BuilderInstallmentRequest;
import com.wordphrases.dto.request.MarkInstallmentPaidRequest;
import com.wordphrases.dto.request.PropertyRequest;
import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.BuilderInstallmentResponse;
import com.wordphrases.dto.response.PropertyResponse;
import com.wordphrases.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController extends BaseController {

    private final PropertyService propertyService;

    // ─── Properties ───────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<PropertyResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getAll(getCurrentUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PropertyResponse>> create(@RequestBody PropertyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.create(getCurrentUserId(), req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getById(getCurrentUserId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> update(@PathVariable Long id,
                                                                @RequestBody PropertyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.update(getCurrentUserId(), id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        propertyService.delete(getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Property deleted", null));
    }

    // ─── Builder Installments ─────────────────────────────────────────────────────

    @GetMapping("/{id}/installments")
    public ResponseEntity<ApiResponse<List<BuilderInstallmentResponse>>> listInstallments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getInstallments(getCurrentUserId(), id)));
    }

    @PostMapping("/{id}/installments")
    public ResponseEntity<ApiResponse<BuilderInstallmentResponse>> addInstallment(
            @PathVariable Long id, @RequestBody BuilderInstallmentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.addInstallment(getCurrentUserId(), id, req)));
    }

    @PutMapping("/{id}/installments/{instId}")
    public ResponseEntity<ApiResponse<BuilderInstallmentResponse>> updateInstallment(
            @PathVariable Long id, @PathVariable Long instId,
            @RequestBody BuilderInstallmentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                propertyService.updateInstallment(getCurrentUserId(), id, instId, req)));
    }

    @PostMapping("/{id}/installments/{instId}/mark-paid")
    public ResponseEntity<ApiResponse<BuilderInstallmentResponse>> markInstallmentPaid(
            @PathVariable Long id, @PathVariable Long instId,
            @RequestBody MarkInstallmentPaidRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                propertyService.markInstallmentPaid(getCurrentUserId(), id, instId, req)));
    }

    @DeleteMapping("/{id}/installments/{instId}")
    public ResponseEntity<ApiResponse<Void>> deleteInstallment(
            @PathVariable Long id, @PathVariable Long instId) {
        propertyService.deleteInstallment(getCurrentUserId(), id, instId);
        return ResponseEntity.ok(ApiResponse.ok("Installment deleted", null));
    }
}
