import React, { useState } from 'react';
import { CourseDraft, CreateCoursePayload } from '../../types/createCourse';
import { createCourse } from '../../api/createCourse';

interface Props {
  draft: CourseDraft;
  updateDraft: (patch: Partial<CourseDraft>) => void;
  toast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
  onBack: () => void;
  onDone: () => void;
}

// ─── Build the API payload from draft state ────────────────────────────────
const buildPayload = (draft: CourseDraft, visibility: 'draft' | 'published'): CreateCoursePayload => ({
  title:          draft.title,
  description:    draft.description,
  category:       draft.category,
  level:          draft.level,
  published:      visibility === 'published',
  thumbnail:      draft.thumbnail.length < 12 ? draft.thumbnail : '[image]',
  estimatedHours: draft.duration ? parseInt(draft.duration, 10) : null,
  tags:           draft.tags,
  lessons:        draft.lessons.map((l, i) => ({
    title:              l.title,
    description:        l.description,
    orderIndex:         i + 1,
    duration:           l.duration ? parseInt(l.duration, 10) : null,
    contentType:        l.contentType,
    lectureText:        l.text     || null,
    videoUrl:           l.videoUrl || null,
    videoFileName:      l.videoFileName || null,
    lecturePdfFileName: l.pdfFileName  || null,
    quiz:               l.quiz.map(q => ({
      question:     q.text,
      answers:      [...q.answers],
      correctIndex: q.correct,
    })),
  })),
});

const StepPublish: React.FC<Props> = ({ draft, updateDraft, toast, onBack, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const payload  = buildPayload(draft, draft.visibility);
  const totalQ   = draft.lessons.reduce((s, l) => s + l.quiz.length, 0);
  const totalMin = draft.lessons.reduce((s, l) => s + (parseInt(l.duration || '0', 10) || 0), 0);

  const handlePublish = async () => {
    setLoading(true);
    try {
      await createCourse(payload);
      setSubmitted(true);
      toast('🎉 Course created successfully!', 'ok');
      if (draft.lessons.length) toast(`${draft.lessons.length} lesson(s) sent to API`);
      setTimeout(onDone, 1500);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to create course', 'err');
    } finally {
      setLoading(false);
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      .then(() => toast('JSON copied ✓'));
  };

  const reviewRows: [string, string, boolean][] = [
    ['Title',       draft.title       || '—', !draft.title],
    ['Category',    draft.category    || '—', !draft.category],
    ['Description', draft.description ? draft.description.slice(0, 70) + '…' : '—', !draft.description],
    ['Tags',        draft.tags.length  ? draft.tags.join(', ') : '—', !draft.tags.length],
    ['Duration',    draft.duration     ? `${draft.duration} hrs`        : '—', !draft.duration],
  ];

  return (
    <>
      {/* ── Summary stats ── */}
      <div className="cc-summary-grid">
        {[
          { label: 'Lessons',        val: draft.lessons.length },
          { label: 'Quiz questions', val: totalQ },
          { label: 'Total duration', val: totalMin ? `${totalMin}min` : '—' },
          { label: 'Level',          val: draft.level || '—' },
        ].map(({ label, val }) => (
          <div key={label} className="cc-stat">
            <div className="cc-stat-label">{label}</div>
            <div className={`cc-stat-val ${String(val).length > 6 ? 'cc-stat-val--sm' : ''}`}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* ── Review card ── */}
      <div className="cc-card">
        <div className="cc-card-head">
          <div className="cc-card-head-left">
            <span className="cc-card-icon">📋</span>
            <div>
              <div className="cc-card-label">Review</div>
              <div className="cc-card-desc">Check everything before publishing</div>
            </div>
          </div>
          <button className="cc-btn cc-btn--outline cc-btn--sm" onClick={onBack}>
            Edit ↗
          </button>
        </div>

        <div className="cc-card-body" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          {reviewRows.map(([key, val, dim]) => (
            <div key={key} className="cc-review-row">
              <span className="cc-review-key">{key}</span>
              <span className={`cc-review-val ${dim ? 'cc-review-val--dim' : ''}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Visibility ── */}
      <div className="cc-card">
        <div className="cc-card-head">
          <div className="cc-card-head-left">
            <span className="cc-card-icon">◈</span>
            <div>
              <div className="cc-card-label">Visibility</div>
              <div className="cc-card-desc">Who can see this course</div>
            </div>
          </div>
        </div>

        <div className="cc-card-body">
          <div className="cc-level-picker" style={{ maxWidth: 320 }}>
            {(['draft', 'published'] as const).map(mode => (
              <div
                key={mode}
                className={`cc-level-opt ${draft.visibility === mode ? 'cc-level-opt--active' : ''}`}
                onClick={() => updateDraft({ visibility: mode })}
              >
                <span className="cc-level-em">{mode === 'draft' ? '🔒' : '🌐'}</span>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {draft.visibility === 'draft'
              ? 'Draft courses are only visible to you. You can publish anytime from your dashboard.'
              : 'This course will be publicly visible to all students immediately after creation.'}
          </div>
        </div>
      </div>

      {/* ── JSON preview ── */}
      <div className="cc-card">
        <div className="cc-card-head">
          <div className="cc-card-head-left">
            <span className="cc-card-icon" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{ }</span>
            <div>
              <div className="cc-card-label">API payload</div>
              <div className="cc-card-desc">
                Sent to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>POST /courses</code>
              </div>
            </div>
          </div>
          <button className="cc-btn cc-btn--outline cc-btn--sm" onClick={copyJSON}>
            Copy JSON
          </button>
        </div>

        <div className="cc-card-body" style={{ padding: 0 }}>
          <pre className="cc-json">{JSON.stringify(payload, null, 2)}</pre>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="cc-actions">
        <button className="cc-btn cc-btn--outline" onClick={onBack}>← Lessons</button>
        <div className="cc-actions-right">
          <button
            className="cc-btn cc-btn--accent"
            onClick={handlePublish}
            disabled={loading || submitted}
          >
            {loading ? '⏳ Creating…' : submitted ? '✓ Created!' : '🚀 Create course'}
          </button>
        </div>
      </div>
    </>
  );
};

export default StepPublish;
