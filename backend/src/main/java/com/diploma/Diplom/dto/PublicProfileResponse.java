package com.diploma.Diplom.dto;

import com.diploma.Diplom.model.Course;
import com.diploma.Diplom.model.CourseRating;
import java.util.List;
import java.util.Map;

public record PublicProfileResponse(
        String id,
        String name,
        String role,
        String profileImageUrl,
        String bio,
        Map<String, String> socialLinks,
        List<Course> courses,
        List<CourseRating> reviews
) {}
