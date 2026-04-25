import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  getMyEnrollments,
  getCourseProgress,
  Enrollment,
  CourseProgress,
} from '../api';
import { getCourseById, Course } from '../api/courses';
import { isAuthenticated } from '../api/auth';
import './css/MyEnrollmentsPage.css';

interface EnrollmentRow {
  enrollment: Enrollment;
  course: Course | null;
  progress: CourseProgress | null;
}

const MOCK_ROWS: EnrollmentRow[] = [
  {
    enrollment: {
      id: 'e1',
      userId: 'u1',
      courseId: '1',
      status: 'ACTIVE',
      enrolledAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    course: {
      id: '1',
      title: 'Introduction to React',
      description: 'Learn React from scratch',
      teacherId: 't1',
      teacherName: 'Alice Johnson',
      category: 'Technology',
      level: 'Beginner',
      published: true,
      createdAt: '',
      updatedAt: '',
      price: 49,
      rating: 4.7,
    },
    progress: {
      id: 'p1',
      userId: 'u1',
      courseId: '1',
      completedLessonIds: ['l1', 'l2'],
      progressPercent: 50,
      completed: false,
    },
  },
  {
    enrollment: {
      id: 'e2',
      userId: 'u1',
      courseId: '4',
      status: 'ACTIVE',
      enrolledAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    course: {
      id: '4',
      title: 'Spring Boot Mastery',
      description: 'Build production-grade REST APIs',
      teacherId: 't4',
      teacherName: 'David Lee',
      category: 'Technology',
      level: 'Intermediate',
      published: true,
      createdAt: '',
      updatedAt: '',
      price: 89,
      rating: 4.8,
    },
    progress: {
      id: 'p2',
      userId: 'u1',
      courseId: '4',
      completedLessonIds: ['l1', 'l2', 'l3', 'l4', 'l5'],
      progressPercent: 100,
      completed: true,
      certificateId: 'cert-mock-1',
    },
  },
];

const MyEnrollmentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const enrRes = await getMyEnrollments();
        const enrollments = enrRes.data || [];
        const expanded = await Promise.all(
          enrollments.map(async (e): Promise<EnrollmentRow> => {
            const [cRes, pRes] = await Promise.allSettled([
              getCourseById(e.courseId),
              getCourseProgress(e.courseId),
            ]);
            return {
              enrollment: e,
              course: cRes.status === 'fulfilled' ? cRes.value.data : null,
              progress: pRes.status === 'fulfilled' ? pRes.value.data : null,
            };
          })
        );
        setRows(expanded);
      } catch {
        setRows(MOCK_ROWS);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = rows.filter((r) => {
    if (filter === 'in-progress') return !r.progress?.completed;
    if (filter === 'completed') return r.progress?.completed;
    return true;
  });

  const totalCount = rows.length;
  const completedCount = rows.filter((r) => r.progress?.completed).length;

  return (
    <div className="enrollments-page">
      <Navbar />

      <div className="enr-container">
        <header className="enr-header">
          <h1>My learning</h1>
          <p className="enr-sub">
            {totalCount} course{totalCount === 1 ? '' : 's'} · {completedCount} completed
          </p>
        </header>

        <div className="enr-filters">
          <button
            className={`enr-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`enr-filter ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In progress
          </button>
          <button
            className={`enr-filter ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {loading ? (
          <p className="enr-empty">Loading your courses...</p>
        ) : filtered.length === 0 ? (
          <div className="enr-empty-card">
            <p className="enr-empty">
              {filter === 'all'
                ? "You haven't enrolled in anything yet."
                : `No ${filter.replace('-', ' ')} courses.`}
            </p>
            <Link to="/courses" className="enr-browse-btn">
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="enr-grid">
            {filtered.map((r) => {
              const c = r.course;
              const pct = r.progress?.progressPercent ?? 0;
              const done = r.progress?.completed;
              return (
                <Link
                  key={r.enrollment.id}
                  to={`/courses/${r.enrollment.courseId}`}
                  className="enr-card"
                >
                  <div className="enr-thumb">
                    {c?.thumbnail ? (
                      <img
                        src={`http://localhost:8080/files?path=${c.thumbnail}`}
                        alt={c.title}
                      />
                    ) : (
                      <span className="enr-thumb-ph">{c?.title?.[0] || '?'}</span>
                    )}
                    {done && <span className="enr-completed-badge">✓ Completed</span>}
                  </div>
                  <div className="enr-info">
                    <p className="enr-card-title">{c?.title || 'Course'}</p>
                    <p className="enr-card-teacher">{c?.teacherName || 'Educator'}</p>
                    <div className="enr-progress">
                      <div className="enr-progress-bar">
                        <div style={{ width: `${pct}%` }} />
                      </div>
                      <span className="enr-progress-pct">{pct}%</span>
                    </div>
                    {done && r.progress?.certificateId && (
                      <Link
                        to={`/certificates/${r.progress.certificateId}`}
                        className="enr-cert-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View certificate →
                      </Link>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnrollmentsPage;
