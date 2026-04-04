package com.wordphrases;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Words & Phrases Portfolio application.
 * Enables component scanning, auto-configuration, and scheduling support.
 */
@SpringBootApplication
@EnableScheduling
public class WordPhrasesApplication {

    public static void main(String[] args) {
        SpringApplication.run(WordPhrasesApplication.class, args);
    }
}
