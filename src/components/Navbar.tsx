import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../api/auth';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/verify';
  const loggedIn = isAuthenticated();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            {loggedIn ? (
              <>
                <Link to="/profile" className="nav-link" title="Profile">Profile</Link>
                <button className="btn-login" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-signup">Sign Up</Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;