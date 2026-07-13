import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout, getToken, setAuth } from '../utils/auth';
import { authAPI } from '../api/auth';
import { bookingsAPI } from '../api/bookings';
import { rolesAPI } from '../api/roles';
import { eventsAPI } from '../api/events';
import { waitlistAPI } from '../api/waitlist';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('dashboard_tab') || 'bookings');

  useEffect(() => {
    sessionStorage.setItem('dashboard_tab', activeTab);
  }, [activeTab]);
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  
  const [roleRequestStatus, setRoleRequestStatus] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    price: 0,
    total_seats: 10,
    category: 'General',
  });

  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });
  const [settingsError, setSettingsError] = useState(null);
  const [settingsSuccess, setSettingsSuccess] = useState(null);

  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterEvent, setRosterEvent] = useState(null);
  const [rosterData, setRosterData] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [customAlert, setCustomAlert] = useState({ show: false, title: '', message: '', onConfirm: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await authAPI.getProfile();
      if (profileRes.success && profileRes.user) {
        const localUser = getUser();
        if (localUser && localUser.role !== profileRes.user.role) {
          const newToken = profileRes.accessToken || getToken();
          setAuth(newToken, profileRes.user);
          window.location.reload();
          return;
        }
      }

      const bookingsRes = await bookingsAPI.getUserBookings();
      setBookings(bookingsRes.data || []);

      const wlRes = await waitlistAPI.getUserWaitlists();
      setWaitlists(wlRes.data || []);

      if (user?.role === 'ORGANIZER') {
        const eventsRes = await eventsAPI.getOrganizerEvents();
        setOrganizerEvents(eventsRes.data || []);
        try {
          const analyticsRes = await eventsAPI.getAnalytics();
          setAnalytics(analyticsRes.data || null);
        } catch (err) {
          console.error(err);
        }
      }

      if (user?.role === 'USER') {
        const statusRes = await rolesAPI.getRequestStatus();
        if (statusRes.success && statusRes.data) {
          setRoleRequestStatus(statusRes.data.status);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRequestUpgrade = async () => {
    setActionLoading(true);
    try {
      const res = await rolesAPI.createRequest();
      if (res.success) {
        setRoleRequestStatus('PENDING');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(true);
    try {
      await bookingsAPI.cancel(bookingId);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setActionLoading(true);

    try {
      const formattedData = {
        ...newEvent,
        price: Number(newEvent.price),
        total_seats: Number(newEvent.total_seats),
      };

      await eventsAPI.create(formattedData);
      setFormSuccess('Event created successfully! Pending admin approval.');
      setNewEvent({
        title: '',
        description: '',
        location: '',
        event_date: '',
        price: 0,
        total_seats: 10,
        category: 'General',
      });
      await fetchData();
      setTimeout(() => setShowCreateModal(false), 2000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    setActionLoading(true);

    try {
      const payload = {
        username: settingsForm.username,
        email: settingsForm.email,
      };

      if (settingsForm.newPassword) {
        payload.currentPassword = settingsForm.currentPassword;
        payload.newPassword = settingsForm.newPassword;
      }

      const res = await authAPI.updateProfile(payload);
      if (res.success && res.user) {
        setSettingsSuccess('Profile updated successfully!');
        setSettingsForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
        }));
        
        const token = getToken();
        setAuth(token, res.user);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRoster = async (evt) => {
    setRosterEvent(evt);
    setShowRosterModal(true);
    setRosterLoading(true);
    try {
      const res = await eventsAPI.getAttendees(evt.id);
      if (res.success) {
        setRosterData(res.data || []);
      }
    } catch (err) {
      setCustomAlert({
        show: true,
        title: 'Error Loading Attendees',
        message: err.message,
        onConfirm: null
      });
    } finally {
      setRosterLoading(false);
    }
  };

  const handleCancelOrganizerEvent = async (eventId) => {
    setCustomAlert({
      show: true,
      title: 'Confirm Event Cancellation',
      message: 'Are you sure you want to cancel this event? This will refund all bookings and notify attendees.',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await eventsAPI.cancel(eventId);
          await fetchData();
        } catch (err) {
          setCustomAlert({
            show: true,
            title: 'Cancellation Failed',
            message: err.message,
            onConfirm: null
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const downloadAttendeesCSV = (eventTitle, roster) => {
    const headers = ['Booking ID', 'Username', 'Email', 'Tickets Booked', 'Status', 'Booked At'];
    const rows = roster.map(r => [
      r.id,
      r.username,
      r.email,
      r.ticket_count,
      r.booking_status,
      new Date(r.created_at).toLocaleString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees_${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenTicket = (booking) => {
    setTicketData(booking);
    setShowTicketModal(true);
  };

  const notifiedWaitlists = waitlists.filter(wl => wl.status === 'NOTIFIED');

  return (
    <div className="dashboard-container">
      {notifiedWaitlists.length > 0 && (
        <div className="waitlist-promotion-alert">
          <div className="promotion-alert-content">
            <span className="promotion-alert-icon">⚡</span>
            <div>
              <h3>Seat Available!</h3>
              <p>You have been promoted from the waitlist for: <strong>{notifiedWaitlists.map(wl => wl.event_title).join(', ')}</strong></p>
              <p className="promotion-alert-timer">
                Please go to the event details page to complete your booking before the 30-minute promotional window expires!
              </p>
            </div>
          </div>
          <button 
            className="promotion-alert-btn"
            onClick={() => navigate(`/events/${notifiedWaitlists[0].event_id}`)}
          >
            Claim Seat Now
          </button>
        </div>
      )}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-profile-card">
            <div className="profile-avatar">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <h2>{user?.username}</h2>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-role-badge">{user?.role}</div>

            {user?.role === 'USER' && (
              <div className="upgrade-section">
                {roleRequestStatus === 'PENDING' ? (
                  <div className="upgrade-status-pending">Upgrade Request: Pending ⏳</div>
                ) : (
                  <button 
                    className="upgrade-btn" 
                    onClick={handleRequestUpgrade}
                    disabled={actionLoading}
                  >
                    Request Organizer Role
                  </button>
                )}
              </div>
            )}

            <button className="sidebar-logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="dashboard-main-content">
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              My Bookings
            </button>
            <button 
              className={`tab-btn ${activeTab === 'waitlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('waitlist')}
            >
              My Waitlists
            </button>
            {user?.role === 'ORGANIZER' && (
              <button 
                className={`tab-btn ${activeTab === 'organizer' ? 'active' : ''}`}
                onClick={() => setActiveTab('organizer')}
              >
                Organizer Panel
              </button>
            )}
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          {error && <div className="dashboard-error-banner">⚠️ {error}</div>}

          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <p>Loading dashboard data...</p>
            </div>
          ) : (
            <div className="tab-content-panel">
              {activeTab === 'bookings' && (
                <div className="bookings-tab-panel">
                  {bookings.length === 0 ? (
                    <div className="panel-empty-state">
                      <span>🎟️</span>
                      <h3>No bookings found</h3>
                      <p>Browse events and book your tickets to see them here.</p>
                      <button onClick={() => navigate('/events')}>Browse Events</button>
                    </div>
                  ) : (
                    <div className="bookings-list">
                      {bookings.map((booking) => {
                        const date = new Date(booking.event_date || booking.created_at);
                        const isCancelled = booking.booking_status === 'CANCELLED';
                        return (
                          <div key={booking.id} className={`dashboard-item-card ${isCancelled ? 'cancelled' : ''}`}>
                            <div className="card-primary-details">
                              <h3>{booking.event_title || 'Event Booking'}</h3>
                              <p className="card-sub-detail">📅 {date.toLocaleDateString()} · {booking.location || 'Online'}</p>
                              <div className="card-seats-count">Tickets: {booking.ticket_count}</div>
                            </div>
                            <div className="card-action-details">
                              <span className={`status-badge ${booking.booking_status.toLowerCase()}`}>
                                {booking.booking_status}
                              </span>
                              {!isCancelled && (
                                <div className="booking-action-buttons">
                                  <button 
                                    className="view-ticket-btn"
                                    onClick={() => handleOpenTicket(booking)}
                                  >
                                    View Ticket
                                  </button>
                                  <button 
                                    className="cancel-booking-btn"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={actionLoading}
                                  >
                                    Cancel Booking
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'waitlist' && (
                <div className="waitlist-tab-panel">
                  {waitlists.length === 0 ? (
                    <div className="panel-empty-state">
                      <span>⏳</span>
                      <h3>No active waitlists</h3>
                      <p>You aren't on any waitlists currently.</p>
                    </div>
                  ) : (
                    <div className="waitlist-list">
                      {waitlists.map((wl) => {
                        const date = new Date(wl.event_date);
                        return (
                          <div key={wl.id} className="dashboard-item-card">
                            <div className="card-primary-details">
                              <h3>{wl.event_title}</h3>
                              <p className="card-sub-detail">📅 {date.toLocaleDateString()}</p>
                              <div className="waitlist-pos-label">Position #{wl.position}</div>
                            </div>
                            <div className="card-action-details">
                              <span className={`status-badge ${wl.status.toLowerCase()}`}>
                                {wl.status}
                              </span>
                              {wl.status === 'NOTIFIED' && (
                                <button 
                                  className="claim-ticket-btn"
                                  onClick={() => navigate(`/events/${wl.event_id}`)}
                                >
                                  Book Now
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'organizer' && user?.role === 'ORGANIZER' && (
                <div className="organizer-tab-panel">
                  <div className="organizer-panel-header">
                    <h2>Host Panel</h2>
                    <button className="create-event-trigger" onClick={() => setShowCreateModal(true)}>
                      Create New Event
                    </button>
                  </div>

                  {analytics && (
                    <div className="analytics-dashboard">
                      <div className="analytics-stats-grid">
                        <div className="analytics-stat-card">
                          <span className="stat-icon">🎟️</span>
                          <div className="stat-info">
                            <span className="stat-label">Total Events</span>
                            <span className="stat-value">{analytics.totalEvents}</span>
                          </div>
                        </div>
                        <div className="analytics-stat-card">
                          <span className="stat-icon">👥</span>
                          <div className="stat-info">
                            <span className="stat-label">Tickets Sold</span>
                            <span className="stat-value">{analytics.totalTicketsSold}</span>
                          </div>
                        </div>
                        <div className="analytics-stat-card">
                          <span className="stat-icon">💰</span>
                          <div className="stat-info">
                            <span className="stat-label">Total Revenue</span>
                            <span className="stat-value">₹{Number(analytics.totalRevenue).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="analytics-stat-card">
                          <span className="stat-icon">📈</span>
                          <div className="stat-info">
                            <span className="stat-label">Avg Occupancy</span>
                            <span className="stat-value">{analytics.occupancyRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="analytics-charts-section">
                        <div className="analytics-occupancy-card">
                          <h3>Average Ticket Sale Occupancy</h3>
                          <div className="occupancy-progress-bar">
                            <div 
                              className="occupancy-progress-fill" 
                              style={{ width: `${analytics.occupancyRate}%` }}
                            />
                          </div>
                          <span className="occupancy-desc">{analytics.occupancyRate}% of your total seats have been booked</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {organizerEvents.length === 0 ? (
                    <div className="panel-empty-state">
                      <span>🎪</span>
                      <h3>No events created yet</h3>
                      <p>Start hosting events by clicking Create New Event.</p>
                    </div>
                  ) : (
                    <div className="organizer-events-list">
                      {organizerEvents.map((evt) => {
                        const date = new Date(evt.event_date);
                        return (
                          <div key={evt.id} className="dashboard-item-card">
                            <div className="card-primary-details">
                              <h3>{evt.title}</h3>
                              <p className="card-sub-detail">📅 {date.toLocaleDateString()} · 📍 {evt.location}</p>
                              <div className="seats-held-stats">
                                Seats: {evt.available_seats} available of {evt.total_seats} total
                              </div>
                            </div>
                            <div className="card-action-details">
                              <span className={`status-badge ${evt.approval_status.toLowerCase()}`}>
                                {evt.approval_status}
                              </span>
                              {evt.approval_status !== 'CANCELLED' && evt.approval_status !== 'REJECTED' && (
                                <div className="organizer-event-actions">
                                  <button 
                                    className="roster-view-btn"
                                    onClick={() => handleOpenRoster(evt)}
                                  >
                                    View Attendees
                                  </button>
                                  <button 
                                    className="cancel-event-btn"
                                    onClick={() => handleCancelOrganizerEvent(evt.id)}
                                    disabled={actionLoading}
                                  >
                                    Cancel Event
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="settings-tab-panel">
                  <h2>Account Settings</h2>
                  <form onSubmit={handleUpdateProfileSubmit} className="settings-form">
                    {settingsError && <div className="settings-error-alert">⚠️ {settingsError}</div>}
                    {settingsSuccess && <div className="settings-success-alert">🎉 {settingsSuccess}</div>}

                    <div className="form-field">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={settingsForm.username}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="settings-password-section">
                      <h3>Change Password</h3>
                      <p className="settings-sec-desc">Fill these fields only if you wish to change your password.</p>
                      
                      <div className="form-field">
                        <label>Current Password</label>
                        <input 
                          type="password" 
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="form-field">
                        <label>New Password</label>
                        <input 
                          type="password" 
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button type="submit" className="settings-save-btn" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="create-event-modal-backdrop">
          <div className="create-event-modal">
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateEventSubmit} className="modal-form">
              {formError && <div className="form-error-alert">⚠️ {formError}</div>}
              {formSuccess && <div className="form-success-alert">🎉 {formSuccess}</div>}

              <div className="form-field">
                <label>Event Title</label>
                <input 
                  type="text" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter event name"
                />
              </div>

              <div className="form-field">
                <label>Description</label>
                <textarea 
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  placeholder="Provide details about the event"
                />
              </div>

              <div className="form-field">
                <label>Location</label>
                <input 
                  type="text" 
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  required
                  placeholder="E.g. Hall A, New Delhi or Online"
                />
              </div>

              <div className="form-field">
                <label>Event Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-field">
                <label>Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="modal-select"
                >
                  <option value="General">General</option>
                  <option value="Tech">Tech</option>
                  <option value="Music">Music</option>
                  <option value="Art">Art</option>
                  <option value="Business">Business</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Price (₹)</label>
                  <input 
                    type="number" 
                    value={newEvent.price}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, price: e.target.value }))}
                    min="0"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Total Capacity (Seats)</label>
                  <input 
                    type="number" 
                    value={newEvent.total_seats}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, total_seats: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Submit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRosterModal && rosterEvent && (
        <div className="create-event-modal-backdrop">
          <div className="create-event-modal roster-modal">
            <div className="modal-header">
              <h2>Attendees: {rosterEvent.title}</h2>
              <button className="modal-close-btn" onClick={() => setShowRosterModal(false)}>×</button>
            </div>
            <div className="modal-body-content">
              {rosterLoading ? (
                <div className="dashboard-loading">
                  <div className="loading-spinner" />
                  <p>Loading attendees list...</p>
                </div>
              ) : (
                <div className="roster-modal-content">
                  <div className="roster-actions-bar">
                    <button 
                      className="download-roster-btn"
                      onClick={() => downloadAttendeesCSV(rosterEvent.title, rosterData)}
                      disabled={rosterData.length === 0}
                    >
                      📥 Download CSV
                    </button>
                    <span className="roster-total-count">
                      Total Bookings: {rosterData.reduce((acc, curr) => acc + (curr.booking_status !== 'CANCELLED' ? curr.ticket_count : 0), 0)} seats
                    </span>
                  </div>

                  {rosterData.length === 0 ? (
                    <div className="panel-empty-state roster-empty">
                      <span>👥</span>
                      <h3>No bookings yet</h3>
                      <p>No attendees have booked tickets for this event.</p>
                    </div>
                  ) : (
                    <div className="roster-list-table-container">
                      <table className="roster-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Tickets</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rosterData.map(row => (
                            <tr key={row.id}>
                              <td>{row.username}</td>
                              <td>{row.email}</td>
                              <td>{row.ticket_count}</td>
                              <td>
                                <span className={`status-badge ${row.booking_status.toLowerCase()}`}>
                                  {row.booking_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTicketModal && ticketData && (
        <div className="create-event-modal-backdrop">
          <div className="create-event-modal ticket-modal">
            <div className="modal-header">
              <h2>Digital Ticket Stub</h2>
              <button className="modal-close-btn" onClick={() => setShowTicketModal(false)}>×</button>
            </div>
            <div className="modal-body-content ticket-stub-container">
              <div className="ticket-stub">
                <div className="ticket-stub__header">
                  <h3>{ticketData.event_title}</h3>
                  <span className="ticket-stub__badge">CONFIRMED</span>
                </div>
                
                <div className="ticket-stub__body">
                  <div className="ticket-stub__meta-grid">
                    <div className="ticket-meta-item">
                      <span className="ticket-meta-label">Date & Time</span>
                      <span className="ticket-meta-value">{new Date(ticketData.event_date).toLocaleString()}</span>
                    </div>
                    <div className="ticket-meta-item">
                      <span className="ticket-meta-label">Location</span>
                      <span className="ticket-meta-value">{ticketData.location}</span>
                    </div>
                    <div className="ticket-meta-item">
                      <span className="ticket-meta-label">Attendee</span>
                      <span className="ticket-meta-value">{user?.username}</span>
                    </div>
                    <div className="ticket-meta-item">
                      <span className="ticket-meta-label">Tickets</span>
                      <span className="ticket-meta-value">{ticketData.ticket_count} Seats</span>
                    </div>
                  </div>

                  <div className="ticket-stub__divider">
                    <div className="divider-circle left" />
                    <div className="divider-line" />
                    <div className="divider-circle right" />
                  </div>

                  <div className="ticket-stub__qr-section">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/tickets/validate/' + ticketData.id)}`} 
                      alt="Ticket QR Code" 
                      className="ticket-qr-image"
                    />
                    <span className="ticket-id-text">Booking ID: {ticketData.id}</span>
                  </div>
                </div>

                <div className="ticket-stub__footer">
                  <button 
                    className="ticket-print-btn"
                    onClick={() => window.print()}
                  >
                    🖨️ Print Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {customAlert.show && (
        <div className="create-event-modal-backdrop" style={{ zIndex: 2000 }}>
          <div className="create-event-modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>{customAlert.title}</h2>
              <button className="modal-close-btn" onClick={() => setCustomAlert({ show: false, title: '', message: '', onConfirm: null })}>×</button>
            </div>
            <div className="modal-body-content">
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: '0 0 var(--spacing-lg) 0' }}>
                {customAlert.message}
              </p>
              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                {customAlert.onConfirm ? (
                  <>
                    <button 
                      className="modal-btn secondary" 
                      onClick={() => setCustomAlert({ show: false, title: '', message: '', onConfirm: null })}
                    >
                      Cancel
                    </button>
                    <button 
                      className="modal-btn primary" 
                      onClick={async () => {
                        const cb = customAlert.onConfirm;
                        setCustomAlert({ show: false, title: '', message: '', onConfirm: null });
                        if (cb) await cb();
                      }}
                    >
                      Confirm
                    </button>
                  </>
                ) : (
                  <button 
                    className="modal-btn primary" 
                    onClick={() => setCustomAlert({ show: false, title: '', message: '', onConfirm: null })}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
