package com.wordphrases.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wordphrases.dto.response.EnrichResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Enriches vocabulary entries (both words and phrases) using Gemini.
 * A dedicated prompt is used for each type to get the most relevant output.
 */
@Service
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.url}")
    private String geminiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(55_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Asks Gemini to define a single English word, including part of speech and examples.
     */
    public EnrichResponse enrichWord(String word) {
        String prompt = """
                You are an expert vocabulary tutor. For the English word: "%s"
                Return ONLY a valid JSON object (no markdown, no extra text) with:
                {
                  "definition": "<detailed definition including etymology, nuance, and usage context>",
                  "partOfSpeech": "<noun|verb|adjective|adverb|etc>",
                  "examples": ["<example sentence 1>", "<example sentence 2>", "<example sentence 3>", "<example sentence 4>"],
                  "notes": "<detailed explanation in simple layman terms — how to remember it, common confusions to avoid, memorable analogy or mnemonic, and when to use it in everyday speech>"
                }
                """.formatted(word);
        return callGemini(prompt, "word '" + word + "'");
    }

    /**
     * Asks Gemini to define the given phrase and produce 2-3 example sentences.
     */
    public EnrichResponse enrichPhrase(String phrase) {
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            throw new IllegalStateException("Gemini API key is not configured. Add app.gemini.api-key to application.properties.");
        }

        String prompt = """
                You are an expert vocabulary tutor. For the phrase: "%s"
                Return ONLY a valid JSON object (no markdown, no extra text) with:
                {
                  "definition": "<detailed meaning of the phrase including origin, context, and when it is used>",
                  "examples": ["<example sentence 1>", "<example sentence 2>", "<example sentence 3>", "<example sentence 4>"],
                  "notes": "<detailed explanation in simple layman terms — the story or origin behind the phrase, a memorable analogy, common misuse to avoid, and how to use it naturally in conversation>"
                }
                """.formatted(phrase);
        return callGemini(prompt, "phrase '" + phrase + "'");
    }

    private EnrichResponse callGemini(String prompt, String label) {
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            throw new IllegalStateException("Gemini API key is not configured. Add app.gemini.api-key to application.properties.");
        }

        String requestBody;
        try {
            requestBody = """
                    {
                      "contents": [{"parts": [{"text": %s}]}],
                      "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024}
                    }
                    """.formatted(objectMapper.valueToTree(prompt).toString());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Gemini request");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    geminiUrl + "?key=" + apiKey, HttpMethod.POST, entity, String.class);
            return parseGeminiResponse(response.getBody());
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Gemini API HTTP error for {}: {} {}", label, e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new RuntimeException("Gemini rate limit reached. Please wait a moment and try again.");
            }
            throw new RuntimeException("Gemini API error " + e.getStatusCode() + " for " + label);
        } catch (Exception e) {
            log.error("Gemini API call failed for {}: {}", label, e.getMessage());
            throw new RuntimeException("Failed to enrich " + label + " via Gemini: " + e.getMessage());
        }
    }

    private EnrichResponse parseGeminiResponse(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        String text = root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText();

        // Strip optional markdown code fences
        text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

        JsonNode parsed = objectMapper.readTree(text);
        String definition = parsed.path("definition").asText();

        List<String> examples = new ArrayList<>();
        JsonNode examplesNode = parsed.path("examples");
        if (examplesNode.isArray()) {
            examplesNode.forEach(n -> examples.add(n.asText()));
        }

        String partOfSpeech = parsed.path("partOfSpeech").isMissingNode() ? null : parsed.path("partOfSpeech").asText(null);
        String notes = parsed.path("notes").isMissingNode() ? null : parsed.path("notes").asText(null);

        return EnrichResponse.builder()
                .definition(definition)
                .examples(examples)
                .notes(notes)
                .partOfSpeech(partOfSpeech)
                .source("gemini")
                .build();
    }
}
