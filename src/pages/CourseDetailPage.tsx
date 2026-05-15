import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCourseById, getLessonsByCourse, Course, Lesson } from '../api/courses';
import { isAuthenticated } from '../api/auth';
import './css/CourseDetailPage.css';

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
      getCourseById(id).catch(() => ({ data: null })),
      getLessonsByCourse(id).catch(() => ({ data: [] as Lesson[] })),
    ]).then(([cRes, lRes]) => {
      setCourse(cRes.data);
      setLessons(lRes.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    navigate(`/courses/${id}/checkout`);
  };

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

  const isFree = course.free === true;

  return (
    <div className="detail-page">
      <Navbar />

      <div className="detail-topbar">
        <button className="back-btn" onClick={() => navigate('/courses')}>
          {'←'} Back
        </button>
      </div>

      <div className="detail-content">

        {/* Left column: thumbnail, author, rating, tags, lessons */}
        <div className="detail-left">
          <div className="detail-media">
            {course.thumbnail
              ? <img src={course.thumbnail} alt={course.title} className="detail-media-img" />
              : <span className="detail-media-placeholder">Introduction Picture or Video</span>
            }
          </div>

          <div className="detail-meta-row">
            <span className="detail-educator">{course.teacherName || 'Educator Name'}</span>
            <span className="detail-rate">
              {course.rating ? <StarRating rating={course.rating} /> : 'No rating'}
            </span>
          </div>

          <div className="detail-tags-row">
            {course.category && <span className="detail-tag">{course.category}</span>}
            {course.level && <span className="detail-tag">{course.level}</span>}
          </div>

          <div className="detail-lessons-box">
            <p className="detail-lessons-header">Lessons</p>
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
              <p className="detail-lessons-empty">No lessons published yet.</p>
            )}
          </div>
        </div>

        {/* Right column: title, access badge, description, enroll */}
        <div className="detail-right">
          <div className="detail-about-card">
            <div className="detail-title-row">
              <h1 className="detail-topic">{course.title}</h1>
              <span className={`detail-access-badge ${isFree ? 'free' : 'subscription'}`}>
                {isFree ? 'Free' : 'Subscription'}
              </span>
            </div>
            <p className="detail-about-text">{course.description}</p>
            <button className="detail-enroll-btn" onClick={handleEnroll}>
              Enroll Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseDetailPage;