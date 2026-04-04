package com.wordphrases.service;

import com.wordphrases.dto.request.ReviewResultRequest;
import com.wordphrases.dto.response.ReviewResponse;
import com.wordphrases.dto.response.WordResponse;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.Review;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Manages the daily review session using the SM-2 spaced-repetition algorithm.
 *
 * <h3>SM-2 Algorithm summary</h3>
 * <pre>
 *  If quality &lt; 3:   reset repetitions and interval to 1 (re-learn the card)
 *  Else:
 *    repetitions = 0 → interval = 1
 *    repetitions = 1 → interval = 6
 *    repetitions &gt; 1 → interval = round(previous_interval × EF)
 *
 *  EF (Ease Factor) update:
 *    EF' = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
 *    EF' = max(1.3, EF')
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final double MIN_EASE_FACTOR = 1.3;
    private static final int MASTERY_REPETITION_THRESHOLD = 5;

    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final UserService userService;
    private final WordService wordService;

    /** Returns all words due for review today (or overdue) for the given user. */
    @Transactional(readOnly = true)
    public List<WordResponse> getDueWords(Long userId) {
        User user = userService.getUserById(userId);
        return wordRepository.findDueForReview(user, LocalDate.now())
                .stream()
                .map(wordService::toWordResponse)
                .toList();
    }

    /**
     * Processes a review result, updates SM-2 scheduling fields on the word,
     * and persists the review event.
     */
    @Transactional
    public ReviewResponse submitReview(Long userId, ReviewResultRequest request) {
        User user = userService.getUserById(userId);
        Word word = wordRepository.findByIdAndUser(request.getWordId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Word", "id", request.getWordId()));

        applySM2(word, request.getQuality());

        word = wordRepository.save(word);

        Review review = Review.builder()
                .word(word)
                .user(user)
                .reviewDate(LocalDate.now())
                .quality(request.getQuality())
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .build();

        review = reviewRepository.save(review);

        return ReviewResponse.builder()
                .reviewId(review.getId())
                .wordId(word.getId())
                .word(word.getWord())
                .quality(review.getQuality())
                .reviewDate(review.getReviewDate())
                .timeTakenSeconds(review.getTimeTakenSeconds())
                .newEaseFactor(word.getEaseFactor())
                .newIntervalDays(word.getIntervalDays())
                .newRepetitions(word.getRepetitions())
                .nextReviewDate(word.getNextReviewDate())
                .mastered(word.getMastered())
                .createdAt(review.getCreatedAt())
                .build();
    }

    /**
     * Updates a word's SM-2 scheduling fields based on the quality of the latest recall.
     *
     * @param word    the vocabulary word to update
     * @param quality SM-2 quality rating (0–5)
     */
    private void applySM2(Word word, int quality) {
        if (quality < 3) {
            // Failed recall – reset to re-learn
            word.setRepetitions(0);
            word.setIntervalDays(1);
        } else {
            // Successful recall – advance the schedule
            int reps = word.getRepetitions();
            if (reps == 0) {
                word.setIntervalDays(1);
            } else if (reps == 1) {
                word.setIntervalDays(6);
            } else {
                word.setIntervalDays((int) Math.round(word.getIntervalDays() * word.getEaseFactor()));
            }
            word.setRepetitions(reps + 1);
        }

        // EF update
        double ef = word.getEaseFactor()
                + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        word.setEaseFactor(Math.max(MIN_EASE_FACTOR, ef));

        word.setNextReviewDate(LocalDate.now().plusDays(word.getIntervalDays()));
        word.setMastered(word.getRepetitions() >= MASTERY_REPETITION_THRESHOLD);
    }
}
