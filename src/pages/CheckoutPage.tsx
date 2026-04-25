import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  createPaypalOrder,
  capturePaypalOrder,
  createSubscription,
  confirmSubscription,
  enrollFree,
} from '../api';
import { getCourseById, Course } from '../api/courses';
import { isAuthenticated } from '../api/auth';
import './css/CheckoutPage.css';

const MOCK_COURSE: Course = {
  id: '1',
  title: 'Introduction to React',
  description: 'Learn React from scratch with hands-on projects.',
  teacherId: 't1',
  teacherName: 'Alice Johnson',
  category: 'Technology',
  level: 'Beginner',
  published: true,
  createdAt: '',
  updatedAt: '',
  price: 49,
  rating: 4.7,
};

type Step = 'choose' | 'redirect' | 'capturing' | 'success' | 'error';

const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('choose');
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'one-time' | 'subscription' | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCourseById(id)
      .then((res) => setCourse(res.data))
      .catch(() => setCourse({ ...MOCK_COURSE, id }))
      .finally(() => setLoading(false));
  }, [id]);

  // PayPal redirects back with ?token=ORDER_ID&PayerID=... for orders
  // and ?subscription_id=... for subscriptions.
  useEffect(() => {
    const orderToken = params.get('token');
    const subscriptionId = params.get('subscription_id');

    if (orderToken) {
      setStep('capturing');
      capturePaypalOrder(orderToken)
        .then(() => setStep('success'))
        .catch((err) => {
          setErrorMsg(err?.response?.data?.message || 'Could not capture payment.');
          setStep('error');
        });
    } else if (subscriptionId) {
      setStep('capturing');
      confirmSubscription(subscriptionId)
        .then(() => setStep('success'))
        .catch((err) => {
          setErrorMsg(err?.response?.data?.message || 'Could not confirm subscription.');
          setStep('error');
        });
    }
  }, [params]);

  const handleOneTime = async () => {
    if (!id) return;
    setMode('one-time');
    setStep('redirect');
    setErrorMsg('');
    try {
      const res = await createPaypalOrder(id);
      window.location.href = res.data.approveUrl;
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not start PayPal checkout.');
      setStep('error');
    }
  };

  const handleSubscribe = async () => {
    setMode('subscription');
    setStep('redirect');
    setErrorMsg('');
    try {
      const res = await createSubscription();
      window.location.href = res.data.approvalUrl;
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not start subscription.');
      setStep('error');
    }
  };

  const handleFreeEnroll = async () => {
    if (!id) return;
    setStep('capturing');
    try {
      await enrollFree(id);
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not enroll. The course may not be free.');
      setStep('error');
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <Navbar />
        <p className="ck-loading">Loading checkout...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="checkout-page">
        <Navbar />
        <p className="ck-loading">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="ck-container">
        <button className="ck-back" onClick={() => navigate(`/courses/${course.id}`)}>
          ← Back to course
        </button>

        <div className="ck-card">
          {step === 'choose' && (
            <>
              <h1 className="ck-title">Checkout</h1>
              <div className="ck-summary">
                <div className="ck-summary-row">
                  <span>Course</span>
                  <b>{course.title}</b>
                </div>
                <div className="ck-summary-row">
                  <span>Educator</span>
                  <span>{course.teacherName || 'Educator'}</span>
                </div>
                <div className="ck-summary-row total">
                  <span>Price</span>
                  <b>{course.price ? `$${course.price}` : 'Free'}</b>
                </div>
              </div>

              {course.price ? (
                <div className="ck-options">
                  <button className="ck-pay-btn ck-paypal" onClick={handleOneTime}>
                    <span className="ck-paypal-logo">PayPal</span>
                    <span>Pay ${course.price}</span>
                  </button>

                  <div className="ck-divider"><span>or</span></div>

                  <div className="ck-sub-card">
                    <div>
                      <h3>Subscribe & access everything</h3>
                      <p>One subscription unlocks every paid course on the platform.</p>
                    </div>
                    <button className="ck-sub-btn" onClick={handleSubscribe}>
                      Start subscription
                    </button>
                  </div>
                </div>
              ) : (
                <button className="ck-pay-btn" onClick={handleFreeEnroll}>
                  Enroll for free
                </button>
              )}

              <p className="ck-fineprint">
                Payments are processed securely by PayPal. You can cancel a subscription at any time.
              </p>
            </>
          )}

          {step === 'redirect' && (
            <div className="ck-state">
              <div className="ck-spinner" />
              <h2>Redirecting to PayPal...</h2>
              <p>If nothing happens in a few seconds, please refresh.</p>
            </div>
          )}

          {step === 'capturing' && (
            <div className="ck-state">
              <div className="ck-spinner" />
              <h2>Confirming your {mode === 'subscription' ? 'subscription' : 'payment'}...</h2>
              <p>Hold on a moment.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="ck-state success">
              <div className="ck-success-icon">✓</div>
              <h2>You're enrolled!</h2>
              <p>You now have full access to <b>{course.title}</b>.</p>
              <div className="ck-success-actions">
                <button
                  className="ck-pay-btn"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  Start learning
                </button>
                <button
                  className="ck-secondary-btn"
                  onClick={() => navigate('/my-enrollments')}
                >
                  My courses
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="ck-state error">
              <div className="ck-error-icon">!</div>
              <h2>Something went wrong</h2>
              <p>{errorMsg}</p>
              <button className="ck-pay-btn" onClick={() => setStep('choose')}>
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
