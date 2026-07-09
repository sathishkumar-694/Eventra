import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineMenu, HiOutlineX, HiOutlineUser, HiOutlineBell } from 'react-icons/hi';
import { getUser, isLoggedIn, logout } from '../utils/auth.js';
import { notificationsAPI } from '../api/notifications.js';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const user = getUser();
    const loggedIn = isLoggedIn();

    const fetchNotifications = async () => {
        if (!loggedIn) return;
        try {
            const res = await notificationsAPI.getAll();
            setNotifications(res.data || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        if (!loggedIn) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [loggedIn]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setDropdownOpen(false);
        setNotificationsOpen(false);
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error("Failed to mark notification read:", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-inner">

                <Link to={loggedIn ? '/dashboard' : '/'} className="navbar-logo">
                    eventra
                </Link>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <Link
                        to="/events"
                        className={`navbar-link ${isActive('/events') ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <HiOutlineCalendar size={17} />
                        Events
                    </Link>
                    {loggedIn && (
                        <Link
                            to="/dashboard"
                            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                    )}
                    {loggedIn && user?.role === 'ADMIN' && (
                        <Link
                            to="/admin"
                            className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Admin Panel
                        </Link>
                    )}
                </div>

                <div className="navbar-right">
                    {loggedIn && (
                        <div className="navbar-notifications-container">
                            <button
                                className={`navbar-notifications-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                                onClick={() => {
                                    setNotificationsOpen(!notificationsOpen);
                                    setDropdownOpen(false);
                                }}
                                aria-label="Notifications"
                            >
                                <HiOutlineBell size={20} />
                                {unreadCount > 0 && (
                                    <span className="navbar-notifications-badge">{unreadCount}</span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="navbar-notifications-dropdown">
                                    <div className="notifications-dropdown-header">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button 
                                                className="notifications-mark-all-btn" 
                                                onClick={handleMarkAllRead}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notifications-dropdown-list">
                                        {notifications.length === 0 ? (
                                            <div className="notifications-dropdown-empty">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className={`notifications-dropdown-item ${n.is_read ? 'read' : 'unread'}`}
                                                    onClick={() => handleMarkRead(n.id)}
                                                >
                                                    <span className="notification-icon">
                                                        {n.type === 'booking' && '🎉'}
                                                        {n.type === 'cancellation' && '⚠️'}
                                                        {n.type === 'waitlist' && '🚀'}
                                                        {n.type === 'admin' && '🎪'}
                                                    </span>
                                                    <div className="notification-info">
                                                        <span className="notification-title">{n.title}</span>
                                                        <span className="notification-message">{n.message}</span>
                                                        <span className="notification-time">
                                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {loggedIn ? (
                        <div className="navbar-user">
                            <button
                                className="navbar-avatar"
                                onClick={() => {
                                    setDropdownOpen(!dropdownOpen);
                                    setNotificationsOpen(false);
                                }}
                            >
                                <span className="navbar-avatar-initials">
                                    {user?.username?.[0]?.toUpperCase() || <HiOutlineUser size={16} />}
                                </span>
                                <span className="navbar-username">{user?.username}</span>
                            </button>
                            {dropdownOpen && (
                                <div className="navbar-dropdown">
                                    <div className="navbar-dropdown-email">{user?.email}</div>
                                    <div className="navbar-dropdown-divider" />
                                    <button className="navbar-dropdown-item" onClick={handleLogout}>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="navbar-auth-btns">
                            <Link to="/login" className="navbar-btn-ghost">Login</Link>
                            <Link to="/register" className="navbar-btn-primary">Sign Up</Link>
                        </div>
                    )}

                    <button
                        className="navbar-hamburger"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
