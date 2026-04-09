import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/verify';
  const isCoursesActive = location.pathname.startsWith('/courses');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-text">
            <span className="brand-cou">Cou</span>
            <span className="brand-teach">Teach</span>
          </div>
        </Link>
        {!isAuth && (
          <div className="navbar-links">
            <Link to="/courses" className={`nav-link`}>Courses</Link>
            <Link to="/" className="nav-link">My Courses</Link>
            <Link to="/courses/create" className="nav-link">Make Course</Link>
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