import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/admin';
import './AdminPage.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  
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
      alert('Rejection reason must be at least 10 characters long.');
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
      alert('Rejection reason must be at least 10 characters long.');
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
                    const date = new Date(evt.event_date);
                    return (
                      <div key={evt.id} className="admin-action-card">
                        <div className="card-info">
                          <h2>{evt.title}</h2>
                          <p>{evt.description || 'No description provided.'}</p>
                          <div className="card-meta-details">
                            <span>📍 <strong>Location:</strong> {evt.location}</span>
                            <span>📅 <strong>Date:</strong> {date.toLocaleString()}</span>
                            <span>🎟️ <strong>Capacity:</strong> {evt.total_seats} seats</span>
                            <span>💰 <strong>Price:</strong> ₹{evt.price}</span>
                          </div>
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
    </div>
  );
}
