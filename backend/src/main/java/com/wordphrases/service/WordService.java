package com.wordphrases.service;

import com.wordphrases.dto.request.WordRequest;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.dto.response.WordStatsResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.Category;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.CategoryRepository;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
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
    public Page<WordResponse> getWordsForUser(
            Long userId, String query, String entryType,
            Long categoryId, Boolean mastered, Boolean dueOnly, LocalDate scheduledDate,
            String requestedStage, Pageable pageable) {
        User user = userService.getUserById(userId);
        String q    = (query     != null && !query.isBlank())     ? query.trim().toLowerCase() : null;
        String type = (entryType != null && !entryType.isBlank()) ? entryType.toUpperCase()    : null;
        String stage = requestedStage != null && java.util.Set.of("NEW", "LEARNING", "YOUNG", "MATURE", "MASTERED")
                .contains(requestedStage.trim().toUpperCase()) ? requestedStage.trim().toUpperCase() : null;
        LocalDate today = LearningPolicy.today(LearningPolicy.zone(user.getTimezone()));
        Page<Word> page;
        if (q != null) {
            page = wordRepository.findWithFiltersAndSearch(user, q, type, categoryId, mastered, dueOnly, scheduledDate, today, stage, pageable);
        } else {
            page = wordRepository.findWithFilters(user, type, categoryId, mastered, dueOnly, scheduledDate, today, stage, pageable);
        }
        return page.map(this::toWordResponse);
    }

    @Transactional(readOnly = true)
    public WordStatsResponse getStatsForUser(Long userId) {
        User user = userService.getUserById(userId);
        return WordStatsResponse.builder()
                .total(wordRepository.countByUser(user))
                .mastered(wordRepository.countByUserAndMastered(user, true))
                .words(wordRepository.countByUserAndEntryType(user, "WORD"))
                .phrases(wordRepository.countByUserAndEntryType(user, "PHRASE"))
                .dueToday(wordRepository.countDueForReview(user, LearningPolicy.today(LearningPolicy.zone(user.getTimezone()))))
                .build();
    }

    @Transactional(readOnly = true)
    public WordResponse getWordById(Long userId, Long wordId) {
        User user = userService.getUserById(userId);
        Word word = wordRepository.findByIdAndUser(wordId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Word", "id", wordId));
        return toWordResponse(word);
    }

    @Transactional(readOnly = true)
    public java.util.List<WordResponse> findDuplicates(Long userId, String word, String entryType, Long excludeId) {
        if (word == null || word.isBlank()) return java.util.List.of();
        User user = userService.getUserById(userId);
        String type = entryType == null || entryType.isBlank() ? null : entryType.toUpperCase();
        return wordRepository.findDuplicates(user, word.trim(), type, excludeId).stream()
                .map(this::toWordResponse).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = {"progressInsights", "today"}, allEntries = true)
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
                .difficultyTier(normalizeDifficulty(request.getDifficultyTier()))
                .pronunciation(request.getPronunciation())
                .partOfSpeech(request.getPartOfSpeech())
                .etymology(request.getEtymology())
                .mnemonic(request.getMnemonic())
                .usageNote(request.getUsageNote())
                .synonyms(request.getSynonyms())
                .antonyms(request.getAntonyms())
                .sourceContext(request.getSourceContext())
                .userExample(request.getUserExample())
                .userMnemonic(request.getUserMnemonic())
                .nextReviewDate(LearningPolicy.today(LearningPolicy.zone(user.getTimezone())))
                .build();

        return toWordResponse(wordRepository.save(word));
    }

    @Transactional
    @CacheEvict(cacheNames = {"progressInsights", "today"}, allEntries = true)
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
        if (request.getDifficultyTier() != null) word.setDifficultyTier(normalizeDifficulty(request.getDifficultyTier()));
        word.setPronunciation(request.getPronunciation());
        word.setPartOfSpeech(request.getPartOfSpeech());
        word.setEtymology(request.getEtymology());
        word.setMnemonic(request.getMnemonic());
        word.setUsageNote(request.getUsageNote());
        word.setSynonyms(request.getSynonyms());
        word.setAntonyms(request.getAntonyms());
        word.setSourceContext(request.getSourceContext());
        word.setUserExample(request.getUserExample());
        word.setUserMnemonic(request.getUserMnemonic());
        word.setCategory(resolveCategory(request.getCategoryId(), user));

        return toWordResponse(wordRepository.save(word));
    }

    @Transactional
    @CacheEvict(cacheNames = {"progressInsights", "today"}, allEntries = true)
    public void deleteWord(Long userId, Long wordId) {
        User user = userService.getUserById(userId);
        Word word = wordRepository.findByIdAndUser(wordId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Word", "id", wordId));
        word.setDeletedAt(java.time.Instant.now());
        word.setDeletedBy(userId);
        wordRepository.save(word);
    }

    @Transactional
    @CacheEvict(cacheNames = {"progressInsights", "today"}, allEntries = true)
    public void restoreWord(Long userId, Long wordId) {
        wordRepository.restoreByIdAndUser(wordId, userId);
    }

    /** Resolves an optional category ID to a Category entity, or null. */
    private Category resolveCategory(Long categoryId, User user) {
        if (categoryId == null) return null;
        return categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return null;
        String normalized = difficulty.trim().toUpperCase().replace(' ', '_');
        return java.util.Set.of("EASY", "MEDIUM", "HARD", "SUPER_HARD").contains(normalized) ? normalized : null;
    }

    public WordResponse toWordResponse(Word word) {
        long totalReviews = reviewRepository.countByWord(word);
        return WordResponse.builder()
                .id(word.getId())
                .word(word.getWord())
                .entryType(word.getEntryType() != null ? word.getEntryType() : "WORD")
                .definition(word.getDefinition())
                .exampleSentence(word.getExampleSentence())
                .imageUrl(word.getImageUrl())
                .audioUrl(word.getAudioUrl())
                .notes(word.getNotes())
                .difficultyTier(word.getDifficultyTier())
                .lapseCount(word.getLapseCount())
                .pronunciation(word.getPronunciation())
                .partOfSpeech(word.getPartOfSpeech())
                .etymology(word.getEtymology())
                .mnemonic(word.getMnemonic())
                .usageNote(word.getUsageNote())
                .synonyms(word.getSynonyms())
                .antonyms(word.getAntonyms())
                .sourceContext(word.getSourceContext())
                .userExample(word.getUserExample())
                .userMnemonic(word.getUserMnemonic())
                .aiEnrichmentStatus(word.getAiEnrichmentStatus())
                .categoryId(word.getCategory() != null ? word.getCategory().getId() : null)
                .categoryName(word.getCategory() != null ? word.getCategory().getName() : null)
                .categoryColor(word.getCategory() != null ? word.getCategory().getColor() : null)
                .easeFactor(word.getEaseFactor())
                .intervalDays(word.getIntervalDays())
                .repetitions(word.getRepetitions())
                .nextReviewDate(word.getNextReviewDate())
                .localToday(LearningPolicy.today(LearningPolicy.zone(word.getUser().getTimezone())))
                .mastered(word.getMastered())
                .createdAt(word.getCreatedAt())
                .updatedAt(word.getUpdatedAt())
                .totalReviews((int) word.getReviews().size())
                .build();
    }
}
