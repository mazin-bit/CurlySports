// @ts-nocheck
import React, { useState, useEffect } from 'react';

const StubHubBooking = ({ match, onBack, onBook }) => {
  const [viewMode, setViewMode] = useState('stadium'); // 'stadium' or 'section'
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [quantity, setQuantity] = useState(2);
  const [maxPrice, setMaxPrice] = useState(5000);

  // Simulated Real-time inventory
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    // Realistic seat state logic:
    // Matches with high base price are "hot" and have more sold out seats
    const isHotMatch = match.priceBase > 200;

    if (selectedSection) {
      const seats = {};
      for (let i = 1; i <= 100; i++) {
        const rand = Math.random();
        const soldOutThreshold = isHotMatch ? 0.6 : 0.3; // 60% vs 30% sold out
        const lockedThreshold = isHotMatch ? 0.8 : 0.4; // More competition for hot matches

        if (rand < soldOutThreshold) seats[i] = 'soldout';
        else if (rand < lockedThreshold) seats[i] = 'locked';
        else seats[i] = 'available';
      }
      setInventory(seats);
    }
  }, [selectedSection, match.priceBase]);

  const toggleSeat = (id) => {
    if (inventory[id] === 'soldout' || inventory[id] === 'locked') return;
    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id));
    } else {
      if (selectedSeats.length < (typeof quantity === 'number' ? quantity : 10)) {
        setSelectedSeats([...selectedSeats, id]);
      }
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setViewMode('section');
    setSelectedSeats([]);
  };

  return (
    <div className="stubhub-booking-layout animate-in">
      <div className="booking-header">
        <button className="game-btn" onClick={viewMode === 'section' ? () => setViewMode('stadium') : onBack}>
          <span className="material-icons-round">arrow_back</span> {viewMode === 'section' ? 'Back to Map' : 'Exit'}
        </button>
        <div className="event-title">
          <h2>{match.home} vs {match.away}</h2>
          <p>{match.time} • {selectedSection ? `Section: ${selectedSection}` : 'Select a Section'}</p>
        </div>
      </div>

      <div className="booking-main-grid">
        {/* Left Sidebar */}
        <aside className="booking-filters">
          <div className="filter-group">
            <label>Tickets needed</label>
            <div className="qty-grid">
              {[1, 2, 3, 4, '5+'].map(q => (
                <button key={q} className={`qty-btn ${quantity === q ? 'active' : ''}`} onClick={() => setQuantity(q)}>{q}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div style={{ fontWeight: 800 }}>$100 - ${maxPrice}</div>
            <input type="range" min="100" max="5000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>

          <div className="ticket-listings mini-scroll">
            {match.sections.filter(s => s.price <= maxPrice && (!selectedSection || s.name.includes(selectedSection))).map((s, i) => (
              <div
                key={i}
                className={`listing-card ${selectedSection === s.name ? 'selected' : ''}`}
                onClick={() => handleSectionClick(s.name)}
              >
                <div className="listing-info">
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{s.name}</div>
                  <div className="tag green-tag" style={{ border: 'none', padding: '2px 6px', marginTop: '4px' }}>
                    $ {s.price} each
                  </div>
                </div>
                <button className="game-btn main" style={{ padding: '6px 12px' }}>Pick</button>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Interactive Map / Seat View */}
        <div className="stadium-map-container" style={{ position: 'relative', overflow: 'hidden' }}>
          {viewMode === 'stadium' ? (
            <div className="stadium-svg-wrapper zoom-in">
              <svg viewBox="0 0 400 300" className="stadium-svg">
                {/* Simplified Stadium Shape */}
                <rect x="50" y="50" width="300" height="200" rx="100" fill="none" stroke="var(--border-color)" strokeWidth="2" />
                <rect x="150" y="100" width="100" height="100" rx="4" fill="#22c55e" /> {/* Pitch */}

                {/* Clickable Sections */}
                {['LATERAL', 'TRIBUNA', 'GOL NORD', 'GOL SUD'].map((sec, idx) => {
                  const paths = {
                    'LATERAL': "M50,100 Q50,50 150,50 L150,250 Q50,250 50,200 Z",
                    'TRIBUNA': "M350,100 Q350,50 250,50 L250,250 Q350,250 350,200 Z",
                    'GOL NORD': "M160,40 L240,40 Q280,40 280,80 L120,80 Q120,40 160,40 Z",
                    'GOL SUD': "M160,260 L240,260 Q280,260 280,220 L120,220 Q120,260 160,260 Z"
                  };
                  return (
                    <path
                      key={sec}
                      d={paths[sec]}
                      className="map-section-path"
                      fill={selectedSection === sec ? 'var(--highlight)' : 'rgba(148, 163, 184, 0.1)'}
                      stroke="white"
                      strokeWidth="1"
                      onClick={() => handleSectionClick(sec)}
                    />
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="section-zoom-view animate-in">
              <div className="seat-legend">
                <span className="legend-item"><div className="dot available"></div> Available</span>
                <span className="legend-item"><div className="dot soldout"></div> Sold out</span>
                <span className="legend-item"><div className="dot locked"></div> Locked</span>
                <span className="legend-item"><div className="dot selected"></div> Selected</span>
              </div>
              <div className="seats-grid">
                {Object.keys(inventory).map(id => (
                  <div
                    key={id}
                    className={`seat ${inventory[id]} ${selectedSeats.includes(id) ? 'selected' : ''}`}
                    onClick={() => toggleSeat(id)}
                    title={`Seat ${id}`}
                  ></div>
                ))}
              </div>

              {selectedSeats.length > 0 && (
                <div className="booking-cta animate-in sleek-checkout">
                  <div className="cta-glass">
                    <div className="cta-info">
                      <span className="label">SECURED SEATS</span>
                      <strong className="value">{selectedSeats.length} Tickets</strong>
                    </div>
                    <div className="cta-divider"></div>
                    <div className="cta-info">
                      <span className="label">TOTAL PRICE</span>
                      <strong className="value highlight-text">${selectedSeats.length * match.priceBase}</strong>
                    </div>
                    <button className="checkout-btn-pro" onClick={() => { onBook({ matchId: match.id, seats: selectedSeats }); alert('Booking Confirmed! Check your email.'); setViewMode('stadium'); }}>
                      Complete Order <span className="material-icons-round">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StubHubBooking };
export default StubHubBooking;
