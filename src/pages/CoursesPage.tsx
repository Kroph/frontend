import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCourses, Course } from '../api/courses';
import './css/CoursesPage.css';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES = ['All', 'Web Development','Mobile Development','Design','Mathematics','Science'];

const MOCK_COURSES: Course[] = [
  { id: '1', title: 'Introduction to React', description: 'Learn React from scratch', teacherId: 't1', teacherName: 'Alice Johnson', category: 'Technology', level: 'Beginner', published: true, createdAt: '', updatedAt: '', rating: 4.7 },
  { id: '2', title: 'Advanced TypeScript', description: 'Deep dive into TypeScript', teacherId: 't2', teacherName: 'Bob Smith', category: 'Technology', level: 'Advanced', published: true, createdAt: '', updatedAt: '', rating: 4.9 },
  { id: '3', title: 'UI/UX Design Principles', description: 'Master design thinking', teacherId: 't3', teacherName: 'Carol White', category: 'Design', level: 'Intermediate', published: true, createdAt: '', updatedAt: '', rating: 4.5 },
  { id: '4', title: 'Spring Boot Mastery', description: 'Build production-grade APIs', teacherId: 't4', teacherName: 'David Lee', category: 'Technology', level: 'Intermediate', published: true, createdAt: '', updatedAt: '', rating: 4.8 },
  { id: '5', title: 'Business Strategy', description: 'Grow your business', teacherId: 't5', teacherName: 'Emma Davis', category: 'Business', level: 'Beginner', published: true, createdAt: '', updatedAt: '', rating: 4.3 },
  { id: '6', title: 'Data Science with Python', description: 'ML and data analysis', teacherId: 't6', teacherName: 'Frank Chen', category: 'Science', level: 'Intermediate', published: true, createdAt: '', updatedAt: '', rating: 4.6 },
  { id: '7', title: 'Graphic Design Fundamentals', description: 'Visual communication basics', teacherId: 't7', teacherName: 'Grace Kim', category: 'Design', level: 'Beginner', published: true, createdAt: '', updatedAt: '', rating: 4.4 },
  { id: '8', title: 'MongoDB & NoSQL', description: 'Database design patterns', teacherId: 't8', teacherName: 'Henry Park', category: 'Technology', level: 'Advanced', published: true, createdAt: '', updatedAt: '', rating: 4.7 },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <span className="star-rating">
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      <span className="rating-num"> {rating.toFixed(1)}</span>
    </span>
  );
};

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then(res => setCourses(res.data))
      .catch(() => setCourses(MOCK_COURSES))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacherName || '').toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'All' || c.level === levelFilter;
    const matchCat = categoryFilter === 'All' || c.category === categoryFilter;
    return matchSearch && matchLevel && matchCat;
  });

  return (
    <div className="courses-page">
      <Navbar />

      {/* Search & Filter bar */}
      <div className="courses-toolbar">
        <div className="toolbar-right">
          <div className="search-area">
            {showSearch && (
              <input
                className="search-input"
                type="text"
                placeholder="Search courses or educators..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            )}
            <button
              className="toolbar-btn search-btn"
              onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(''); }}
            >
              <span className="toolbar-label">Search</span>
            </button>
          </div>
          <button
            className={`toolbar-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(s => !s)}
          >
            <span className="toolbar-label">Filters</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <span className="filter-group-label">Level</span>
            <div className="filter-chips">
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={`filter-chip ${levelFilter === l ? 'active' : ''}`}
                  onClick={() => setLevelFilter(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-group-label">Category</span>
            <div className="filter-chips">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`filter-chip ${categoryFilter === c ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Courses grid */}
      <div className="courses-container">
        {loading ? (
          <div className="courses-loading">Loading courses...</div>
        ) : filtered.length === 0 ? (
          <div className="courses-empty">No courses found.</div>
        ) : (
          <div className="courses-grid">
            {filtered.map(course => (
              <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
                <p className="course-topic">{course.title}</p>
                <div className="course-thumbnail">
                  {course.thumbnail
                    ? <img src={`http://localhost:8080/files?path=${course.thumbnail}`} alt={course.title} />
                    : <span className="thumb-placeholder">Introduction Picture or Video</span>
                  }
                </div>
                <p className="course-educator">{course.teacherName || 'Educator'}</p>
                <div className="course-footer">
                  <span className="course-rate">
                    {course.rating ? <StarRating rating={course.rating} /> : 'No rating'}
                  </span>
                  <span className="course-btn-enroll">
                    Enroll
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
