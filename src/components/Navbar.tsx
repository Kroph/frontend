import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const GradCapIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8L4 16l16 8 16-8-16-8z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
    <path d="M8 18v8c0 0 4 4 12 4s12-4 12-4v-8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 16v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="36" cy="25" r="1.5" fill="white"/>
  </svg>
);

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/verify';
  const isCoursesActive = location.pathname.startsWith('/courses');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <GradCapIcon />
          <div className="navbar-brand-text">
            <span className="brand-cou">Cou</span>
            <span className="brand-teach">Teach</span>
          </div>
        </Link>
        {!isAuth && (
          <div className="navbar-links">
            <Link to="/courses" className={`nav-link ${isCoursesActive ? 'nav-link-active' : ''}`}>Courses</Link>
            <Link to="/" className="nav-link">My Courses</Link>
            <Link to="/" className="nav-link">Make Course</Link>
          </div>
        )}
      </div>
      <div className="navbar-right">
        {!isAuth && (
          <>
            <span className="nav-lang">Eng</span>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/signup" className="btn-signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
