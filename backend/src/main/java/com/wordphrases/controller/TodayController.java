package com.wordphrases.controller;

import com.wordphrases.dto.response.ApiResponse;
import com.wordphrases.dto.response.TodayResponse;
import com.wordphrases.service.TodayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/today")
@RequiredArgsConstructor
public class TodayController extends BaseController {
    private final TodayService todayService;

    @GetMapping
    public ResponseEntity<ApiResponse<TodayResponse>> getToday(
            @RequestParam(defaultValue = "MIX") String focus) {
        return ResponseEntity.ok(ApiResponse.ok(todayService.getToday(getCurrentUserId(), focus)));
    }
}
