package com.wordphrases.controller;

import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.DashboardResponse;
import com.wordphrases.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the personalised user dashboard.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController extends BaseController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse dashboard = dashboardService.getDashboard(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
