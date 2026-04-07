package com.wordphrases.service;

import com.wordphrases.dto.request.QuizAnswerRequest;
import com.wordphrases.dto.request.QuizSessionRequest;
import com.wordphrases.dto.response.QuizStatsResponse;
import com.wordphrases.model.QuizAnswer;
import com.wordphrases.model.QuizSession;
import com.wordphrases.model.User;
import com.wordphrases.model.Word;
import com.wordphrases.repository.QuizAnswerRepository;
import com.wordphrases.repository.QuizSessionRepository;
import com.wordphrases.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizSessionRepository quizSessionRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final WordRepository wordRepository;
    private final UserService userService;

    @Transactional
    public Long saveSession(Long userId, QuizSessionRequest request) {
        User user = userService.getUserById(userId);

        int correctCount = (int) request.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getCorrect()))
                .count();

        QuizSession session = QuizSession.builder()
                .user(user)
                .questionCount(request.getQuestionCount())
                .correctCount(correctCount)
                .totalTimeSeconds(request.getTotalTimeSeconds())
                .completedAt(LocalDateTime.now())
                .build();

        List<QuizAnswer> quizAnswers = new ArrayList<>();
        for (QuizAnswerRequest ar : request.getAnswers()) {
            Optional<Word> wordOpt = wordRepository.findById(ar.getWordId());
            if (wordOpt.isEmpty()) continue;

            quizAnswers.add(QuizAnswer.builder()
                    .quizSession(session)
                    .word(wordOpt.get())
                    .questionType(ar.getQuestionType())
                    .correct(ar.getCorrect())
                    .timeTakenSeconds(ar.getTimeTakenSeconds())
                    .userAnswer(ar.getUserAnswer())
                    .correctAnswer(ar.getCorrectAnswer())
                    .build());
        }
        session.setAnswers(quizAnswers);

        return quizSessionRepository.save(session).getId();
    }

    @Transactional(readOnly = true)
    public QuizStatsResponse getStats(Long userId) {
        User user = userService.getUserById(userId);

        // ── Totals ──────────────────────────────────────────────────────────
        long totalQuizzes    = quizSessionRepository.countByUser(user);
        long totalQuestions  = quizAnswerRepository.countAllByUser(user);
        long totalCorrect    = quizAnswerRepository.countCorrectByUser(user);
        double overallAccuracy = totalQuestions > 0
                ? round1(totalCorrect * 100.0 / totalQuestions) : 0.0;

        List<QuizSession> allSessions = quizSessionRepository.findByUserOrderByCompletedAtDesc(user);

        double bestScore = allSessions.stream()
                .mapToDouble(s -> s.getQuestionCount() > 0
                        ? s.getCorrectCount() * 100.0 / s.getQuestionCount() : 0)
                .max().orElse(0.0);
        bestScore = round1(bestScore);

        double averageScore = allSessions.stream()
                .mapToDouble(s -> s.getQuestionCount() > 0
                        ? s.getCorrectCount() * 100.0 / s.getQuestionCount() : 0)
                .average().orElse(0.0);
        averageScore = round1(averageScore);

        Double avgTime = quizAnswerRepository.findAverageTimePerQuestionForUser(user);

        // ── Accuracy by question type ────────────────────────────────────────
        List<Object[]> typeTotal   = quizAnswerRepository.countByTypeForUser(user);
        List<Object[]> typeCorrect = quizAnswerRepository.countCorrectByTypeForUser(user);

        Map<String, Long> totalByType   = toTypeMap(typeTotal);
        Map<String, Long> correctByType = toTypeMap(typeCorrect);

        Map<String, QuizStatsResponse.TypeAccuracy> accuracyByType = new LinkedHashMap<>();
        totalByType.forEach((type, total) -> {
            long correct = correctByType.getOrDefault(type, 0L);
            accuracyByType.put(type, QuizStatsResponse.TypeAccuracy.builder()
                    .total(total).correct(correct)
                    .accuracy(total > 0 ? round1(correct * 100.0 / total) : 0.0)
                    .build());
        });

        // ── Recent sessions (last 10) ────────────────────────────────────────
        List<QuizStatsResponse.SessionSummary> recentSessions = allSessions.stream()
                .limit(10)
                .map(s -> QuizStatsResponse.SessionSummary.builder()
                        .sessionId(s.getId())
                        .completedAt(s.getCompletedAt())
                        .questionCount(s.getQuestionCount())
                        .correctCount(s.getCorrectCount())
                        .scorePercent(s.getQuestionCount() > 0
                                ? round1(s.getCorrectCount() * 100.0 / s.getQuestionCount()) : 0)
                        .totalTimeSeconds(s.getTotalTimeSeconds() != null ? s.getTotalTimeSeconds() : 0)
                        .build())
                .collect(Collectors.toList());

        // ── Most missed words ────────────────────────────────────────────────
        List<Object[]> missedRows = quizAnswerRepository.findMostMissedWordsForUser(user);
        List<Object[]> allAttemptRows = quizAnswerRepository.countAllByWordForUser(user);
        Map<Long, Long> totalAttemptsByWordId = allAttemptRows.stream()
                .collect(Collectors.toMap(
                        row -> ((Word) row[0]).getId(),
                        row -> ((Number) row[1]).longValue()
                ));

        List<QuizStatsResponse.WeakWordStat> mostMissed = missedRows.stream()
                .limit(10)
                .map(row -> {
                    Word w          = (Word) row[0];
                    long wrongCount = ((Number) row[1]).longValue();
                    long totalAtt   = totalAttemptsByWordId.getOrDefault(w.getId(), wrongCount);
                    return QuizStatsResponse.WeakWordStat.builder()
                            .wordId(w.getId())
                            .word(w.getWord())
                            .wrongCount(wrongCount)
                            .totalAttempts(totalAtt)
                            .accuracy(totalAtt > 0 ? round1((totalAtt - wrongCount) * 100.0 / totalAtt) : 0.0)
                            .build();
                })
                .collect(Collectors.toList());

        // ── Streaks ──────────────────────────────────────────────────────────
        int[] streaks = computePassingStreaks(allSessions);

        // ── Today ────────────────────────────────────────────────────────────
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd   = todayStart.plusDays(1);
        long quizzesToday = allSessions.stream()
                .filter(s -> !s.getCompletedAt().isBefore(todayStart) && s.getCompletedAt().isBefore(todayEnd))
                .count();
        long questionsToday = allSessions.stream()
                .filter(s -> !s.getCompletedAt().isBefore(todayStart) && s.getCompletedAt().isBefore(todayEnd))
                .mapToLong(QuizSession::getQuestionCount)
                .sum();

        return QuizStatsResponse.builder()
                .totalQuizzesTaken(totalQuizzes)
                .totalQuestionsAnswered(totalQuestions)
                .totalCorrect(totalCorrect)
                .overallAccuracy(overallAccuracy)
                .averageScore(averageScore)
                .bestScore(bestScore)
                .averageTimePerQuestion(avgTime != null ? round1(avgTime) : 0.0)
                .accuracyByType(accuracyByType)
                .recentSessions(recentSessions)
                .mostMissedWords(mostMissed)
                .currentPassingStreak(streaks[0])
                .longestPassingStreak(streaks[1])
                .quizzesToday(quizzesToday)
                .questionsToday(questionsToday)
                .build();
    }

    /**
     * Computes [currentStreak, longestStreak] in days where the user had
     * at least one quiz session with score >= 60%.
     */
    private int[] computePassingStreaks(List<QuizSession> allSessions) {
        if (allSessions.isEmpty()) return new int[]{0, 0};

        Set<LocalDate> passingDays = allSessions.stream()
                .filter(s -> s.getQuestionCount() > 0
                        && s.getCorrectCount() * 1.0 / s.getQuestionCount() >= 0.6)
                .map(s -> s.getCompletedAt().toLocalDate())
                .collect(Collectors.toSet());

        if (passingDays.isEmpty()) return new int[]{0, 0};

        List<LocalDate> sortedDates = passingDays.stream().sorted().collect(Collectors.toList());
        LocalDate today = LocalDate.now();

        // Current streak: walk back from today (or yesterday if today not played yet)
        int current = 0;
        LocalDate cursor = passingDays.contains(today) ? today : today.minusDays(1);
        while (passingDays.contains(cursor)) {
            current++;
            cursor = cursor.minusDays(1);
        }

        // Longest streak
        int longest = 1, run = 1;
        for (int i = 1; i < sortedDates.size(); i++) {
            if (sortedDates.get(i).equals(sortedDates.get(i - 1).plusDays(1))) {
                run++;
            } else {
                longest = Math.max(longest, run);
                run = 1;
            }
        }
        longest = Math.max(longest, run);

        return new int[]{current, longest};
    }

    private static Map<String, Long> toTypeMap(List<Object[]> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            map.put((String) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
