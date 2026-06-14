import { Link } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineCalendar, HiOutlineUserGroup, HiOutlineTicket, HiArrowRight } from 'react-icons/hi';
import './LandingPage.css';

const FEATURES = [
    {
        icon: <HiOutlineCalendar size={24} />,
        title: 'Create Events',
        desc: 'Set up events in minutes — add details, capacity, date and go live instantly.',
    },
    {
        icon: <HiOutlineTicket size={24} />,
        title: 'Easy Booking',
        desc: 'Attendees can discover and book events with a single click.',
    },
    {
        icon: <HiOutlineUserGroup size={24} />,
        title: 'Manage Attendees',
        desc: 'Track bookings, view attendee lists, and stay on top of capacity.',
    },
    {
        icon: <HiOutlineSparkles size={24} />,
        title: 'Role-based Access',
        desc: 'Organizers manage events. Attendees book them. Clean and simple.',
    },
];

const STATS = [
    { value: '500+', label: 'Events Created' },
    { value: '10k+', label: 'Bookings Made' },
    { value: '98%',  label: 'Satisfaction Rate' },
];

const LandingPage = () => {
    return (
        <div className="landing">

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-glow" />
                <div className="landing-hero-content">
                    <div className="landing-badge">
                        <HiOutlineSparkles size={14} />
                        Event Management, Simplified
                    </div>
                    <h1 className="landing-hero-title">
                        Create events that
                        <span className="landing-gradient-text"> people remember</span>
                    </h1>
                    <p className="landing-hero-sub">
                        Eventra makes it effortless to create, manage, and book events —
                        all in one place.
                    </p>
                    <div className="landing-hero-cta">
                        <Link to="/register" className="landing-btn-primary">
                            Get Started Free
                            <HiArrowRight size={18} />
                        </Link>
                        <Link to="/events" className="landing-btn-ghost">
                            Browse Events
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="landing-stats">
                <div className="landing-container">
                    <div className="landing-stats-grid">
                        {STATS.map((stat) => (
                            <div key={stat.label} className="landing-stat">
                                <span className="landing-stat-value">{stat.value}</span>
                                <span className="landing-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-features">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <h2>Everything you need</h2>
                        <p>A focused set of tools to run events without the noise.</p>
                    </div>
                    <div className="landing-features-grid">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="landing-feature-card">
                                <div className="landing-feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="landing-cta-banner">
                <div className="landing-container">
                    <div className="landing-cta-box">
                        <h2>Ready to host your first event?</h2>
                        <p>Join and start creating in under a minute.</p>
                        <Link to="/register" className="landing-btn-primary">
                            Create Your Account
                            <HiArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
