import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCourses, Course } from '../api/courses';
import { getProfile, getMyReviews, updateProfile, UserProfile, Review } from '../api/profile';
import { isAuthenticated, getUserRole } from '../api/auth';
import './css/ProfilePage.css';

const MOCK_PROFILE: UserProfile = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  bio: 'Passionate educator & lifelong learner. Building great courses one lesson at a time.',
  socialLinks: {
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
  courseCount: 5,
  enrolledCount: 12,
  role: 'student',
};

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    reviewerName: 'Maria S.',
    rating: 5,
    comment: 'Outstanding course! Explained everything clearly and the examples were spot on.',
    courseTitle: 'Introduction to React',
    createdAt: '2024-11-10',
  },
  {
    id: 'r2',
    reviewerName: 'James T.',
    rating: 4,
    comment: 'Very well structured. I learned a lot in a short amount of time.',
    courseTitle: 'Advanced TypeScript',
    createdAt: '2024-12-03',
  },
];

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Introduction to React',
    description: 'Learn React from scratch',
    teacherId: 'u1',
    teacherName: 'Alex Johnson',
    category: 'Technology',
    level: 'Beginner',
    published: true,
    createdAt: '',
    updatedAt: '',
    price: 49,
    rating: 4.7,
  },
  {
    id: '2',
    title: 'Advanced TypeScript',
    description: 'Deep dive into TypeScript',
    teacherId: 'u1',
    teacherName: 'Alex Johnson',
    category: 'Technology',
    level: 'Advanced',
    published: true,
    createdAt: '',
    updatedAt: '',
    price: 79,
    rating: 4.9,
  },
  {
    id: '3',
    title: 'UI/UX Design Principles',
    description: 'Master design thinking',
    teacherId: 'u1',
    teacherName: 'Alex Johnson',
    category: 'Design',
    level: 'Intermediate',
    published: true,
    createdAt: '',
    updatedAt: '',
    price: 59,
    rating: 4.5,
  },
];

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
        <div className="review-avatar">
          {initials}
        </div>
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
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [twitter, setTwitter] = useState(profile.socialLinks?.twitter || '');
  const [linkedin, setLinkedin] = useState(profile.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(profile.socialLinks?.github || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      bio,
      socialLinks: { twitter, linkedin, github },
    });
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

        {/* Teacher application — only show if not already qualified */}
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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, coursesRes, reviewsRes] = await Promise.allSettled([
          getProfile(),
          getCourses(),
          getMyReviews(),
        ]);

        setProfile(
          profileRes.status === 'fulfilled' ? profileRes.value.data : MOCK_PROFILE
        );
        setCourses(
          coursesRes.status === 'fulfilled' ? coursesRes.value.data.content : MOCK_COURSES
        );
        setReviews(
          reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : MOCK_REVIEWS
        );
      } catch {
        setProfile(MOCK_PROFILE);
        setCourses(MOCK_COURSES);
        setReviews(MOCK_REVIEWS);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    try {
      await updateProfile(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch {
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const socialEntries = Object.entries(profile?.socialLinks || {}).filter(
    ([, url]) => !!url
  );

  const socialLabel: Record<string, string> = {
    twitter: '𝕏',
    linkedin: 'in',
    github: 'gh',
    website: '🌐',
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

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-body">
        <aside className="profile-sidebar">
          {/* Avatar */}
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

          {/* Name */}
          <p className="profile-name">{profile?.name || 'Name'}</p>

          {/* Qualified Teacher Badge */}
          {(['teacher', 'educator', 'TEACHER', 'EDUCATOR'].includes(getUserRole() ?? '')) && (
            <div className="teacher-badge">
              <span className="teacher-badge-check">✓</span>
              <span className="teacher-badge-label">Qualified Teacher</span>
            </div>
          )}

          {/* Social links */}
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
            <p className="profile-bio" style={{ opacity: 0.5 }}>
              Social media links
            </p>
          )}

          {/* Bio */}
          <p className="profile-bio">{profile?.bio || 'Short Introduction'}</p>

          {/* Stats */}
          <div className="profile-stat-row">
            <p className="profile-stat">
              <span>{profile?.courseCount ?? courses.length}</span> courses created
            </p>
            <p className="profile-stat">
              <span>{profile?.enrolledCount ?? 0}</span> enrolled courses
            </p>
          </div>

          {/* Edit button */}
          <button className="profile-edit-btn" onClick={() => setShowEditModal(true)}>
            Edit Profile
          </button>
        </aside>

        <main className="profile-main">
          {/* Courses section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="courses-toolbar-row">
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
                <button
                  className="toolbar-filter-btn"
                  title="Search"
                  onClick={() => {
                    setShowSearch((s) => !s);
                    if (showSearch) setSearch('');
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <p className="profile-empty">No courses found.</p>
            ) : (
              <div className="profile-courses-grid">
                {filteredCourses.map((course) => (
                  <Link
                    to={`/courses/${course.id}`}
                    key={course.id}
                    className="profile-course-card"
                  >
                    <p className="pcc-topic">{course.title}</p>
                    <div className="pcc-thumbnail">
                      {course.thumbnail ? (
                        <img
                          src={`http://localhost:8080/files?path=${course.thumbnail}`}
                          alt={course.title}
                        />
                      ) : (
                        <span className="pcc-thumb-placeholder">
                          Introduction Picture or Video
                        </span>
                      )}
                    </div>
                    <p className="pcc-educator">{course.teacherName || 'Educator'}</p>
                    <div className="pcc-footer">
                      <span className="pcc-rate">
                        {course.rating ? (
                          <>
                            <StarRating rating={course.rating} /> {course.rating.toFixed(1)}
                          </>
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

          {/* Reviews section */}
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
        </main>
      </div>

      {/* Edit modal */}
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
