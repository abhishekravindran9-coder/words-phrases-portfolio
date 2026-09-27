package com.wordphrases.repository;

import com.wordphrases.model.Category;
import com.wordphrases.model.JournalEntry;
import com.wordphrases.model.Review;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class DashboardInsightRepositoryTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private WordRepository wordRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private JournalEntryRepository journalEntryRepository;

    @Test
    void aggregatesNearDueWordsWeakCategoriesAndJournalPractice() {
        User user = userRepository.saveAndFlush(User.builder()
                .username("insight-test")
                .email("insight-test@example.com")
                .passwordHash("not-used-in-this-test")
                .displayName("Insight Test")
                .build());
        Category category = categoryRepository.saveAndFlush(Category.builder()
                .user(user)
                .name("Listening")
                .color("#4f46e5")
                .build());
        LocalDate today = LocalDate.now();
        Word dueSoon = wordRepository.saveAndFlush(Word.builder()
                .user(user)
                .category(category)
                .word("resonant")
                .definition("Rich and evocative")
                .easeFactor(1.5)
                .repetitions(2)
                .intervalDays(2)
                .nextReviewDate(today.plusDays(2))
                .build());
        Word dueNow = wordRepository.saveAndFlush(Word.builder()
                .user(user)
                .category(category)
                .word("sonorous")
                .definition("Full and deep in sound")
                .easeFactor(2.0)
                .nextReviewDate(today)
                .build());

        reviewRepository.saveAllAndFlush(java.util.List.of(
                Review.builder().user(user).word(dueSoon).reviewDate(today.minusDays(1)).quality(2).build(),
                Review.builder().user(user).word(dueSoon).reviewDate(today).quality(4).build(),
                Review.builder().user(user).word(dueNow).reviewDate(today).quality(5).build()
        ));

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .title("A listening note")
                .content("A resonant sound stayed with me.")
                .createdAt(LocalDateTime.now())
                .usedWords(new ArrayList<>(java.util.List.of(dueSoon)))
                .build();
        journalEntryRepository.saveAndFlush(entry);

        var atRisk = wordRepository.findApproachingDueWords(user, today, today.plusDays(3), PageRequest.of(0, 5));
        assertThat(atRisk).extracting(Word::getWord).containsExactly("resonant");
        assertThat(wordRepository.countApproachingDueWords(user, today, today.plusDays(3))).isEqualTo(1);
        assertThat(wordRepository.findRandomPracticeWords(user.getId(), 1)).hasSize(1);

        var weakCategory = reviewRepository.findWeakestCategoryRecall(user, today.minusDays(29), today, 3);
        assertThat(weakCategory).hasSize(1);
        assertThat(weakCategory.get(0)[0]).isEqualTo("Listening");
        assertThat(((Number) weakCategory.get(0)[2]).longValue()).isEqualTo(3);
        assertThat(((Number) weakCategory.get(0)[4]).longValue()).isEqualTo(1);

        assertThat(journalEntryRepository.countByUserAndCreatedAtGreaterThanEqual(user, today.minusDays(6).atStartOfDay())).isEqualTo(1);
        assertThat(journalEntryRepository.countDistinctWordsPracticedInJournal(user, today.minusDays(6).atStartOfDay())).isEqualTo(1);
        assertThat(reviewRepository.countByUserAndReviewDateBetween(user, today.minusDays(6), today)).isEqualTo(3);
        assertThat(reviewRepository.countSuccessfulReviews(user, today.minusDays(29), today)).isEqualTo(2);
    }
}
