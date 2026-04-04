package com.wordphrases.service;

import com.wordphrases.dto.request.WordRequest;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.Category;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.CategoryRepository;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Business logic for vocabulary words and phrases (CRUD + search).
 */
@Service
@RequiredArgsConstructor
public class WordService {

    private final WordRepository wordRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<WordResponse> getWordsForUser(Long userId, String query, String entryType, Pageable pageable) {
        User user = userService.getUserById(userId);
        boolean hasQuery = query != null && !query.isBlank();
        boolean hasType  = entryType != null && !entryType.isBlank();
        Page<Word> page;
        if (hasQuery && hasType) {
            page = wordRepository.searchByUserAndEntryType(user, query.trim(), entryType.toUpperCase(), pageable);
        } else if (hasQuery) {
            page = wordRepository.searchByUser(user, query.trim(), pageable);
        } else if (hasType) {
            page = wordRepository.findByUserAndEntryTypeOrderByCreatedAtDesc(user, entryType.toUpperCase(), pageable);
        } else {
            page = wordRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        }
        return page.map(this::toWordResponse);
    }

    @Transactional(readOnly = true)
    public WordResponse getWordById(Long userId, Long wordId) {
        User user = userService.getUserById(userId);
        Word word = wordRepository.findByIdAndUser(wordId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Word", "id", wordId));
        return toWordResponse(word);
    }

    @Transactional
    public WordResponse createWord(Long userId, WordRequest request) {
        User user = userService.getUserById(userId);
        Category category = resolveCategory(request.getCategoryId(), user);

        Word word = Word.builder()
                .user(user)
                .category(category)
                .word(request.getWord())
                .entryType(request.getEntryType() != null ? request.getEntryType() : "WORD")
                .definition(request.getDefinition())
                .exampleSentence(request.getExampleSentence())
                .imageUrl(request.getImageUrl())
                .audioUrl(request.getAudioUrl())
                .notes(request.getNotes())
                .nextReviewDate(LocalDate.now())
                .build();

        return toWordResponse(wordRepository.save(word));
    }

    @Transactional
    public WordResponse updateWord(Long userId, Long wordId, WordRequest request) {
        User user = userService.getUserById(userId);
        Word word = wordRepository.findByIdAndUser(wordId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Word", "id", wordId));

        word.setWord(request.getWord());
        if (request.getEntryType() != null) word.setEntryType(request.getEntryType());
        if (request.getDefinition() != null) word.setDefinition(request.getDefinition());
        if (request.getExampleSentence() != null) word.setExampleSentence(request.getExampleSentence());
        if (request.getImageUrl() != null) word.setImageUrl(request.getImageUrl());
        if (request.getAudioUrl() != null) word.setAudioUrl(request.getAudioUrl());
        if (request.getNotes() != null) word.setNotes(request.getNotes());
        word.setCategory(resolveCategory(request.getCategoryId(), user));

        return toWordResponse(wordRepository.save(word));
    }

    @Transactional
    public void deleteWord(Long userId, Long wordId) {
        User user = userService.getUserById(userId);
        Word word = wordRepository.findByIdAndUser(wordId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Word", "id", wordId));
        wordRepository.delete(word);
    }

    /** Resolves an optional category ID to a Category entity, or null. */
    private Category resolveCategory(Long categoryId, User user) {
        if (categoryId == null) return null;
        return categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
    }

    public WordResponse toWordResponse(Word word) {
        long totalReviews = reviewRepository.countByUser(word.getUser());
        return WordResponse.builder()
                .id(word.getId())
                .word(word.getWord())
                .entryType(word.getEntryType() != null ? word.getEntryType() : "WORD")
                .definition(word.getDefinition())
                .exampleSentence(word.getExampleSentence())
                .imageUrl(word.getImageUrl())
                .audioUrl(word.getAudioUrl())
                .notes(word.getNotes())
                .categoryId(word.getCategory() != null ? word.getCategory().getId() : null)
                .categoryName(word.getCategory() != null ? word.getCategory().getName() : null)
                .categoryColor(word.getCategory() != null ? word.getCategory().getColor() : null)
                .easeFactor(word.getEaseFactor())
                .intervalDays(word.getIntervalDays())
                .repetitions(word.getRepetitions())
                .nextReviewDate(word.getNextReviewDate())
                .mastered(word.getMastered())
                .createdAt(word.getCreatedAt())
                .updatedAt(word.getUpdatedAt())
                .totalReviews((int) word.getReviews().size())
                .build();
    }
}
