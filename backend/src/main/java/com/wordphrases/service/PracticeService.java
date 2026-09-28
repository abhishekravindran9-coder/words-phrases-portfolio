package com.wordphrases.service;

import com.wordphrases.dto.request.PracticeAnswerRequest;
import com.wordphrases.dto.request.ReviewResultRequest;
import com.wordphrases.dto.response.PracticeOverviewResponse;
import com.wordphrases.dto.response.PracticeQueueResponse;
import com.wordphrases.dto.response.ReviewResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.UserRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PracticeService {

    private static final int MAX_CUSTOM_SIZE = 20;

    private final UserService userService;
    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;

    @Transactional(readOnly = true)
    public PracticeOverviewResponse getOverview(Long userId) {
        User user = userService.getUserById(userId);
        LocalDate today = LearningPolicy.today(resolveZone(user));
        long totalReviews = reviewRepository.countByUser(user);
        long successfulReviews = reviewRepository.countByUserAndQualityGreaterThanEqual(user, 3);
        int recallRate = totalReviews > 0
                ? (int) Math.round(successfulReviews * 100.0 / totalReviews)
                : 0;
        return PracticeOverviewResponse.builder()
                .totalCards(wordRepository.countByUser(user))
                .masteredCards(wordRepository.countByUserAndMastered(user, true))
                .dueCards(wordRepository.countDueForReview(user, today))
                .totalReviews(totalReviews)
                .successfulReviews(successfulReviews)
                .recallRate(recallRate)
                .currentStreakDays(LearningPolicy.currentStreak(reviewRepository.findDistinctReviewDatesByUser(user), today))
                .build();
    }

    @Transactional(readOnly = true)
    public PracticeQueueResponse getQueue(Long userId, String requestedMode, int requestedSize) {
        User user = userService.getUserById(userId);
        LocalDate today = LearningPolicy.today(resolveZone(user));
        String mode = requestedMode == null ? "DUE" : requestedMode.trim().toUpperCase();
        if (!mode.equals("DUE") && !mode.equals("CUSTOM") && !mode.equals("LEECHES")) {
            throw new IllegalArgumentException("Practice mode must be DUE, CUSTOM, or LEECHES");
        }

        int size = Math.max(1, Math.min(requestedSize, MAX_CUSTOM_SIZE));
        List<Word> selected;
        int availableCount;
        if (mode.equals("DUE")) {
            List<Word> due = wordRepository.findDueForReview(user, today);
            availableCount = due.size();
            selected = due;
        } else if (mode.equals("CUSTOM")) {
            availableCount = Math.toIntExact(Math.min(
                    wordRepository.countByUser(user), Integer.MAX_VALUE));
            selected = wordRepository.findRandomPracticeWords(userId, size);
        } else {
            List<Object[]> leechRows = wordRepository.findLeeches(
                user, LearningPolicy.today(resolveZone(user)).minusDays(89), LearningPolicy.today(resolveZone(user)),
                2, 2.5, PageRequest.of(0, size));
            selected = leechRows.stream().map(row -> (Word) row[0]).toList();
            availableCount = selected.size();
        }

        return PracticeQueueResponse.builder()
                .mode(mode)
                .requestedSize(mode.equals("DUE") ? selected.size() : Math.min(size, availableCount))
                .availableCount(availableCount)
                .words(selected.stream().map(this::toPracticeWord).toList())
                .build();
    }

    @Transactional
    public ReviewResponse submitAnswer(Long userId, PracticeAnswerRequest answer) {
        String format = answer.getFormat().trim().toUpperCase();
        int quality;
        if (format.equals("RECALL")) {
            if (!List.of(1, 3, 5).contains(answer.getQuality())) {
                throw new IllegalArgumentException("Recall grade must be Again (1), Good (3), or Easy (5)");
            }
            quality = answer.getQuality();
        } else {
            if (!List.of("MULTIPLE_CHOICE", "FILL_BLANK_WORD", "FILL_BLANK_SENTENCE").contains(format)
                    || answer.getCorrect() == null) {
                throw new IllegalArgumentException("Unsupported Practice answer format");
            }
            if (!answer.getCorrect()) quality = 1;
            else if (format.equals("FILL_BLANK_WORD")
                    && answer.getTimeTakenSeconds() != null
                    && answer.getTimeTakenSeconds() <= 5) quality = 5;
            else quality = 3;
        }
        User user = userService.getUserById(userId);
        if (wordRepository.findByIdAndUser(answer.getWordId(), user).isEmpty()) {
            throw new ResourceNotFoundException("Word", "id", answer.getWordId());
        }

        ReviewResultRequest review = new ReviewResultRequest();
        review.setWordId(answer.getWordId());
        review.setQuality(quality);
        review.setTimeTakenSeconds(answer.getTimeTakenSeconds());
        review.setQuestionFormat(format);
        review.setTimezoneId(answer.getTimezoneId());
        return reviewService.submitReview(userId, review);
    }

    private WordResponse toPracticeWord(Word word) {
        return WordResponse.builder()
                .id(word.getId())
                .word(word.getWord())
                .entryType(word.getEntryType())
                .definition(word.getDefinition())
                .exampleSentence(word.getExampleSentence())
                .imageUrl(word.getImageUrl())
                .audioUrl(word.getAudioUrl())
                .notes(word.getNotes())
                .difficultyTier(word.getDifficultyTier())
                .lapseCount(word.getLapseCount())
                .categoryId(word.getCategory() != null ? word.getCategory().getId() : null)
                .categoryName(word.getCategory() != null ? word.getCategory().getName() : null)
                .categoryColor(word.getCategory() != null ? word.getCategory().getColor() : null)
                .easeFactor(word.getEaseFactor())
                .intervalDays(word.getIntervalDays())
                .repetitions(word.getRepetitions())
                .nextReviewDate(word.getNextReviewDate())
                .localToday(LearningPolicy.today(resolveZone(word.getUser())))
                .mastered(word.getMastered())
                .createdAt(word.getCreatedAt())
                .updatedAt(word.getUpdatedAt())
                .build();
    }

    private ZoneId resolveZone(User user) {
        return LearningPolicy.zone(user.getTimezone());
    }
}
