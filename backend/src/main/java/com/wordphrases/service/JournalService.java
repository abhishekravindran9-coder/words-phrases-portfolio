package com.wordphrases.service;

import com.wordphrases.dto.request.JournalEntryRequest;
import com.wordphrases.dto.response.JournalEntryResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.JournalEntry;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.JournalEntryRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for journal entries – create, read, update, delete.
 */
@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final WordRepository wordRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> getEntries(Long userId, Pageable pageable) {
        User user = userService.getUserById(userId);
        return journalEntryRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse getEntryById(Long userId, Long entryId) {
        User user = userService.getUserById(userId);
        JournalEntry entry = journalEntryRepository.findByIdAndUser(entryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry", "id", entryId));
        return toResponse(entry);
    }

    @Transactional
    public JournalEntryResponse createEntry(Long userId, JournalEntryRequest request) {
        User user = userService.getUserById(userId);
        List<Word> words = resolveWords(request.getUsedWordIds(), user);

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .mood(request.getMood())
                .usedWords(words)
                .build();

        return toResponse(journalEntryRepository.save(entry));
    }

    @Transactional
    public JournalEntryResponse updateEntry(Long userId, Long entryId, JournalEntryRequest request) {
        User user = userService.getUserById(userId);
        JournalEntry entry = journalEntryRepository.findByIdAndUser(entryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry", "id", entryId));

        entry.setTitle(request.getTitle());
        entry.setContent(request.getContent());
        if (request.getMood() != null) entry.setMood(request.getMood());
        entry.setUsedWords(resolveWords(request.getUsedWordIds(), user));

        return toResponse(journalEntryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(Long userId, Long entryId) {
        User user = userService.getUserById(userId);
        JournalEntry entry = journalEntryRepository.findByIdAndUser(entryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry", "id", entryId));
        journalEntryRepository.delete(entry);
    }

    private List<Word> resolveWords(List<Long> wordIds, User user) {
        if (wordIds == null || wordIds.isEmpty()) return new ArrayList<>();
        return wordIds.stream()
                .map(id -> wordRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new ResourceNotFoundException("Word", "id", id)))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private JournalEntryResponse toResponse(JournalEntry entry) {
        List<JournalEntryResponse.WordSummary> wordSummaries = entry.getUsedWords().stream()
                .map(w -> JournalEntryResponse.WordSummary.builder()
                        .id(w.getId())
                        .word(w.getWord())
                        .definition(w.getDefinition())
                        .build())
                .toList();

        return JournalEntryResponse.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .content(entry.getContent())
                .mood(entry.getMood())
                .usedWords(wordSummaries)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
