import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api/events';
import { bookingsAPI } from '../api/bookings';
import { waitlistAPI } from '../api/waitlist';
import { reviewsAPI } from '../api/reviews';
import { getUser, isLoggedIn } from '../utils/auth';
import './EventDetailsPage.css';

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ticketCount, setTicketCount] = useState(1);
  const [hold, setHold] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [waitlistStatus, setWaitlistStatus] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);

  const fetchEventData = useCallback(async () => {
    try {
      const data = await eventsAPI.getById(id);
      setEvent(data.data);

      const revRes = await reviewsAPI.getByEvent(id);
      if (revRes.success && revRes.data) {
        setReviews(revRes.data.reviews || []);
        setRatingStats({
          averageRating: Number(revRes.data.stats?.averageRating || 0),
          totalReviews: Number(revRes.data.stats?.totalReviews || 0),
        });
      }

      if (loggedIn) {
        try {
          const wl = await waitlistAPI.getPosition(id);
          if (wl.success && wl.data) {
            setWaitlistPosition(wl.data.position);
            setWaitlistStatus(wl.data.status);
          } else {
            setWaitlistPosition(null);
            setWaitlistStatus(null);
          }
        } catch {
          setWaitlistPosition(null);
          setWaitlistStatus(null);
        }

        try {
          const bks = await bookingsAPI.getUserBookings();
          setBookings(bks.data || []);
        } catch {
          setBookings([]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, loggedIn]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  useEffect(() => {
    if (!hold || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const expires = new Date(hold.expires_at).getTime();
      const remaining = Math.round((expires - Date.now()) / 1000);

      if (remaining <= 0) {
        setTimeLeft(0);
        setHold(null);
        setBookingMessage({ type: 'error', text: 'Seat reservation expired. Please try again.' });
        clearInterval(interval);
        fetchEventData();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hold, timeLeft, fetchEventData]);

  const handleHoldSeats = async () => {
    if (!loggedIn) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      const res = await bookingsAPI.createHold({ eventId: event.id, seatsHeld: Number(ticketCount) });
      setHold(res.data);
      const remaining = Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 300);
      setBookingMessage({ type: 'success', text: 'Seats reserved! Complete your booking within 5 minutes.' });
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!hold) return;

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      await bookingsAPI.create({ holdId: hold.holdId });
      setHold(null);
      setTimeLeft(0);
      setBookingMessage({ type: 'success', text: 'Booking confirmed successfully! You can view it in your dashboard.' });
      fetchEventData();
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelHold = async () => {
    if (!hold) return;

    setBookingLoading(true);
    try {
      await bookingsAPI.cancelHold(hold.holdId);
      setHold(null);
      setTimeLeft(0);
      setBookingMessage({ type: 'info', text: 'Reservation cancelled.' });
      fetchEventData();
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!loggedIn) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      await waitlistAPI.join(event.id);
      setBookingMessage({ type: 'success', text: 'Successfully joined the waitlist!' });
      fetchEventData();
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    setBookingLoading(true);
    setBookingMessage(null);

    try {
      await waitlistAPI.leave(event.id);
      setBookingMessage({ type: 'info', text: 'Left the waitlist.' });
      fetchEventData();
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError(null);
    setBookingLoading(true);

    try {
      await reviewsAPI.create({
        eventId: event.id,
        rating: userReview.rating,
        comment: userReview.comment,
      });
      setUserReview({ rating: 5, comment: '' });
      await fetchEventData();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setBookingLoading(true);
    try {
      await reviewsAPI.delete(reviewId);
      await fetchEventData();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details-loading">
        <div className="loading-spinner" />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-error-page">
        <h2>Error Loading Event</h2>
        <p>{error || 'Event not found'}</p>
        <button onClick={() => navigate('/events')}>Back to Events</button>
      </div>
    );
  }

  const date = new Date(event.event_date);
  const formattedDate = date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const isSoldOut = event.available_seats === 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const userBookedThisEvent = bookings.some(
    b => b.event_id === id && b.booking_status !== 'CANCELLED'
  );
  const eventInPast = new Date(event.event_date) < new Date();
  const alreadyReviewed = reviews.some(r => r.user_id === user?.id);
  const eligibleToReview = userBookedThisEvent && eventInPast && !alreadyReviewed;

  return (
    <div className="event-details-container">
      <div className="event-details-hero">
        <div className="event-details-hero-blur" />
        <div className="event-details-hero-content">
          <div className="event-details-badge">Event Spotlight</div>
          <h1>{event.title}</h1>
          <div className="event-details-quick-meta">
            <span>📍 {event.location}</span>
            <span>📅 {formattedDate} · {formattedTime}</span>
          </div>
        </div>
      </div>

      <div className="event-details-grid">
        <main className="event-details-main">
          <section className="event-details-card desc-card">
            <h2>About Event</h2>
            <p className="event-desc-text">{event.description || 'No description provided for this event.'}</p>
          </section>

          <section className="event-details-card meta-card">
            <h2>Details</h2>
            <div className="details-list">
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <div>
                  <strong>Date & Time</strong>
                  <p>{formattedDate} at {formattedTime}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📍</span>
                <div>
                  <strong>Location</strong>
                  <p>{event.location}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🎟️</span>
                <div>
                  <strong>Capacity</strong>
                  <p>{event.available_seats} of {event.total_seats} seats remaining</p>
                </div>
              </div>
            </div>
          </section>

          <section className="event-details-card reviews-card">
            <h2>Reviews & Ratings</h2>
            
            <div className="reviews-overview">
              <div className="overview-score">
                <div className="score-num">{ratingStats.averageRating || '0.0'}</div>
                <div className="score-label">Average Score</div>
              </div>
              <div className="overview-stats">
                <div className="stars-row">
                  {'★'.repeat(Math.round(ratingStats.averageRating || 0)) + '☆'.repeat(5 - Math.round(ratingStats.averageRating || 0))}
                </div>
                <p>{ratingStats.totalReviews} customer review{ratingStats.totalReviews !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {eligibleToReview && (
              <form onSubmit={handleReviewSubmit} className="write-review-form">
                <h3>Write a Review</h3>
                {reviewError && <div className="booking-alert error">{reviewError}</div>}
                
                <div className="form-star-picker">
                  <span>Rating:</span>
                  <div className="star-picker-btns">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`star-btn ${userReview.rating >= val ? 'active' : ''}`}
                        onClick={() => setUserReview(prev => ({ ...prev, rating: val }))}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-comment-area">
                  <label htmlFor="rev-comment">Comment</label>
                  <textarea
                    id="rev-comment"
                    value={userReview.comment}
                    onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your thoughts about this event..."
                    rows="3"
                    maxLength="500"
                  />
                </div>

                <button type="submit" className="booking-action-btn primary-btn submit-rev-btn">
                  Submit Review
                </button>
              </form>
            )}

            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews have been written for this event yet.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="review-item">
                    <div className="review-item-header">
                      <div className="review-user-info">
                        <span className="user-initials">{rev.username?.[0]?.toUpperCase()}</span>
                        <div>
                          <strong>{rev.username}</strong>
                          <span className="review-date">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="review-stars">
                        {'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    {rev.comment && <p className="review-comment">{rev.comment}</p>}
                    {rev.user_id === user?.id && (
                      <button
                        className="delete-rev-btn"
                        onClick={() => handleDeleteReview(rev.id)}
                      >
                        Delete Review
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="event-details-sidebar">
          <div className="event-details-card booking-card">
            <div className="booking-card-header">
              <span className="ticket-price">
                {event.price === 0 ? 'Free' : `₹${Number(event.price).toLocaleString('en-IN')}`}
              </span>
              <span className={`seats-left-label ${isSoldOut ? 'empty' : ''}`}>
                {isSoldOut ? 'Sold Out' : `${event.available_seats} left`}
              </span>
            </div>

            {bookingMessage && (
              <div className={`booking-alert ${bookingMessage.type}`}>
                {bookingMessage.text}
              </div>
            )}

            {!hold ? (
              <>
                {!isSoldOut ? (
                  <div className="booking-selector-section">
                    <div className="ticket-qty-picker">
                      <label htmlFor="qty">Quantity</label>
                      <select
                        id="qty"
                        value={ticketCount}
                        onChange={(e) => setTicketCount(Number(e.target.value))}
                        disabled={bookingLoading}
                      >
                        {Array.from({ length: Math.min(event.available_seats, 10) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="booking-action-btn primary-btn"
                      onClick={handleHoldSeats}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? 'Reserving...' : 'Book Tickets'}
                    </button>
                  </div>
                ) : (
                  <div className="waitlist-section">
                    <p className="waitlist-info-text">This event is sold out. Join the waitlist to be promoted if seats free up.</p>
                    {waitlistPosition !== null ? (
                      <div className="waitlist-status-box">
                        <div className="waitlist-pos-badge">Position #{waitlistPosition}</div>
                        <p>Status: <strong>{waitlistStatus}</strong></p>
                        <button
                          className="booking-action-btn secondary-btn"
                          onClick={handleLeaveWaitlist}
                          disabled={bookingLoading}
                        >
                          {bookingLoading ? 'Processing...' : 'Leave Waitlist'}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="booking-action-btn accent-btn"
                        onClick={handleJoinWaitlist}
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? 'Joining...' : 'Join Waitlist'}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="hold-active-section">
                <div className="hold-timer-container">
                  <span className="hold-timer-label">Seat hold expires in</span>
                  <div className="hold-timer">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="hold-details-summary">
                  <p>Tickets Reserved: <strong>{ticketCount}</strong></p>
                  <p>Total: <strong>₹{(ticketCount * Number(event.price)).toLocaleString('en-IN')}</strong></p>
                </div>

                <div className="hold-actions">
                  <button
                    className="booking-action-btn primary-btn"
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Processing...' : 'Pay & Confirm'}
                  </button>
                  <button
                    className="booking-action-btn secondary-btn"
                    onClick={handleCancelHold}
                    disabled={bookingLoading}
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
