import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api/events';
import './EventsPage.css';

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'event_date', label: 'Event Date' },
  { value: 'price', label: 'Price' },
];

function EventCard({ event, onClick }) {
  const date = new Date(event.event_date);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
  const seatsLeft = event.available_seats;
  const seatPercent = Math.round((seatsLeft / event.total_seats) * 100);

  return (
    <article className="event-card" onClick={() => onClick(event.id)}>
      <div className="event-card__header">
        <span className="event-card__category">Event</span>
        <span className={`event-card__seats-badge ${seatsLeft === 0 ? 'sold-out' : seatsLeft < 10 ? 'low' : ''}`}>
          {seatsLeft === 0 ? 'Sold Out' : `${seatsLeft} seats left`}
        </span>
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>
        {event.description && (
          <p className="event-card__desc">{event.description}</p>
        )}
      </div>

      <div className="event-card__meta">
        <div className="event-card__meta-row">
          <span className="event-card__icon">📍</span>
          <span>{event.location}</span>
        </div>
        <div className="event-card__meta-row">
          <span className="event-card__icon">📅</span>
          <span>{formattedDate} · {formattedTime}</span>
        </div>
      </div>

      <div className="event-card__footer">
        <div className="event-card__seats-bar">
          <div className="event-card__seats-fill" style={{ width: `${seatPercent}%` }} />
        </div>
        <div className="event-card__price-row">
          <span className="event-card__price">
            {event.price === 0 ? 'Free' : `₹${Number(event.price).toLocaleString('en-IN')}`}
          </span>
          <button className="event-card__btn" disabled={seatsLeft === 0}>
            {seatsLeft === 0 ? 'Sold Out' : 'Book Now'}
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="event-card event-card--skeleton">
      <div className="skeleton skeleton--header" />
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--desc" />
      <div className="skeleton skeleton--meta" />
      <div className="skeleton skeleton--footer" />
    </div>
  );
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const LIMIT = 9;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsAPI.getAll({
        search: debouncedSearch,
        location: filters.location,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sortBy: filters.sortBy,
        page,
        limit: LIMIT,
      });
      setEvents(data.data);
      setTotalCount(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.location, filters.minPrice, filters.maxPrice, filters.sortBy, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.location, filters.minPrice, filters.maxPrice, filters.sortBy]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '', minPrice: '', maxPrice: '', sortBy: 'created_at' });
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / LIMIT);
  const hasActiveFilters = filters.search || filters.location || filters.minPrice || filters.maxPrice;

  return (
    <div className="events-page">
      <div className="events-page__hero">
        <h1 className="events-page__heading">Discover Events</h1>
        <p className="events-page__subheading">Find and book the best events happening near you</p>

        <div className="events-page__search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search events by name..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="events-page__content">
        <aside className="events-page__filters">
          <div className="filter-panel">
            <div className="filter-panel__header">
              <h3>Filters</h3>
              {hasActiveFilters && (
                <button className="filter-clear-btn" onClick={clearFilters}>Clear all</button>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-label">Location</label>
              <input
                type="text"
                placeholder="Any location"
                value={filters.location}
                onChange={e => handleFilterChange('location', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Price Range (₹)</label>
              <div className="filter-price-row">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={e => handleFilterChange('minPrice', e.target.value)}
                  className="filter-input filter-input--half"
                  min="0"
                />
                <span className="filter-price-sep">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={e => handleFilterChange('maxPrice', e.target.value)}
                  className="filter-input filter-input--half"
                  min="0"
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={e => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <main className="events-page__main">
          <div className="events-page__results-bar">
            <span className="results-count">
              {loading ? 'Loading...' : `${totalCount} event${totalCount !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {error && (
            <div className="events-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="events-grid">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : events.length === 0
                ? (
                  <div className="events-empty">
                    <span className="events-empty__icon">🎪</span>
                    <h3>No events found</h3>
                    <p>Try adjusting your search or filters</p>
                    {hasActiveFilters && (
                      <button className="events-empty__btn" onClick={clearFilters}>Clear filters</button>
                    )}
                  </div>
                )
                : events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={(id) => navigate(`/events/${id}`)}
                  />
                ))
            }
          </div>

          {!loading && totalPages > 1 && (
            <div className="events-pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`pagination-page ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
