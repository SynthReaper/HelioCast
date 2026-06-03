/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [kp, setKp] = useState(null);
  const [wind, setWind] = useState(null);
  const [flares, setFlares] = useState(null);
  const [aurora, setAurora] = useState(null);
  const [sunspots, setSunspots] = useState(null);
  const [impact, setImpact] = useState(null);
  
  const [latitude, setLatitude] = useState('65');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(true);

  // Canvas Refs
  const auroraCanvasRef = useRef(null);
  const windSparklineRef = useRef(null);
  const kpChartRef = useRef(null);
  
  // Animation state
  const auroraParticles = useRef([]);

  const fetchData = async () => {
    setIsUpdating(true);
    try {
      const [kpRes, windRes, flaresRes, auroraRes, sunspotsRes, impactRes] = await Promise.all([
        fetch('/api/kp-index').then(r => r.json()),
        fetch('/api/wind').then(r => r.json()),
        fetch('/api/solar-flares').then(r => r.json()),
        fetch('/api/aurora').then(r => r.json()),
        fetch('/api/sunspots').then(r => r.json()),
        fetch('/api/impact').then(r => r.json())
      ]);

      setKp(kpRes);
      setWind(windRes);
      setFlares(flaresRes);
      setAurora(auroraRes);
      setSunspots(sunspotsRes);
      setImpact(impactRes);
    } catch (e) {
      console.error('Error fetching telemetry dashboard data:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Aurora Visualizer Animation loop
  useEffect(() => {
    const canvas = auroraCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Initialize particles
    if (auroraParticles.current.length === 0) {
      const count = 40;
      const list = [];
      for (let i = 0; i < count; i++) {
        list.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 1.5 + 0.5,
        });
      }
      auroraParticles.current = list;
    }

    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const intensity = aurora ? (aurora.northern.probability / 100) : 0.5;
      const particleColor = `rgba(16, 185, 129, ${0.15 + (intensity * 0.2)})`;

      auroraParticles.current.forEach(p => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
        grad.addColorStop(0, 'rgba(0, 212, 255, 0)');
        grad.addColorStop(0.5, particleColor);
        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + (intensity * 3);
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();

        // Update position
        p.y += p.speed * (0.8 + intensity);
        if (p.y > canvas.height) {
          p.y = -p.length;
          p.x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [aurora]);

  // Render Solar Wind Sparkline
  useEffect(() => {
    const canvas = windSparklineRef.current;
    if (!canvas || !wind || !wind.hourly_24h) return;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = 50;
    
    ctx.clearRect(0, 0, width, height);

    const speeds = wind.hourly_24h.map(d => d.speed);
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    const step = width / (wind.hourly_24h.length - 1);
    wind.hourly_24h.forEach((point, i) => {
      const x = i * step;
      const y = height - 5 - ((point.speed - min) / range) * (height - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // fill area
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }, [wind]);

  // Render Kp History Chart
  useEffect(() => {
    const canvas = kpChartRef.current;
    if (!canvas || !kp || !kp.historical_7day) return;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = 180;
    
    ctx.clearRect(0, 0, width, height);

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i += 3) {
      const y = height - 25 - (i / 9) * (height - 40);
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Outfit';
      ctx.fillText(i, 10, y + 4);
    }

    // Process data points
    const list = kp.historical_7day.slice(-14).reverse();
    const step = (width - 45) / (list.length - 1);
    
    ctx.beginPath();
    ctx.lineWidth = 3;
    
    const points = list.map((d, i) => {
      const x = 35 + i * step;
      const y = height - 25 - (d.value / 9) * (height - 40);
      return { x, y };
    });

    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const xc = (points[i - 1].x + p.x) / 2;
        const yc = (points[i - 1].y + p.y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
    });
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
    strokeGrad.addColorStop(0, '#7c3aed');
    strokeGrad.addColorStop(0.5, '#00d4ff');
    strokeGrad.addColorStop(1, '#ff4757');
    ctx.strokeStyle = strokeGrad;
    ctx.stroke();

    // Area Fill
    ctx.lineTo(points[points.length - 1].x, height - 20);
    ctx.lineTo(points[0].x, height - 20);
    ctx.closePath();
    
    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
    fillGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Labels
    list.forEach((p, i) => {
      if (i % 3 === 0) {
        const timeStr = new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Outfit';
        ctx.fillText(timeStr, points[i].x - 10, height - 5);
      }
    });
  }, [kp]);

  // Math for Kp circular gauge dashoffset (126 max)
  const kpValue = kp?.current?.value || 0;
  const kpOffset = 126 - (126 * kpValue / 9);

  // Aurora calculation
  const getAdjustedAuroraProb = () => {
    if (!aurora) return '0%';
    let base = aurora.northern.probability;
    if (latitude === '50') base = Math.max(0, base - 25);
    else if (latitude === '35') base = Math.max(0, base - 60);
    return `${base}%`;
  };

  const activeRegions = sunspots?.activeRegions || '---';
  const cycleProgress = sunspots?.solarCycleProgress || 0;

  return (
    <>
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🌟</span>
          <h1 className="logo-text">Helio<span className="highlight">Cast</span></h1>
        </div>
        <div className="header-status">
          <div className={`status-indicator ${isLive ? 'live' : ''}`}></div>
          <span>{isLive ? 'Live Telemetry Active' : 'Polling telemetry...'}</span>
          <button onClick={fetchData} className="btn-primary-sm" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Row 1 */}
        <section className="card stats-card" id="kp-card">
          <div className="card-header">
            <h2>Geomagnetic Storm Status</h2>
            <span className="badge">{kp?.stormLevel?.level || 'G0'}</span>
          </div>
          <div className="kp-display">
            <div className="kp-gauge">
              <svg viewBox="0 0 100 50" className="gauge-svg">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#2a2f42" strokeWidth="8" strokeLinecap="round"/>
                <path 
                  id="kp-gauge-fill" 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="url(#kp-gradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray="126" 
                  strokeDashoffset={kpOffset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
                <defs>
                  <linearGradient id="kp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4caf50" />
                    <stop offset="50%" stopColor="#ffc03d" />
                    <stop offset="100%" stopColor="#ff4757" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="kp-value-center">
                <span className="kp-num">{kpValue}</span>
                <span className="kp-label">Kp Index</span>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <p>{kp?.stormLevel?.description || 'Quiet'} conditions observed.</p>
          </div>
        </section>

        <section className="card stats-card" id="solar-wind-card">
          <div className="card-header">
            <h2>Solar Wind Stream</h2>
            <span className={`status-dot ${wind?.current?.speed > 600 ? 'red' : 'green'}`}></span>
          </div>
          <div className="metric-container">
            <div className="metric-block">
              <span className="metric-label">Velocity</span>
              <span className="metric-value">{wind?.current?.speed || '---'} <span className="unit">km/s</span></span>
            </div>
            <div className="metric-block">
              <span className="metric-label">Density</span>
              <span className="metric-value">{wind?.current?.density || '---'} <span className="unit">p/cm³</span></span>
            </div>
          </div>
          <div className="sparkline-container">
            <canvas ref={windSparklineRef} height="50"></canvas>
          </div>
        </section>

        <section className="card stats-card" id="solar-flares-card">
          <div className="card-header">
            <h2>Recent Solar Flares</h2>
            <span className="alert-count">{flares?.flares?.length || 0} in 24h</span>
          </div>
          <div className="flare-list-container">
            <ul id="flare-list" className="styled-list">
              {(!flares || flares.flares.length === 0) ? (
                <li className="empty-list">No major solar flares recorded.</li>
              ) : (
                flares.flares.slice(0, 4).map((f, i) => (
                  <li key={i} className={`flare-item class-${f.classValue}`}>
                    <div>
                      <strong>{f.classValue}{f.intensity}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>AR {f.activeRegion}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(f.peakTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="card-footer flare-prob-footer">
            <span>X-Class Probability (24h):</span>
            <strong>{flares?.flares?.[0]?.x1Probability24h || 12}%</strong>
          </div>
        </section>

        {/* Row 2 */}
        <section className="card large-card" id="aurora-forecast-card">
          <div className="card-header">
            <h2>Aurora Visibility & Forecast</h2>
            <div className="location-selector">
              <label htmlFor="lat-select">Latitude Check:</label>
              <select 
                id="lat-select" 
                className="theme-select" 
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              >
                <option value="65">High (e.g. Iceland, Alaska)</option>
                <option value="50">Mid (e.g. Northern US, UK)</option>
                <option value="35">Low (e.g. Southern US, Europe)</option>
              </select>
            </div>
          </div>
          <div className="aurora-forecast-layout">
            <div className="aurora-visualizer">
              <div className="aurora-glow-circle">
                <span className="glow-val">{getAdjustedAuroraProb()}</span>
                <span className="glow-label">Probability</span>
              </div>
              <canvas ref={auroraCanvasRef} width="200" height="200"></canvas>
            </div>
            <div className="aurora-details">
              <div className="forecast-timeline">
                <h3>3-Day Trend & Optimal Locations</h3>
                <div id="aurora-optimal-places" className="tags-container">
                  {aurora?.northern?.optimalLocations?.slice(0, 3).map((place, i) => (
                    <span key={i} className="tag">{place}</span>
                  ))}
                </div>
                <div className="forecast-bars">
                  {aurora?.northern?.forecast_24h?.slice(0, 5).map((step, i) => (
                    <div key={i} className="forecast-bar-row">
                      <span className="forecast-time">
                        {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="forecast-bar-container">
                        <div className="forecast-fill" style={{ width: `${step.probability}%` }}></div>
                      </div>
                      <span className="forecast-val">{step.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card" id="mission-impact-card">
          <div className="card-header">
            <h2>Earth & Space Infrastructure Impact</h2>
          </div>
          <div className="impact-grid">
            <div className="impact-item">
              <span className="impact-icon">🛰️</span>
              <div className="impact-details">
                <h4>Satellites & Spacecraft</h4>
                <span className={`status-pill status-${impact?.satellites?.status || 'nominal'}`}>
                  {impact?.satellites?.status || 'nominal'}
                </span>
              </div>
            </div>
            <div className="impact-item">
              <span className="impact-icon">⚡</span>
              <div className="impact-details">
                <h4>Power Grid Stability</h4>
                <span className={`status-pill status-${impact?.power_grids?.status || 'nominal'}`}>
                  {impact?.power_grids?.status || 'nominal'}
                </span>
              </div>
            </div>
            <div className="impact-item">
              <span className="impact-icon">🗺️</span>
              <div className="impact-details">
                <h4>GPS & Navigation</h4>
                <span className={`status-pill status-${impact?.gps?.status || 'nominal'}`}>
                  {impact?.gps?.status || 'nominal'}
                </span>
              </div>
            </div>
            <div className="impact-item">
              <span className="impact-icon">📻</span>
              <div className="impact-details">
                <h4>HF Radio Communications</h4>
                <span className={`status-pill status-${impact?.radio?.status || 'nominal'}`}>
                  {impact?.radio?.status || 'nominal'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Row 3 */}
        <section className="card large-card" id="charts-card">
          <div className="card-header">
            <h2>Geomagnetic Kp Index Trend</h2>
            <span className="card-subtitle">Historical 7-Day Observation</span>
          </div>
          <div className="chart-wrapper">
            <canvas ref={kpChartRef} height="150"></canvas>
          </div>
        </section>

        <section className="card" id="sunspot-card">
          <div className="card-header">
            <h2>Sunspot Activity</h2>
            <span className="badge info-badge">Cycle 25</span>
          </div>
          <div className="sunspot-container">
            <div className="sunspot-count-block">
              <span className="sunspot-number">{activeRegions}</span>
              <span className="sunspot-label">Active Sunspots</span>
            </div>
            <div className="cycle-progress">
              <div className="progress-bar-label">
                <span>Cycle Progress</span>
                <span>{cycleProgress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${cycleProgress}%` }}></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <p>HelioCast — Premium Space Weather Station. Powered by NOAA SWPC and NASA API.</p>
        <p style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '0.5px' }}>
          Designed and engineered by <a href="https://github.com/SynthReaper" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>SynthReaper</a>
        </p>
      </footer>
    </>
  );
}
