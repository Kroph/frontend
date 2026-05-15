package com.diploma.Diplom.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

import com.diploma.Diplom.exception.ForbiddenException;
import com.diploma.Diplom.exception.ResourceNotFoundException;
import com.diploma.Diplom.messaging.ActivityProducer;
import com.diploma.Diplom.messaging.CertificateProducer;
import com.diploma.Diplom.model.ActivityType;
import com.diploma.Diplom.model.CourseProgress;
import com.diploma.Diplom.model.Lesson;
import com.diploma.Diplom.model.Quiz;
import com.diploma.Diplom.repository.CertificateRepository;
import com.diploma.Diplom.repository.CourseProgressRepository;
import com.diploma.Diplom.repository.LessonRepository;
import com.diploma.Diplom.repository.QuizRepository;

@Slf4j
@Service
public class CourseProgressService {

    private final CourseProgressRepository courseProgressRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final CertificateRepository certificateRepository;
    private final CertificateProducer certificateProducer;
    private final ActivityProducer activityProducer;

    public CourseProgressService(
            CourseProgressRepository courseProgressRepository,
            LessonRepository lessonRepository,
            QuizRepository quizRepository,
            CertificateRepository certificateRepository,
            CertificateProducer certificateProducer,
            ActivityProducer activityProducer
    ) {
        this.courseProgressRepository = courseProgressRepository;
        this.lessonRepository = lessonRepository;
        this.quizRepository = quizRepository;
        this.certificateRepository = certificateRepository;
        this.certificateProducer = certificateProducer;
        this.activityProducer = activityProducer;
    }

    public CourseProgress markLessonCompleted(String userId, String courseId, String lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        if (lesson.isQuizRequired()) {
            Quiz quiz = quizRepository.findByLessonId(lessonId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "This lesson requires a quiz but no quiz was found. Contact your teacher."));

            CourseProgress progress = getOrCreateProgress(userId, courseId);
            if (!progress.getPassedQuizIds().contains(quiz.getId())) {
                throw new ForbiddenException(
                        "You must pass this lesson's quiz before marking it complete.");
            }
        }

        CourseProgress progress = getOrCreateProgress(userId, courseId);
        progress.getCompletedLessonIds().add(lessonId);
        progress.setLastUpdatedAt(LocalDateTime.now());

        recalculateProgress(progress);
        CourseProgress saved = courseProgressRepository.save(progress);

        try {
            activityProducer.sendActivity(
                    userId,
                    ActivityType.LESSON_COMPLETED.name(),
                    lessonId,
                    "Completed lesson: " + lesson.getTitle()
            );
        } catch (Exception e) {
            log.warn("Could not queue activity event: {}", e.getMessage());
        }

        return saved;
    }

    public CourseProgress markQuizPassed(String userId, String courseId, String quizId) {
        CourseProgress progress = getOrCreateProgress(userId, courseId);
        progress.getPassedQuizIds().add(quizId);
        progress.setLastUpdatedAt(LocalDateTime.now());

        recalculateProgress(progress);
        return courseProgressRepository.save(progress);
    }

    public boolean isLessonUnlocked(String userId, String courseId, String lessonId) {
        Lesson target = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        if (target.getOrderIndex() == 0) return true;

        List<Lesson> allLessons = lessonRepository
                .findByCourseIdOrderByOrderIndexAsc(courseId);

        CourseProgress progress = getOrCreateProgress(userId, courseId);

        for (Lesson previous : allLessons) {
            if (!previous.isPublished()) continue;
            if (previous.getOrderIndex() >= target.getOrderIndex()) break;

            if (!progress.getCompletedLessonIds().contains(previous.getId())) {
                return false;
            }

            if (previous.isQuizRequired()) {
                Quiz quiz = quizRepository.findByLessonId(previous.getId()).orElse(null);
                if (quiz != null && !progress.getPassedQuizIds().contains(quiz.getId())) {
                    return false;
                }
            }
        }

        return true;
    }

    public CourseProgress getProgressByLessonId(String userId, String lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        return getProgress(userId, lesson.getCourseId());
    }

    public CourseProgress getProgress(String userId, String courseId) {
        return getOrCreateProgress(userId, courseId);
    }

    private CourseProgress getOrCreateProgress(String userId, String courseId) {
        List<CourseProgress> all = courseProgressRepository.findAllByUserIdAndCourseId(userId, courseId);

        if (all.size() > 1) {
            // Deduplicate: keep the record with the most completed lessons, delete the rest
            all.sort((a, b) -> {
                int aSize = a.getCompletedLessonIds() == null ? 0 : a.getCompletedLessonIds().size();
                int bSize = b.getCompletedLessonIds() == null ? 0 : b.getCompletedLessonIds().size();
                return Integer.compare(bSize, aSize);
            });
            List<CourseProgress> duplicates = all.subList(1, all.size());
            courseProgressRepository.deleteAll(duplicates);
            log.warn("Deleted {} duplicate progress records for userId={} courseId={}", duplicates.size(), userId, courseId);
        }

        CourseProgress progress = all.isEmpty()
                ? courseProgressRepository.save(newProgress(userId, courseId))
                : all.get(0);

        if (progress.getCompletedLessonIds() == null) progress.setCompletedLessonIds(new HashSet<>());
        if (progress.getPassedQuizIds() == null) progress.setPassedQuizIds(new HashSet<>());
        return progress;
    }

    private CourseProgress newProgress(String userId, String courseId) {
        CourseProgress p = new CourseProgress();
        p.setUserId(userId);
        p.setCourseId(courseId);
        p.setCompletedLessonIds(new HashSet<>());
        p.setPassedQuizIds(new HashSet<>());
        p.setProgressPercent(0);
        p.setCompleted(false);
        p.setLastUpdatedAt(LocalDateTime.now());
        return p;
    }

    private void recalculateProgress(CourseProgress progress) {
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(progress.getCourseId());

        Set<String> lessonIds = lessons.stream()
                .map(Lesson::getId)
                .collect(Collectors.toSet());

        List<Quiz> quizzes = lessonIds.isEmpty()
                ? List.of()
                : quizRepository.findByLessonIdIn(List.copyOf(lessonIds));

        int totalLessons = lessons.size();
        int totalQuizzes = quizzes.size();

        int completedLessons = (int) lessons.stream()
                .filter(lesson -> progress.getCompletedLessonIds().contains(lesson.getId()))
                .count();

        int passedQuizzes = (int) quizzes.stream()
                .filter(quiz -> progress.getPassedQuizIds().contains(quiz.getId()))
                .count();

        int totalItems = totalLessons + totalQuizzes;
        int completedItems = completedLessons + passedQuizzes;

        int progressPercent = totalItems == 0 ? 0 : (completedItems * 100) / totalItems;
        progress.setProgressPercent(progressPercent);

        boolean allLessonsCompleted = totalLessons == 0 || completedLessons == totalLessons;
        boolean allQuizzesPassed = totalQuizzes == 0 || passedQuizzes == totalQuizzes;

        boolean courseCompleted = allLessonsCompleted && allQuizzesPassed;
        progress.setCompleted(courseCompleted);

        if (courseCompleted && progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());

            boolean certificateExists = certificateRepository
                    .findByUserIdAndCourseId(progress.getUserId(), progress.getCourseId())
                    .isPresent();

            if (!certificateExists) {
                try {
                    certificateProducer.requestCertificate(progress.getUserId(), progress.getCourseId());
                } catch (Exception e) {
                    log.warn("Could not queue certificate request: {}", e.getMessage());
                }
            }
        }
    }
}
