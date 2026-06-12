import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-placeholder">
      <div className="dashboard-placeholder-card">
        <div className="dashboard-placeholder-logo">eventra</div>
        <h1>Welcome back{user?.username ? `, ${user.username}` : ''}! 👋</h1>
        <p>You're successfully logged in. This is a placeholder dashboard.</p>
        <p className="dashboard-placeholder-note">
          We'll build the real dashboard in a later step.
        </p>
        <div className="dashboard-placeholder-actions">
          <button
            className="dashboard-placeholder-btn primary"
            onClick={() => navigate('/events')}
          >
            Browse Events
          </button>
          <button
            className="dashboard-placeholder-btn secondary"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
