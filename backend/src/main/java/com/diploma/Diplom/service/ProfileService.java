package com.diploma.Diplom.service;

import com.diploma.Diplom.dto.ActivityItem;
import com.diploma.Diplom.dto.ProfileResponse;
import com.diploma.Diplom.dto.PublicProfileResponse;
import com.diploma.Diplom.dto.UpdateProfileRequest;
import com.diploma.Diplom.exception.ResourceNotFoundException;
import com.diploma.Diplom.model.Course;
import com.diploma.Diplom.model.User;
import com.diploma.Diplom.model.CourseRating;
import com.diploma.Diplom.repository.ActivityFeedRepository;
import com.diploma.Diplom.repository.CourseRatingRepository;
import com.diploma.Diplom.repository.CourseRepository;
import com.diploma.Diplom.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final ActivityFeedRepository activityFeedRepository;
    private final CourseRepository courseRepository;
    private final CourseRatingRepository courseRatingRepository;

    public ProfileService(UserRepository userRepository,
                          ActivityFeedRepository activityFeedRepository,
                          CourseRepository courseRepository,
                          CourseRatingRepository courseRatingRepository) {
        this.userRepository = userRepository;
        this.activityFeedRepository = activityFeedRepository;
        this.courseRepository = courseRepository;
        this.courseRatingRepository = courseRatingRepository;
    }

    public ProfileResponse getMyProfile(String userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        
        var activity = activityFeedRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 20))
                .stream()
                .map(a -> new ActivityItem(
                        a.getType(),
                        a.getMessage(),
                        a.getCreatedAt()
                ))
                .toList();

        return new ProfileResponse(
                user.getId(),
                user.getName(),
                user.getAge(),
                user.getProfileImageUrl(),
                activity
        );
    }

    public PublicProfileResponse getPublicProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Course> courses = courseRepository.findByTeacherId(userId).stream()
                .filter(Course::isPublished)
                .toList();

        List<CourseRating> reviews = courses.stream()
                .flatMap(c -> courseRatingRepository.findByCourseId(c.getId()).stream())
                .collect(Collectors.toList());

        if (!reviews.isEmpty()) {
            Set<String> userIds = reviews.stream()
                    .map(CourseRating::getUserId)
                    .collect(Collectors.toSet());
            Map<String, User> users = userRepository.findAllById(new ArrayList<>(userIds)).stream()
                    .collect(Collectors.toMap(User::getId, u -> u));
            reviews.forEach(r -> {
                User u = users.get(r.getUserId());
                if (u != null) {
                    r.setUserName(u.getName());
                    r.setUserAvatarUrl(u.getProfileImageUrl());
                }
            });
        }

        return new PublicProfileResponse(
                user.getId(),
                user.getName(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getProfileImageUrl(),
                user.getBio(),
                user.getSocialLinks(),
                courses,
                reviews
        );
    }

    public void updateProfile(String userId, UpdateProfileRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.age() != null) {
            user.setAge(request.age());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.socialLinks() != null) {
            user.setSocialLinks(request.socialLinks());
        }
        userRepository.save(user);
    }

    public void updateAvatar(String userId, String cloudinaryUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setProfileImageUrl(cloudinaryUrl);
        userRepository.save(user);
    }
}