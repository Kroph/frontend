import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Course } from '../api/courses';
import {
  getMyCourses,
  getMyEnrollments,
  getCourseProgress,
  Enrollment,
  CourseProgress,
} from '../api';
import { getCourseById } from '../api/courses';
import { getProfile, getMyReviews, updateProfile, UserProfile, Review } from '../api/profile';
import { isAuthenticated, getUserRole } from '../api/auth';
import './css/ProfilePage.css';

interface EnrollmentRow {
  enrollment: Enrollment;
  course: Course | null;
  progress: CourseProgress | null;
}

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({
  rating,
  size = 'sm',
}) => (
  <span className="review-stars" style={{ fontSize: size === 'md' ? '1rem' : '0.8rem' }}>
    {'★'.repeat(Math.floor(rating))}
    {'☆'.repeat(5 - Math.floor(rating))}
  </span>
);

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const initials = (review.reviewerName ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">{initials}</div>
        <div className="review-meta">
          <span className="review-reviewer-name">{review.reviewerName}</span>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="review-comment">{review.comment}</p>
    </div>
  );
};

interface EditModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
}

const EditProfileModal: React.FC<EditModalProps> = ({ profile, onClose, onSave }) => {
  const navigate = useNavigate();
  const isStudent = getUserRole() === 'STUDENT';
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [twitter, setTwitter] = useState(profile.socialLinks?.twitter || '');
  const [linkedin, setLinkedin] = useState(profile.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(profile.socialLinks?.github || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updated: Partial<UserProfile> = { name };
    if (!isStudent) {
      updated.bio = bio;
      updated.socialLinks = { twitter, linkedin, github };
    }
    await onSave(updated);
    setSaving(false);
    onClose();
  };

  return (
    <div className="profile-modal-bg" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Profile</h2>

        <div>
          <label className="modal-label">Name</label>
          <input
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {!isStudent && (
          <>
            <div>
              <label className="modal-label">Short Introduction</label>
              <textarea
                className="modal-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
              />
            </div>

            <div>
              <label className="modal-label">Twitter URL</label>
              <input
                className="modal-input"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://twitter.com/you"
              />
            </div>

            <div>
              <label className="modal-label">LinkedIn URL</label>
              <input
                className="modal-input"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/you"
              />
            </div>

            <div>
              <label className="modal-label">GitHub URL</label>
              <input
                className="modal-input"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/you"
              />
            </div>
          </>
        )}

        {!(['teacher', 'educator', 'TEACHER', 'EDUCATOR'].includes(getUserRole() ?? '')) && (
          <div className="modal-teacher-apply">
            <div className="modal-teacher-apply-info">
              <span className="modal-teacher-check">✓</span>
              <div>
                <p className="modal-teacher-title">Become a Qualified Teacher</p>
                <p className="modal-teacher-sub">Submit your resume for AI screening & admin review</p>
              </div>
            </div>
            <button
              className="modal-teacher-btn"
              onClick={() => { onClose(); navigate('/teacher-apply'); }}
            >
              Apply →
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const role = getUserRole() ?? '';
  const isStudent = role === 'STUDENT';
  const isTeacher = ['TEACHER', 'EDUCATOR', 'teacher', 'educator'].includes(role);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enrolledRows, setEnrolledRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // --- Created courses toolbar (teachers + admins) ---
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');

  // --- Enrolled courses toolbar (students; also teachers in their second section) ---
  const [enrollSearch, setEnrollSearch] = useState('');
  const [showEnrollSearch, setShowEnrollSearch] = useState(false);
  const [showEnrollFilters, setShowEnrollFilters] = useState(false);
  const [enrollLevelFilter, setEnrollLevelFilter] = useState('All');
  const [enrollCategoryFilter, setEnrollCategoryFilter] = useState('All');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        if (isStudent) {
          const [profileRes, enrRes] = await Promise.allSettled([
            getProfile(),
            getMyEnrollments(),
          ]);

          setProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);

          if (enrRes.status === 'fulfilled') {
            const enrollments = enrRes.value.data || [];
            const rows = await Promise.all(
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
            setEnrolledRows(rows);
          }
        } else if (isTeacher) {
          const [profileRes, coursesRes, reviewsRes, enrRes] = await Promise.allSettled([
            getProfile(),
            getMyCourses(),
            getMyReviews(),
            getMyEnrollments(),
          ]);

          setProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
          setCourses(
            coursesRes.status === 'fulfilled' ? (coursesRes.value.data as unknown as Course[]) : []
          );
          setReviews(reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : []);

          if (enrRes.status === 'fulfilled') {
            const enrollments = enrRes.value.data || [];
            const rows = await Promise.all(
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
            setEnrolledRows(rows);
          }
        } else {
          // ADMIN
          const [profileRes, coursesRes, reviewsRes] = await Promise.allSettled([
            getProfile(),
            getMyCourses(),
            getMyReviews(),
          ]);

          setProfile(profileRes.status === 'fulfilled' ? profileRes.value.data : null);
          setCourses(
            coursesRes.status === 'fulfilled' ? (coursesRes.value.data as unknown as Course[]) : []
          );
          setReviews(reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : []);
        }
      } catch {
        setProfile(null);
        setCourses([]);
        setReviews([]);
        setEnrolledRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isStudent, isTeacher]);

  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    try {
      await updateProfile(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch {
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  };

  // Created courses — with optional rating filter
  const filteredCourses = courses.filter((c) => {
    if (!c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter !== 'All' && c.level !== levelFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (ratingFilter !== 'All') {
      const min = parseInt(ratingFilter, 10);
      if (!c.rating || c.rating < min) return false;
    }
    return true;
  });

  // Enrolled courses — for students (uses primary toolbar state)
  const filteredEnrolled = enrolledRows.filter((r) => {
    const title = r.course?.title ?? '';
    if (!title.toLowerCase().includes(enrollSearch.toLowerCase())) return false;
    if (enrollLevelFilter !== 'All' && r.course?.level !== enrollLevelFilter) return false;
    if (enrollCategoryFilter !== 'All' && r.course?.category !== enrollCategoryFilter) return false;
    return true;
  });

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const socialEntries = Object.entries(profile?.socialLinks || {}).filter(([, url]) => !!url);

  const socialLabel: Record<string, string> = {
    twitter: '𝕏',
    linkedin: 'in',
    github: 'gh',
    website: 'web',
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-mono)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  // Reusable enrolled-course card grid
  const EnrolledGrid: React.FC<{ rows: EnrollmentRow[] }> = ({ rows }) =>
    rows.length === 0 ? (
      <p className="profile-empty">No enrolled courses found.</p>
    ) : (
      <div className="profile-courses-grid">
        {rows.map((r) => {
          const c = r.course;
          const pct = r.progress?.progressPercent ?? 0;
          const done = r.progress?.completed;
          return (
            <Link
              to={`/courses/${r.enrollment.courseId}/learn`}
              key={r.enrollment.id}
              className="profile-course-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="pcc-topic" style={{ margin: 0 }}>{c?.title || 'Course'}</p>
                {done && (
                  <span style={{ fontSize: '0.7rem', background: '#22c55e', color: '#fff', borderRadius: '4px', padding: '1px 6px', marginLeft: '6px', whiteSpace: 'nowrap' }}>Completed</span>
                )}
              </div>
              <div className="pcc-thumbnail">
                {c?.thumbnail ? (
                  <img src={c.thumbnail} alt={c.title} />
                ) : (
                  <span className="pcc-thumb-placeholder">Introduction Picture or Video</span>
                )}
              </div>
              <p className="pcc-educator">{c?.teacherName || 'Educator'}</p>
              <div className="pcc-footer">
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{pct}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-body">
        <aside className="profile-sidebar">
          <div
            className="profile-avatar-wrap"
            title="Change photo"
            onClick={() => {/* future: open avatar upload */}}
          >
            {profile?.avatarUrl ? (
              <img className="profile-avatar-img" src={profile.avatarUrl} alt={profile.name} />
            ) : (
              <span className="profile-avatar-placeholder">{initials}</span>
            )}
            <div className="avatar-overlay">Change Photo</div>
          </div>

          <p className="profile-name">{profile?.name || 'Name'}</p>

          {(['teacher', 'educator', 'TEACHER', 'EDUCATOR'].includes(role)) && (
            <div className="teacher-badge">
              <span className="teacher-badge-check">✓</span>
              <span className="teacher-badge-label">Qualified Teacher</span>
            </div>
          )}

          {!isStudent && (
            <>
              {socialEntries.length > 0 && (
                <div className="profile-social-links">
                  {socialEntries.map(([key, url]) => (
                    <a
                      key={key}
                      className="social-chip"
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {socialLabel[key] || key}
                    </a>
                  ))}
                </div>
              )}

              {!socialEntries.length && (
                <p className="profile-bio" style={{ opacity: 0.5 }}>Social media links</p>
              )}

              <p className="profile-bio">{profile?.bio || 'Short Introduction'}</p>
            </>
          )}

          <div className="profile-stat-row">
            {!isStudent && (
              <p className="profile-stat">
                <span>{profile?.courseCount ?? courses.length}</span> courses created
              </p>
            )}
            <p className="profile-stat">
              <span>{(isStudent || isTeacher) ? enrolledRows.length : (profile?.enrolledCount ?? 0)}</span> enrolled courses
            </p>
          </div>

          <button className="profile-edit-btn" onClick={() => setShowEditModal(true)}>
            Edit Profile
          </button>

          {(['TEACHER', 'ADMIN'].includes(role)) && (
            <button className="profile-create-course-btn" onClick={() => navigate('/courses/create')}>
              + Create Course
            </button>
          )}
        </aside>

        <main className="profile-main">

          {/* ── TEACHER: Created Courses (first) ─────────────────────── */}
          {(isTeacher || (!isStudent && !isTeacher)) && (
            <div className="profile-section">
              <div className="profile-section-header">
                <span className="profile-section-title">
                  {isTeacher ? 'My Created Courses' : 'Courses'}
                </span>
                <div className="courses-toolbar-row">
                  <div className="filter-btn-wrap">
                    <button
                      className={`toolbar-filter-btn${showFilters ? ' active' : ''}`}
                      onClick={() => setShowFilters((s) => !s)}
                    >
                      Filters
                    </button>
                    {showFilters && (
                      <div className="filter-panel filter-panel-3col">
                        <div className="filter-group">
                          <span className="filter-group-label">Level</span>
                          <div className="filter-chips">
                            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${levelFilter === opt ? 'active' : ''}`}
                                onClick={() => setLevelFilter(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="filter-group">
                          <span className="filter-group-label">Category</span>
                          <div className="filter-chips">
                            {['All', 'Programming', 'Mathematics', 'Physics', 'Sciences'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${categoryFilter === opt ? 'active' : ''}`}
                                onClick={() => setCategoryFilter(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="filter-group">
                          <span className="filter-group-label">Rating</span>
                          <div className="filter-chips">
                            {['All', '1', '2', '3', '4'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${ratingFilter === opt ? 'active' : ''}`}
                                onClick={() => setRatingFilter(opt)}
                              >
                                {opt === 'All' ? 'All' : `${opt}★+`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="toolbar-filter-btn"
                    onClick={() => {
                      setShowSearch((s) => !s);
                      if (showSearch) setSearch('');
                    }}
                  >
                    Search
                  </button>
                  {showSearch && (
                    <input
                      className="courses-search-input"
                      type="text"
                      placeholder="Search courses..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {filteredCourses.length === 0 ? (
                <p className="profile-empty">No courses found.</p>
              ) : (
                <div className="profile-courses-grid">
                  {filteredCourses.map((course) => (
                    <Link
                      to={`/courses/${course.id}/edit`}
                      key={course.id}
                      className="profile-course-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p className="pcc-topic" style={{ margin: 0 }}>{course.title}</p>
                        {!course.published && (
                          <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#fff', borderRadius: '4px', padding: '1px 6px', marginLeft: '6px', whiteSpace: 'nowrap' }}>Draft</span>
                        )}
                      </div>
                      <div className="pcc-thumbnail">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} />
                        ) : (
                          <span className="pcc-thumb-placeholder">Introduction Picture or Video</span>
                        )}
                      </div>
                      <p className="pcc-educator">{course.teacherName || 'Educator'}</p>
                      <div className="pcc-footer">
                        <span className="pcc-rate">
                          {course.rating ? (
                            <><StarRating rating={course.rating} /> {course.rating.toFixed(1)}</>
                          ) : (
                            'No rating'
                          )}
                        </span>
                        <span className="pcc-price">
                          {course.price ? `$${course.price}` : 'Free'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TEACHER: Enrolled Courses (second, teacher-only) ──────── */}
          {isTeacher && (
            <div className="profile-section">
              <div className="profile-section-header">
                <span className="profile-section-title">My Enrolled Courses</span>
                <div className="courses-toolbar-row">
                  <div className="filter-btn-wrap">
                    <button
                      className={`toolbar-filter-btn${showEnrollFilters ? ' active' : ''}`}
                      onClick={() => setShowEnrollFilters((s) => !s)}
                    >
                      Filters
                    </button>
                    {showEnrollFilters && (
                      <div className="filter-panel">
                        <div className="filter-group">
                          <span className="filter-group-label">Level</span>
                          <div className="filter-chips">
                            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${enrollLevelFilter === opt ? 'active' : ''}`}
                                onClick={() => setEnrollLevelFilter(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="filter-group">
                          <span className="filter-group-label">Category</span>
                          <div className="filter-chips">
                            {['All', 'Programming', 'Mathematics', 'Physics', 'Sciences'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${enrollCategoryFilter === opt ? 'active' : ''}`}
                                onClick={() => setEnrollCategoryFilter(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="toolbar-filter-btn"
                    onClick={() => {
                      setShowEnrollSearch((s) => !s);
                      if (showEnrollSearch) setEnrollSearch('');
                    }}
                  >
                    Search
                  </button>
                  {showEnrollSearch && (
                    <input
                      className="courses-search-input"
                      type="text"
                      placeholder="Search enrolled courses..."
                      value={enrollSearch}
                      onChange={(e) => setEnrollSearch(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <EnrolledGrid rows={filteredEnrolled} />
            </div>
          )}

          {/* ── STUDENT: Enrolled Courses ─────────────────────────────── */}
          {isStudent && (
            <div className="profile-section">
              <div className="profile-section-header">
                <span className="profile-section-title">My Enrolled Courses</span>
                <div className="courses-toolbar-row">
                  <div className="filter-btn-wrap">
                    <button
                      className={`toolbar-filter-btn${showEnrollFilters ? ' active' : ''}`}
                      onClick={() => setShowEnrollFilters((s) => !s)}
                    >
                      Filters
                    </button>
                    {showEnrollFilters && (
                      <div className="filter-panel">
                        <div className="filter-group">
                          <span className="filter-group-label">Level</span>
                          <div className="filter-chips">
                            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${enrollLevelFilter === opt ? 'active' : ''}`}
                                onClick={() => setEnrollLevelFilter(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="filter-group">
                          <span className="filter-group-label">Category</span>
                          <div className="filter-chips">
                            {['All', 'Programming', 'Mathematics', 'Physics', 'Sciences'].map((opt) => (
                              <button
                                key={opt}
                                className={`filter-chip ${enrollCategoryFilter === opt ? 'active' : ''}`}
                                onClick={() => setEnrollCategoryFilter(opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="toolbar-filter-btn"
                    onClick={() => {
                      setShowEnrollSearch((s) => !s);
                      if (showEnrollSearch) setEnrollSearch('');
                    }}
                  >
                    Search
                  </button>
                  {showEnrollSearch && (
                    <input
                      className="courses-search-input"
                      type="text"
                      placeholder="Search enrolled courses..."
                      value={enrollSearch}
                      onChange={(e) => setEnrollSearch(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <EnrolledGrid rows={filteredEnrolled} />
            </div>
          )}

          {/* ── Reviews — teachers & admins only ──────────────────────── */}
          {!isStudent && (
            <div className="profile-section">
              <p className="reviews-title">Reviews from all courses</p>
              {reviews.length === 0 ? (
                <p className="profile-empty">No reviews yet.</p>
              ) : (
                <div className="profile-reviews-list">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showEditModal && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

export default ProfilePage;
