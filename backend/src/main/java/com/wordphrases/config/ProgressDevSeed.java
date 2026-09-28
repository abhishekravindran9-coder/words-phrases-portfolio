package com.wordphrases.config;

import com.wordphrases.model.Review;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.ReviewRepository;
import com.wordphrases.repository.UserRepository;
import com.wordphrases.repository.WordRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/** Opt-in local fixture data for exercising the Progress dashboard. */
@Component
@Profile("dev")
public class ProgressDevSeed implements CommandLineRunner {
    private final UserRepository userRepository;
    private final WordRepository wordRepository;
    private final ReviewRepository reviewRepository;
    private final boolean enabled;

    public ProgressDevSeed(UserRepository userRepository,
                           WordRepository wordRepository,
                           ReviewRepository reviewRepository,
                           @Value("${app.progress.seed.enabled:false}") boolean enabled) {
        this.userRepository = userRepository;
        this.wordRepository = wordRepository;
        this.reviewRepository = reviewRepository;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        for (User user : userRepository.findAll()) seedUser(user);
    }

    private void seedUser(User user) {
        if (reviewRepository.countByUser(user) >= 60) return;
        List<Word> words = wordRepository.findByUserOrderByCreatedAtDesc(user, org.springframework.data.domain.PageRequest.of(0, 24)).getContent();
        if (words.isEmpty()) return;

        ZoneId zone = ZoneId.of(user.getTimezone() == null ? "UTC" : user.getTimezone());
        LocalDate today = LocalDate.now(zone);
        List<Review> reviews = new ArrayList<>();
        for (int offset = 89; offset >= 0; offset--) {
            LocalDate date = today.minusDays(offset);
            int count = 1 + (int) ((offset * 7L + user.getId()) % 3);
            for (int index = 0; index < count; index++) {
                Word word = words.get((offset + index) % words.size());
                int quality = ((offset + index * 3) % 7 == 0) ? 1 : ((offset + index) % 5 == 0 ? 3 : 5);
                Instant reviewedAt = date.atTime(8 + (index * 4), 15).atZone(zone).toInstant();
                reviews.add(Review.builder()
                        .user(user)
                        .word(word)
                        .reviewDate(date)
                        .reviewedAt(reviewedAt)
                        .timezoneId(zone.getId())
                        .questionFormat(index % 2 == 0 ? "RECALL" : "FILL_BLANK_WORD")
                        .quality(quality)
                        .timeTakenSeconds((long) (3 + index * 4))
                        .intervalBeforeDays(Math.min(30, 1 + (offset % 24)))
                        .intervalAfterDays(Math.min(45, 2 + (offset % 30)))
                        .build());
            }
        }
        reviewRepository.saveAll(reviews);
    }
}