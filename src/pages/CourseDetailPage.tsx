import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCourseById, getLessonsByCourse, Course, Lesson } from '../api/courses';
import './CourseDetailPage.css';

// Mock data fallback
const MOCK_COURSES: Record<string, Course> = {
  '1': { id: '1', title: 'Introduction to React', description: 'Learn React from scratch with hands-on projects. This course covers components, hooks, state management, and modern React patterns to help you build production-ready applications.', teacherId: 't1', teacherName: 'Alice Johnson', category: 'Technology', level: 'Beginner', published: true, createdAt: '2024-01-15', updatedAt: '2024-03-10', price: 49, rating: 4.7 },
  '2': { id: '2', title: 'Advanced TypeScript', description: 'Deep dive into TypeScript generics, decorators, utility types, and advanced patterns used in large-scale applications.', teacherId: 't2', teacherName: 'Bob Smith', category: 'Technology', level: 'Advanced', published: true, createdAt: '2024-02-01', updatedAt: '2024-03-20', price: 79, rating: 4.9 },
  '3': { id: '3', title: 'UI/UX Design Principles', description: 'Master design thinking and user-centered design. Learn wireframing, prototyping, and design systems.', teacherId: 't3', teacherName: 'Carol White', category: 'Design', level: 'Intermediate', published: true, createdAt: '2024-01-20', updatedAt: '2024-03-05', price: 59, rating: 4.5 },
  '4': { id: '4', title: 'Spring Boot Mastery', description: 'Build production-grade REST APIs with Spring Boot, Security, MongoDB, and Docker.', teacherId: 't4', teacherName: 'David Lee', category: 'Technology', level: 'Intermediate', published: true, createdAt: '2024-02-10', updatedAt: '2024-03-25', price: 89, rating: 4.8 },
  '5': { id: '5', title: 'Business Strategy', description: 'Grow your business with proven strategy frameworks. Covers competitive analysis, market positioning, and growth tactics.', teacherId: 't5', teacherName: 'Emma Davis', category: 'Business', level: 'Beginner', published: true, createdAt: '2024-01-05', updatedAt: '2024-02-28', price: 39, rating: 4.3 },
  '6': { id: '6', title: 'Data Science with Python', description: 'Machine learning and data analysis using Python, pandas, NumPy, and scikit-learn.', teacherId: 't6', teacherName: 'Frank Chen', category: 'Science', level: 'Intermediate', published: true, createdAt: '2024-02-15', updatedAt: '2024-03-30', price: 99, rating: 4.6 },
  '7': { id: '7', title: 'Graphic Design Fundamentals', description: 'Visual communication basics including typography, color theory, composition, and brand identity.', teacherId: 't7', teacherName: 'Grace Kim', category: 'Design', level: 'Beginner', published: true, createdAt: '2024-01-25', updatedAt: '2024-03-08', price: 45, rating: 4.4 },
  '8': { id: '8', title: 'MongoDB & NoSQL', description: 'Database design patterns, aggregation pipelines, indexing strategies, and replication in MongoDB.', teacherId: 't8', teacherName: 'Henry Park', category: 'Technology', level: 'Advanced', published: true, createdAt: '2024-02-20', updatedAt: '2024-03-18', price: 69, rating: 4.7 },
};

const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', courseId: '1', title: 'Getting Started with React', description: 'Setup your environment and create your first component', orderIndex: 1, duration: 25, published: true },
  { id: 'l2', courseId: '1', title: 'Components & Props', description: 'Understanding the building blocks of React', orderIndex: 2, duration: 35, published: true },
  { id: 'l3', courseId: '1', title: 'State & useState Hook', description: 'Managing component state effectively', orderIndex: 3, duration: 40, published: true },
  { id: 'l4', courseId: '1', title: 'useEffect & Side Effects', description: 'Handling lifecycle and async operations', orderIndex: 4, duration: 30, published: true },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="detail-stars">
    {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    <span className="detail-rating-num"> {rating.toFixed(1)}</span>
  </span>
);

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getCourseById(id).catch(() => ({ data: MOCK_COURSES[id] || null })),
      getLessonsByCourse(id).catch(() => ({ data: MOCK_LESSONS.filter(l => l.courseId === id) })),
    ]).then(([cRes, lRes]) => {
      setCourse(cRes.data);
      setLessons(lRes.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="detail-page">
        <Navbar />
        <div className="detail-loading">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="detail-page">
        <Navbar />
        <div className="detail-loading">Course not found.</div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <Navbar />

      {/* Top bar */}
      <div className="detail-topbar">
        <button className="detail-back-btn" onClick={() => navigate('/courses')}>
          Back
        </button>
        <span className="detail-price-label">
          {course.price ? `$${course.price}` : 'Free'}
        </span>
      </div>

      {/* Main layout */}
      <div className="detail-content">
        {/* Left column */}
        <div className="detail-left">
          <p className="detail-topic">{course.title}</p>

          {/* Thumbnail / Video */}
          <div className="detail-media">
            {course.thumbnail
              ? <img src={`http://localhost:8080/files?path=${course.thumbnail}`} alt={course.title} className="detail-media-img" />
              : <span className="detail-media-placeholder">Introduction Picture or Video</span>
            }
          </div>

          {/* Educator + Rating row */}
          <div className="detail-meta-row">
            <span className="detail-educator">{course.teacherName || 'Educator Name'}</span>
            <span className="detail-rate">
              {course.rating ? <StarRating rating={course.rating} /> : 'Rate'}
            </span>
          </div>

          {/* Lessons / Where lesson takes place */}
          <div className="detail-lessons-box">
            {lessons.length > 0 ? (
              <ul className="detail-lessons-list">
                {lessons.map((lesson, idx) => (
                  <li key={lesson.id} className="detail-lesson-item">
                    <span className="lesson-index">{idx + 1}.</span>
                    <span className="lesson-title">{lesson.title}</span>
                    {lesson.duration && (
                      <span className="lesson-duration">{lesson.duration} min</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-lessons-empty">Where will the lesson take place</p>
            )}
          </div>
        </div>

        {/* Right column — About Course */}
        <div className="detail-right">
          <div className="detail-about-card">
            <h2 className="detail-about-title">About Course</h2>
            <p className="detail-about-text">{course.description}</p>

            <div className="detail-tags">
              <span className="detail-tag">{course.level}</span>
              <span className="detail-tag">{course.category}</span>
            </div>

            <button className="detail-enroll-btn">
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
