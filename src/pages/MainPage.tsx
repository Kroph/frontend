import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './MainPage.css';

const GradCapLarge: React.FC = () => (
  <svg width="360" height="280" viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M180 40L20 120l160 80 160-80L180 40z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M60 140v70c0 0 30 36 120 36s120-36 120-36v-70" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M320 120v55" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="320" cy="182" rx="10" ry="6" fill="white"/>
  </svg>
);

const MainPage: React.FC = () => {
  return (
    <div className="main-page">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-graphic">
            <GradCapLarge />
          </div>
          <div className="hero-text">
            <h1 className="hero-title">CouTeach</h1>
            <p className="hero-subtitle">Educational Content<br />Distribution Platform</p>
            <p className="hero-description">
              Connect learners with expert educators. Browse courses, watch lessons,
              take quizzes, and grow your skills — or share your expertise with the world.
            </p>
            <div className="hero-cta">
              <Link to="/signup" className="cta-primary">Get Started</Link>
              <Link to="/login" className="cta-secondary">Already have an account?</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p> CouTeach — Educational Content Distribution Platform</p>
        <p className="footer-sub">Built with Spring Boot · MongoDB · React</p>
      </footer>
    </div>
  );
};

export default MainPage;
