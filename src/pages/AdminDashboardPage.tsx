import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  getAdminStats,
  getAdminUsers,
  deleteAdminUser,
  getPendingApplications,
  approveApplication,
  rejectApplication,
  AdminStats,
  AdminUser,
  TeacherApplicationDetail,
} from '../api';
import { isAuthenticated } from '../api/auth';
import './css/AdminDashboardPage.css';

const MOCK_STATS: AdminStats = {
  totalUsers: 1247,
  totalStudents: 1189,
  totalTeachers: 56,
  totalCourses: 87,
  totalEnrollments: 3421,
  totalRevenue: 28450.5,
};

const MOCK_USERS: AdminUser[] = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'STUDENT',
    enabled: true,
    teacherApproved: false,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'u2',
    name: 'Maria Singh',
    email: 'maria@example.com',
    role: 'TEACHER',
    enabled: true,
    teacherApproved: true,
    createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
  },
  {
    id: 'u3',
    name: 'Admin',
    email: 'admin@couteach.com',
    role: 'ADMIN',
    enabled: true,
    teacherApproved: false,
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
];

const MOCK_APPS: TeacherApplicationDetail[] = [
  {
    id: 'app-1',
    userId: 'u4',
    fullName: 'Sarah Wilson',
    email: 'sarah@example.com',
    specialization: 'Frontend Development',
    yearsOfExperience: 5,
    status: 'PENDING',
    score: 87,
    aiSummary:
      'Strong frontend background with React, Vue, and modern tooling. Has open-source contributions.',
    aiStrengths: 'React, TypeScript, Web performance, Accessibility',
    aiWeaknesses: 'Limited backend experience',
    aiRecommendation: 'Recommended for approval — solid teaching potential.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<'overview' | 'users' | 'applications'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [apps, setApps] = useState<TeacherApplicationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewModal, setReviewModal] = useState<TeacherApplicationDetail | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [sRes, uRes, aRes] = await Promise.allSettled([
        getAdminStats(),
        getAdminUsers(),
        getPendingApplications(),
      ]);
      setStats(sRes.status === 'fulfilled' ? sRes.value.data : MOCK_STATS);
      setUsers(uRes.status === 'fulfilled' ? uRes.value.data : MOCK_USERS);
      setApps(aRes.status === 'fulfilled' ? aRes.value.data : MOCK_APPS);
      setLoading(false);
    };
    load();
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete ${name}?`)) return;
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Could not delete user.');
    }
  };

  const handleApprove = async (appId: string, comment?: string) => {
    try {
      await approveApplication(appId, comment);
    } catch {
    }
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setReviewModal(null);
  };

  const handleReject = async (appId: string, comment?: string) => {
    try {
      await rejectApplication(appId, comment);
    } catch {
    }
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setReviewModal(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <Navbar />
      <div className="adm-container">
        <header className="adm-header">
          <h1>Admin dashboard</h1>
          <p className="adm-sub">Manage users, applications, and watch platform health.</p>
        </header>

        <div className="adm-tabs">
          <button
            className={`adm-tab ${tab === 'overview' ? 'active' : ''}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            className={`adm-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users ({users.length})
          </button>
          <button
            className={`adm-tab ${tab === 'applications' ? 'active' : ''}`}
            onClick={() => setTab('applications')}
          >
            Applications ({apps.length})
          </button>
        </div>

        {loading ? (
          <p className="adm-empty">Loading...</p>
        ) : tab === 'overview' && stats ? (
          <div className="adm-stats-grid">
            <div className="adm-stat-card">
              <p className="adm-stat-label">Total users</p>
              <p className="adm-stat-value">{stats.totalUsers.toLocaleString()}</p>
              <p className="adm-stat-foot">
                {stats.totalStudents} students · {stats.totalTeachers} teachers
              </p>
            </div>
            <div className="adm-stat-card">
              <p className="adm-stat-label">Courses</p>
              <p className="adm-stat-value">{stats.totalCourses.toLocaleString()}</p>
              <p className="adm-stat-foot">Published</p>
            </div>
            <div className="adm-stat-card">
              <p className="adm-stat-label">Enrollments</p>
              <p className="adm-stat-value">{stats.totalEnrollments.toLocaleString()}</p>
              <p className="adm-stat-foot">All-time</p>
            </div>
            <div className="adm-stat-card highlight">
              <p className="adm-stat-label">Revenue</p>
              <p className="adm-stat-value">{formatMoney(stats.totalRevenue)}</p>
              <p className="adm-stat-foot">From captured payments</p>
            </div>
          </div>
        ) : tab === 'users' ? (
          <>
            <input
              className="adm-search"
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="adm-table">
              <div className="adm-table-head">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Joined</span>
                <span></span>
              </div>
              {filteredUsers.length === 0 ? (
                <p className="adm-empty">No users match.</p>
              ) : (
                filteredUsers.map((u) => (
                  <div key={u.id} className="adm-table-row">
                    <span className="adm-name">{u.name}</span>
                    <span className="adm-email">{u.email}</span>
                    <span>
                      <span className={`adm-role role-${u.role.toLowerCase()}`}>{u.role}</span>
                    </span>
                    <span className={u.enabled ? 'adm-on' : 'adm-off'}>
                      {u.enabled ? '● Active' : '○ Disabled'}
                    </span>
                    <span className="adm-mono">{formatDate(u.createdAt)}</span>
                    <span>
                      {u.role !== 'ADMIN' && (
                        <button
                          className="adm-danger-btn"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                        >
                          Delete
                        </button>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="adm-apps-list">
            {apps.length === 0 ? (
              <p className="adm-empty">No pending applications.</p>
            ) : (
              apps.map((a) => (
                <div key={a.id} className="adm-app-card">
                  <div className="adm-app-head">
                    <div>
                      <h3>{a.fullName}</h3>
                      <p className="adm-app-meta">
                        {a.email} · {a.specialization} · {a.yearsOfExperience}yr
                      </p>
                    </div>
                    {a.score !== undefined && (
                      <div className="adm-app-score">
                        <span>{a.score}</span>
                        <small>AI score</small>
                      </div>
                    )}
                  </div>
                  {a.aiSummary && <p className="adm-app-summary">{a.aiSummary}</p>}
                  <div className="adm-app-actions">
                    <button
                      className="adm-secondary-btn"
                      onClick={() => setReviewModal(a)}
                    >
                      Review
                    </button>
                    <button
                      className="adm-approve-btn"
                      onClick={() => handleApprove(a.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="adm-danger-btn"
                      onClick={() => handleReject(a.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {reviewModal && (
        <ReviewModal
          app={reviewModal}
          onClose={() => setReviewModal(null)}
          onApprove={(c) => handleApprove(reviewModal.id, c)}
          onReject={(c) => handleReject(reviewModal.id, c)}
        />
      )}
    </div>
  );
};

interface ReviewModalProps {
  app: TeacherApplicationDetail;
  onClose: () => void;
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ app, onClose, onApprove, onReject }) => {
  const [comment, setComment] = useState('');
  return (
    <div className="adm-modal-bg" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{app.fullName}</h2>
        <p className="adm-app-meta">
          {app.email} · {app.specialization} · {app.yearsOfExperience}yr
        </p>

        {app.score !== undefined && (
          <div className="adm-modal-score">
            <p>AI screening score</p>
            <h3>{app.score} / 100</h3>
          </div>
        )}

        {app.aiSummary && (
          <section>
            <h4>Summary</h4>
            <p>{app.aiSummary}</p>
          </section>
        )}
        {app.aiStrengths && (
          <section>
            <h4>Strengths</h4>
            <p>{app.aiStrengths}</p>
          </section>
        )}
        {app.aiWeaknesses && (
          <section>
            <h4>Weaknesses</h4>
            <p>{app.aiWeaknesses}</p>
          </section>
        )}
        {app.aiRecommendation && (
          <section>
            <h4>Recommendation</h4>
            <p>{app.aiRecommendation}</p>
          </section>
        )}

        <textarea
          className="adm-modal-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional review comment..."
        />

        <div className="adm-modal-actions">
          <button className="adm-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="adm-danger-btn" onClick={() => onReject(comment.trim() || undefined)}>
            Reject
          </button>
          <button className="adm-approve-btn" onClick={() => onApprove(comment.trim() || undefined)}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
