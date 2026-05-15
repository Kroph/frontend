import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCourseById, getLessonsByCourse, Course, Lesson } from '../api/courses';
import { getCourseProgress, checkAccess, CourseProgress } from '../api';
import { isAuthenticated } from '../api/auth';
import './css/CourseLearningPage.css';

const CourseLearningPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.allSettled([
      getCourseById(courseId),
      getLessonsByCourse(courseId),
      getCourseProgress(courseId),
      checkAccess(courseId),
    ]).then(([cRes, lRes, pRes, aRes]) => {
      if (cRes.status === 'fulfilled') setCourse(cRes.value.data);
      if (lRes.status === 'fulfilled') setLessons(lRes.value.data || []);
      if (pRes.status === 'fulfilled') setProgress(pRes.value.data);
      if (aRes.status === 'fulfilled' && !aRes.value.data.hasAccess) setNoAccess(true);
      setLoading(false);
    });
  }, [courseId]);

  const completedIds = new Set(progress?.completedLessonIds ?? []);
  const nextLesson = lessons.find((l) => !completedIds.has(l.id));
  const percent = progress?.progressPercent ?? 0;
  const doneCount = completedIds.size;

  if (loading) {
    return (
      <div className="clp-page">
        <Navbar />
        <p className="clp-loading">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="clp-page">
        <Navbar />
        <p className="clp-loading">Course not found.</p>
      </div>
    );
  }

  if (noAccess) {
    return (
      <div className="clp-page">
        <Navbar />
        <div className="clp-no-access">
          <h2>Access required</h2>
          <p>You need to enroll to access this course.</p>
          <button className="clp-enroll-btn" onClick={() => navigate(`/courses/${courseId}/checkout`)}>
            Enroll now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clp-page">
      <Navbar />

      <div className="clp-topbar">
        <button className="back-btn" onClick={() => navigate(`/my-enrollments`)}>
          ← Back to my courses
        </button>
        <div className="clp-progress-pill">
          <span>{percent}% complete</span>
          <div className="clp-progress-bar">
            <div style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="clp-layout">
        <aside className="clp-sidebar">
          <h3 className="clp-sidebar-title">Course contents</h3>
          <p className="clp-sidebar-meta">{doneCount} / {lessons.length} lessons complete</p>
          <ul className="clp-sidebar-list">
            {lessons.map((l, idx) => {
              const done = completedIds.has(l.id);
              const isCurrent = nextLesson?.id === l.id;
              return (
                <li key={l.id}>
                  <Link
                    to={`/courses/${courseId}/lessons/${l.id}`}
                    className={`clp-sidebar-item${done ? ' done' : ''}${isCurrent ? ' current' : ''}`}
                  >
                    <span className="clp-ls-status">
                      {done ? '✓' : isCurrent ? '▶' : <span className="clp-ls-num">{idx + 1}</span>}
                    </span>
                    <span className="clp-ls-title">{l.title}</span>
                    {l.duration != null && <span className="clp-ls-dur">{l.duration}m</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          {progress?.completed && (
            <div className="clp-sidebar-cert">
              <button
                className="clp-sidebar-cert-btn"
                onClick={() => navigate('/certificates')}
              >
                Get Certificate
              </button>
            </div>
          )}
        </aside>

        <main className="clp-main">
          <div className="clp-course-card">
            {course.thumbnail && (
              <img className="clp-thumbnail" src={course.thumbnail} alt={course.title} />
            )}
            <div className="clp-course-info">
              <h1 className="clp-course-title">{course.title}</h1>
              <p className="clp-course-teacher">by {course.teacherName || 'Educator'}</p>
              {course.description && (
                <p className="clp-course-desc">{course.description}</p>
              )}
              <div className="clp-course-tags">
                {course.category && <span className="clp-tag">{course.category}</span>}
                {course.level && <span className="clp-tag">{course.level}</span>}
              </div>
            </div>
          </div>

          <div className="clp-cta-card">
            <div className="clp-cta-stats">
              <div className="clp-cta-stat">
                <span className="clp-cta-stat-num">{doneCount}</span>
                <span className="clp-cta-stat-label">completed</span>
              </div>
              <div className="clp-cta-stat">
                <span className="clp-cta-stat-num">{lessons.length - doneCount}</span>
                <span className="clp-cta-stat-label">remaining</span>
              </div>
              <div className="clp-cta-stat">
                <span className="clp-cta-stat-num">{lessons.length}</span>
                <span className="clp-cta-stat-label">total</span>
              </div>
            </div>

            <div className="clp-cta-progress">
              <div className="clp-cta-progress-bar">
                <div style={{ width: `${percent}%` }} />
              </div>
              <span>{percent}%</span>
            </div>

            {progress?.completed ? (
              <div className="clp-completed-badge">
                ✓ Course completed!
                {progress.certificateId && (
                  <button className="clp-cert-btn" onClick={() => navigate('/certificates')}>
                    View certificate
                  </button>
                )}
              </div>
            ) : nextLesson ? (
              <div className="clp-cta-resume">
                <div>
                  <div className="clp-cta-label">{doneCount === 0 ? 'Start with' : 'Up next'}</div>
                  <div className="clp-cta-lesson-name">{nextLesson.title}</div>
                </div>
                <button
                  className="clp-resume-btn"
                  onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                >
                  {doneCount === 0 ? 'Start learning' : 'Resume'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="clp-lessons-section">
            <h3 className="clp-lessons-title">All lessons</h3>
            <div className="clp-lessons-list">
              {lessons.map((l, idx) => {
                const done = completedIds.has(l.id);
                return (
                  <button
                    key={l.id}
                    className={`clp-lesson-row${done ? ' done' : ''}`}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${l.id}`)}
                  >
                    <span className="clp-lr-index">{idx + 1}</span>
                    <span className="clp-lr-title">{l.title}</span>
                    {l.duration != null && <span className="clp-lr-dur">{l.duration} min</span>}
                    <span className="clp-lr-status">{done ? '✓' : '→'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseLearningPage;
