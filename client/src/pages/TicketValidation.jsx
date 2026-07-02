import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiCalendar, HiLocationMarker, HiUser, HiTicket } from 'react-icons/hi';
import './TicketValidation.css';

function TicketValidation() {
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const validateTicket = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/validate/${bookingId}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Verification failed');
        }
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    validateTicket();
  }, [bookingId]);

  return (
    <div className="validation-container">
      <div className="validation-card">
        {loading ? (
          <div className="validation-spinner-container">
            <div className="validation-spinner" />
            <p>Verifying ticket authenticity...</p>
          </div>
        ) : error ? (
          <div className="validation-status validation-error">
            <HiXCircle className="status-icon error-icon" />
            <h2>Verification Failed</h2>
            <p className="error-message">{error}</p>
            <Link to="/" className="validation-back-btn">Go to Homepage</Link>
          </div>
        ) : !data?.valid ? (
          <div className="validation-status validation-error">
            <HiXCircle className="status-icon error-icon" />
            <h2>Invalid Ticket</h2>
            <p className="error-message">{data?.message || 'This ticket is invalid or cancelled.'}</p>
            <Link to="/" className="validation-back-btn">Go to Homepage</Link>
          </div>
        ) : (
          <div className="validation-status validation-success">
            <HiCheckCircle className="status-icon success-icon" />
            <h2>Ticket Verified!</h2>
            <p className="success-tagline">This ticket is authentic and active</p>
            
            <div className="validation-details">
              <div className="detail-item">
                <HiTicket className="detail-icon" />
                <div>
                  <label>Event Name</label>
                  <span>{data.eventTitle}</span>
                </div>
              </div>

              <div className="detail-item">
                <HiUser className="detail-icon" />
                <div>
                  <label>Attendee Name</label>
                  <span>{data.username}</span>
                </div>
              </div>

              <div className="detail-item">
                <HiCalendar className="detail-icon" />
                <div>
                  <label>Event Date</label>
                  <span>{new Date(data.eventDate).toLocaleString()}</span>
                </div>
              </div>

              <div className="detail-item">
                <HiLocationMarker className="detail-icon" />
                <div>
                  <label>Venue Location</label>
                  <span>{data.location}</span>
                </div>
              </div>

              <div className="detail-item">
                <HiTicket className="detail-icon" />
                <div>
                  <label>Seats Reserved</label>
                  <span className="seats-count-badge">{data.ticketCount} {data.ticketCount === 1 ? 'Ticket' : 'Tickets'}</span>
                </div>
              </div>
            </div>

            <Link to="/" className="validation-back-btn">Go to Homepage</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketValidation;
