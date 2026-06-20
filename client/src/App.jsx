import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import EventsPage from './pages/EventsPage';
import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';

const AUTH_ROUTES = ['/login', '/register'];

const AppContent = () => {
    const location = useLocation();
    const hideNavbar = AUTH_ROUTES.includes(location.pathname);

    return (
        <>
            {!hideNavbar && <Navbar />}
            <Routes>
                <Route path="/"          element={<LandingPage />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Register />} />
                <Route path="/events"    element={<EventsPage />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

const App = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;
