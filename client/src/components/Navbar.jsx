import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineMenu, HiOutlineX, HiOutlineUser } from 'react-icons/hi';
import { getUser, isLoggedIn, logout } from '../utils/auth.js';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const user = getUser();
    const loggedIn = isLoggedIn();

    const handleLogout = () => {
        logout();
        navigate('/login');
        setDropdownOpen(false);
    };

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
                </div>

                <div className="navbar-right">
                    {loggedIn ? (
                        <div className="navbar-user">
                            <button
                                className="navbar-avatar"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
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
