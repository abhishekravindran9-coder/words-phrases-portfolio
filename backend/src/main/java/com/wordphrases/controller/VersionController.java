package com.wordphrases.controller;

import org.springframework.boot.info.BuildProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Public endpoint returning the deployed version and build timestamp.
 * Does not require authentication. Useful for verifying deployments.
 */
@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final BuildProperties buildProperties;

    public VersionController(Optional<BuildProperties> buildProperties) {
        this.buildProperties = buildProperties.orElse(null);
    }

    @GetMapping
    public Map<String, String> version() {
        Map<String, String> info = new LinkedHashMap<>();
        if (buildProperties != null) {
            info.put("version", buildProperties.getVersion());
            info.put("buildTime", buildProperties.getTime().toString());
        } else {
            info.put("version", "dev");
            info.put("buildTime", null);
        }
        return info;
    }
}
