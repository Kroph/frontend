import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  getMyEnrollments,
  getCourseProgress,
  getCertificate,
  Certificate,
  CourseProgress,
} from '../api';
import { getCourseById, Course } from '../api/courses';
import { isAuthenticated } from '../api/auth';
import './css/CertificatePage.css';

interface Row {
  cert: Certificate;
  course: Course | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const MyCertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const enrRes = await getMyEnrollments();
        const enrollments = enrRes.data || [];

        const progresses = await Promise.all(
          enrollments.map((e) =>
            getCourseProgress(e.courseId)
              .then((r) => r.data)
              .catch(() => null)
          )
        );

        const completed = progresses.filter(
          (p): p is CourseProgress => !!p && p.completed && !!p.certificateId
        );

        const expanded = await Promise.all(
          completed.map(async (p): Promise<Row | null> => {
            const [cRes, certRes] = await Promise.allSettled([
              getCourseById(p.courseId),
              getCertificate(p.certificateId!),
            ]);
            if (certRes.status !== 'fulfilled') return null;
            return {
              cert: certRes.value.data,
              course: cRes.status === 'fulfilled' ? cRes.value.data : null,
            };
          })
        );

        setRows(expanded.filter((r): r is Row => r !== null));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="cert-page">
      <Navbar />
      <div className="cert-container">
        <header className="cert-header">
          <h1>My certificates</h1>
          <p className="cert-sub">
            Earn a certificate by completing every lesson and required quiz in a course.
          </p>
        </header>

        {loading ? (
          <p className="cert-empty">Loading certificates...</p>
        ) : rows.length === 0 ? (
          <div className="cert-empty-card">
            <p className="cert-empty">You haven't earned any certificates yet.</p>
            <Link to="/my-enrollments" className="cert-browse-btn">
              View my courses
            </Link>
          </div>
        ) : (
          <div className="cert-grid">
            {rows.map((r) => (
              <div key={r.cert.id} className="cert-mini">
                <h3>{r.cert.courseTitle || r.course?.title || 'Course'}</h3>
                <p className="cert-mini-meta">{r.course?.teacherName || 'Educator'}</p>
                <p className="cert-mini-date">Issued {formatDate(r.cert.issuedAt)}</p>
                <div className="cert-mini-actions">
                  <Link
                    to={`/certificates/verify/${r.cert.verificationCode}`}
                    className="cert-mini-btn"
                  >
                    View
                  </Link>
                  {r.cert.pdfUrl && (
                    <a
                      className="cert-mini-btn"
                      href={r.cert.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCertificatesPage;
