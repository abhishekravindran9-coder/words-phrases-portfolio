package com.wordphrases.service;

import com.wordphrases.dto.request.PracticeAnswerRequest;
import com.wordphrases.dto.request.ReviewResultRequest;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.WordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PracticeServiceTest {

    @Mock private UserService userService;
    @Mock private WordRepository wordRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private ReviewService reviewService;

    private PracticeService practiceService;
    private User user;
    private Word word;

    @BeforeEach
    void setUp() {
        practiceService = new PracticeService(userService, wordRepository, reviewRepository, reviewService);
        user = User.builder().id(23L).build();
        word = Word.builder().id(51L).user(user).build();
        when(userService.getUserById(23L)).thenReturn(user);
        when(wordRepository.findByIdAndUser(51L, user)).thenReturn(Optional.of(word));
    }

    @Test
    void objectiveCorrectnessMapsToSharedSrsGrades() {
        submit("MULTIPLE_CHOICE", false, null, null);
        assertSubmittedQuality(1);

        submit("MULTIPLE_CHOICE", true, null, null);
        assertSubmittedQuality(3);

        submit("FILL_BLANK_SENTENCE", true, null, null);
        assertSubmittedQuality(3);

        submit("FILL_BLANK_WORD", true, 4L, null);
        assertSubmittedQuality(5);

        submit("FILL_BLANK_WORD", true, 12L, null);
        assertSubmittedQuality(3);
    }

    @Test
    void recallCardsKeepTheLearnersSelfGrade() {
        submit("RECALL", true, 8L, 5);
        assertSubmittedQuality(5);
        submit("RECALL", false, 9L, 1);
        assertSubmittedQuality(1);
    }

    private void submit(String format, boolean correct, Long seconds, Integer quality) {
        PracticeAnswerRequest answer = new PracticeAnswerRequest();
        answer.setWordId(51L);
        answer.setFormat(format);
        answer.setCorrect(correct);
        answer.setTimeTakenSeconds(seconds);
        answer.setQuality(quality);
        practiceService.submitAnswer(23L, answer);
    }

    private void assertSubmittedQuality(int expected) {
        ArgumentCaptor<ReviewResultRequest> captor = ArgumentCaptor.forClass(ReviewResultRequest.class);
        verify(reviewService).submitReview(org.mockito.ArgumentMatchers.eq(23L), captor.capture());
        assertThat(captor.getValue().getWordId()).isEqualTo(51L);
        assertThat(captor.getValue().getQuality()).isEqualTo(expected);
        clearInvocations(reviewService);
    }
}
