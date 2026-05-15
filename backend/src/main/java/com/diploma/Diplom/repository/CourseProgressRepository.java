package com.diploma.Diplom.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.diploma.Diplom.model.CourseProgress;

public interface CourseProgressRepository extends MongoRepository<CourseProgress, String> {
    Optional<CourseProgress> findFirstByUserIdAndCourseId(String userId, String courseId);
    List<CourseProgress> findAllByUserIdAndCourseId(String userId, String courseId);
}