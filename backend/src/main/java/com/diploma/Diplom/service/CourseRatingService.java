package com.diploma.Diplom.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.diploma.Diplom.dto.RatingRequest;
import com.diploma.Diplom.exception.BadRequestException;
import com.diploma.Diplom.exception.ForbiddenException;
import com.diploma.Diplom.exception.ResourceNotFoundException;
import com.diploma.Diplom.model.Course;
import com.diploma.Diplom.model.CourseProgress;
import com.diploma.Diplom.model.CourseRating;
import com.diploma.Diplom.model.User;
import com.diploma.Diplom.repository.CourseRatingRepository;
import com.diploma.Diplom.repository.CourseRepository;
import com.diploma.Diplom.repository.CourseProgressRepository;
import com.diploma.Diplom.repository.UserRepository;

@Service
public class CourseRatingService {

    private final CourseRatingRepository ratingRepository;
    private final CourseRepository courseRepository;
    private final CourseProgressRepository progressRepository;
    private final UserRepository userRepository;

    public CourseRatingService(CourseRatingRepository ratingRepository,
                               CourseRepository courseRepository,
                               CourseProgressRepository progressRepository,
                               UserRepository userRepository) {
        this.ratingRepository = ratingRepository;
        this.courseRepository = courseRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
    }

    
    public CourseRating rateOrUpdate(String userId, String courseId, RatingRequest request) {
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5");
        }

        CourseProgress progress = progressRepository
                .findFirstByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ForbiddenException(
                        "You must be enrolled and have started this course to rate it"));

        if (progress.getCompletedLessonIds().isEmpty()) {
            throw new ForbiddenException(
                    "Complete at least one lesson before leaving a rating");
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CourseRating rating = ratingRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseGet(() -> {
                    CourseRating r = new CourseRating();
                    r.setUserId(userId);
                    r.setCourseId(courseId);
                    r.setCreatedAt(LocalDateTime.now());
                    return r;
                });

        rating.setUserName(author.getName());
        rating.setUserAvatarUrl(author.getProfileImageUrl());

        rating.setRating(request.getRating());
        rating.setReview(request.getReview());
        rating.setUpdatedAt(LocalDateTime.now());

        rating = ratingRepository.save(rating);
        recalcCourseAverage(courseId);
        return rating;
    }

    public List<CourseRating> getRatings(String courseId) {
        List<CourseRating> ratings = ratingRepository.findByCourseId(courseId);
        if (ratings.isEmpty()) return ratings;

        Set<String> userIds = ratings.stream()
                .map(CourseRating::getUserId)
                .collect(Collectors.toSet());
        Map<String, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        ratings.forEach(r -> {
            User u = users.get(r.getUserId());
            if (u != null) {
                r.setUserName(u.getName());
                r.setUserAvatarUrl(u.getProfileImageUrl());
            }
        });
        return ratings;
    }

    public void deleteRating(String userId, String courseId) {
        CourseRating rating = ratingRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));
        ratingRepository.delete(rating);
        recalcCourseAverage(courseId);
    }


    private void recalcCourseAverage(String courseId) {
        List<CourseRating> all = ratingRepository.findByCourseId(courseId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (all.isEmpty()) {
            course.setAvgRating(0.0);
            course.setRatingCount(0);
        } else {
            double avg = all.stream()
                    .mapToInt(CourseRating::getRating)
                    .average()
                    .orElse(0.0);
            course.setAvgRating(Math.round(avg * 10.0) / 10.0);
            course.setRatingCount(all.size());
        }
        courseRepository.save(course);
    }
}