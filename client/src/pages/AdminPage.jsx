import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/admin';
import { eventsAPI } from '../api/events';
import './AdminPage.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterEvent, setRosterEvent] = useState(null);
  const [rosterData, setRosterData] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [customAlert, setCustomAlert] = useState({ show: false, title: '', message: '', onConfirm: null });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'stats') {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } else if (activeTab === 'events') {
        const res = await adminAPI.getPendingEvents();
        setPendingEvents(res.data || []);
      } else if (activeTab === 'roles') {
        const res = await adminAPI.getAllRoleRequests();
        const pending = (res.data || []).filter(req => req.status === 'PENDING');
        setRoleRequests(pending);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleApproveEvent = async (id) => {
    setActionLoading(true);
    try {
      await adminAPI.approveEvent(id);
      await fetchAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectEvent = async (id) => {
    const reason = window.prompt('Please enter a rejection reason (minimum 10 characters):');
    if (reason === null) return;
    if (reason.trim().length < 10) {
      setCustomAlert({
        show: true,
        title: 'Validation Error',
        message: 'Rejection reason must be at least 10 characters long.',
        onConfirm: null
      });
      return;
    }

    setActionLoading(true);
    try {
      await adminAPI.rejectEvent(id, reason.trim());
      await fetchAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRole = async (id) => {
    setActionLoading(true);
    try {
      await adminAPI.approveRoleRequest(id);
      await fetchAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRole = async (id) => {
    const reason = window.prompt('Please enter a rejection reason (minimum 10 characters):');
    if (reason === null) return;
    if (reason.trim().length < 10) {
      setCustomAlert({
        show: true,
        title: 'Validation Error',
        message: 'Rejection reason must be at least 10 characters long.',
        onConfirm: null
      });
      return;
    }

    setActionLoading(true);
    try {
      await adminAPI.rejectRoleRequest(id, reason.trim());
      await fetchAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadEventCSV = (item) => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Event ID', item.id],
      ['Title', item.title],
      ['Host Organizer', item.organizer_name || 'System'],
      ['Price', item.price === 0 ? 'Free' : `INR ${item.price}`],
      ['Total Capacity', item.total_seats],
      ['Available Seats', item.available_seats],
      ['Tickets Sold', item.seats_sold],
      ['Total Tickets Booked', item.total_tickets_booked],
      ['Total Revenue Generated', `INR ${item.revenue}`],
      ['Approval Status', item.approval_status],
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analysis_${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Control Panel</h1>
        <p>Manage pending events, promote organizers, and monitor system metrics.</p>
      </header>

      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Overview Stats
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          🎪 Pending Events
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          👤 Promotion Requests
        </button>
      </div>

      {error && <div className="admin-error-alert">⚠️ {error}</div>}

      {loading ? (
        <div className="admin-loading-state">
          <div className="loading-spinner" />
          <p>Loading administrative dashboard...</p>
        </div>
      ) : (
        <div className="admin-panel-content">
          {activeTab === 'stats' && stats && (
            <div className="admin-stats-view">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <div className="stat-value">{stats.total_users || 0}</div>
                  <p>Registered members in the database</p>
                </div>
                <div className="stat-card">
                  <h3>Total Bookings</h3>
                  <div className="stat-value">{stats.total_bookings || 0}</div>
                  <p>Total ticket transactions processed</p>
                </div>
                <div className="stat-card">
                  <h3>Total Revenue</h3>
                  <div className="stat-value accent">₹{(stats.total_revenue || 0).toLocaleString('en-IN')}</div>
                  <p>Aggregated earnings from ticket sales</p>
                </div>
                <div className="stat-card">
                  <h3>Pending Events</h3>
                  <div className="stat-value warning">{stats.pending_events || 0}</div>
                  <p>Events waiting for administrative approval</p>
                </div>
              </div>

              {stats.event_analysis && stats.event_analysis.length > 0 && (
                <div className="admin-analysis-section">
                  <h2>Event-by-Event Analysis</h2>
                  <div className="analysis-cards-grid">
                    {stats.event_analysis.map((item) => {
                      const occupancyRate = item.total_seats > 0 
                        ? Math.min(Math.round((item.seats_sold / item.total_seats) * 100), 100) 
                        : 0;
                      return (
                        <div key={item.id} className="analysis-card">
                          <div className="analysis-card-header">
                            <div>
                              <h3>{item.title}</h3>
                              <span className="analysis-host">Host: {item.organizer_name || 'System'}</span>
                            </div>
                            {new Date(item.event_date) < new Date() ? (
                              <span className="status-pill completed">COMPLETED</span>
                            ) : (
                              <span className={`status-pill ${String(item.approval_status).toLowerCase()}`}>
                                {item.approval_status}
                              </span>
                            )}
                          </div>

                          <div className="analysis-occupancy-section">
                            <div className="occupancy-info-row">
                              <span>Occupancy</span>
                              <span>{item.seats_sold} / {item.total_seats} ({occupancyRate}%)</span>
                            </div>
                            <div className="analysis-progress-bar">
                              <div className="analysis-progress-fill" style={{ width: `${occupancyRate}%` }} />
                            </div>
                          </div>

                          <div className="analysis-stats-row">
                            <div className="analysis-mini-stat">
                              <span className="mini-label">Price</span>
                              <span className="mini-val">{item.price === 0 ? 'Free' : `₹${Number(item.price).toLocaleString('en-IN')}`}</span>
                            </div>
                            <div className="analysis-mini-stat">
                              <span className="mini-label">Booked</span>
                              <span className="mini-val">{item.total_tickets_booked}</span>
                            </div>
                            <div className="analysis-mini-stat">
                              <span className="mini-label">Revenue</span>
                              <span className="mini-val highlight">₹{Number(item.revenue).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="analysis-actions-row">
                            <button 
                              className="analysis-csv-btn"
                              onClick={() => downloadEventCSV(item)}
                            >
                              📥 Export Summary CSV
                            </button>
                            <button 
                              className="analysis-roster-btn"
                              onClick={() => handleOpenRoster(item)}
                            >
                              👥 View Attendee Roster
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="admin-events-view">
              {pendingEvents.length === 0 ? (
                <div className="admin-empty-state">
                  <span>🎪</span>
                  <h3>No pending events</h3>
                  <p>All host event submissions have been processed.</p>
                </div>
              ) : (
                <div className="admin-list-container">
                  {pendingEvents.map((evt) => {
                    const isExpanded = expandedEventId === evt.id;
                    const date = new Date(evt.event_date);
                    return (
                      <div 
                        key={evt.id} 
                        className={`admin-action-card collapsible ${isExpanded ? 'active' : ''}`}
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      >
                        <div className="card-header-row">
                          <h2>{evt.title}</h2>
                          <span className="expand-indicator">
                            {isExpanded ? 'Collapse ▲' : 'View Details ▼'}
                          </span>
                        </div>
                        
                        {isExpanded && (
                          <div className="expanded-details-pane" onClick={(e) => e.stopPropagation()}>
                            <p className="event-description-text">{evt.description || 'No description provided.'}</p>
                            <div className="card-meta-details">
                              <span>📍 <strong>Location:</strong> {evt.location}</span>
                              <span>📅 <strong>Date:</strong> {date.toLocaleString()}</span>
                              <span>🎟️ <strong>Capacity:</strong> {evt.total_seats} seats</span>
                              <span>💰 <strong>Price:</strong> {evt.price === 0 ? 'Free' : `₹${Number(evt.price).toLocaleString('en-IN')}`}</span>
                            </div>
                            
                            <div className="card-actions">
                              <button 
                                className="admin-btn approve-btn"
                                onClick={() => handleApproveEvent(evt.id)}
                                disabled={actionLoading}
                              >
                                Approve
                              </button>
                              <button 
                                className="admin-btn reject-btn"
                                onClick={() => handleRejectEvent(evt.id)}
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="admin-roles-view">
              {roleRequests.length === 0 ? (
                <div className="admin-empty-state">
                  <span>👤</span>
                  <h3>No promotion requests</h3>
                  <p>There are no pending organizer upgrade requests from users.</p>
                </div>
              ) : (
                <div className="admin-list-container">
                  {roleRequests.map((req) => (
                    <div key={req.id} className="admin-action-card">
                      <div className="card-info">
                        <h2>Organizer Upgrade Request</h2>
                        <div className="card-meta-details">
                          <span>👤 <strong>Username:</strong> {req.username}</span>
                          <span>✉️ <strong>Email:</strong> {req.email}</span>
                          <span>🆔 <strong>Request ID:</strong> {req.id}</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button 
                          className="admin-btn approve-btn"
                          onClick={() => handleApproveRole(req.id)}
                          disabled={actionLoading}
                        >
                          Approve Upgrade
                        </button>
                        <button 
                          className="admin-btn reject-btn"
                          onClick={() => handleRejectRole(req.id)}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                <div className="admin-loading-state">
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
                    <div className="admin-empty-state roster-empty">
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
                                <span className={`status-pill ${row.booking_status.toLowerCase()}`}>
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
                      className="admin-btn reject-btn" 
                      style={{ width: 'auto', minWidth: '100px' }}
                      onClick={() => setCustomAlert({ show: false, title: '', message: '', onConfirm: null })}
                    >
                      Cancel
                    </button>
                    <button 
                      className="admin-btn approve-btn" 
                      style={{ width: 'auto', minWidth: '100px' }}
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
                    className="admin-btn approve-btn" 
                    style={{ width: 'auto', minWidth: '100px' }}
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
