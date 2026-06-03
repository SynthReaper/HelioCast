'use client';

/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  // Telemetry API States
  const [kp, setKp] = useState(null);
  const [wind, setWind] = useState(null);
  const [flares, setFlares] = useState(null);
  const [aurora, setAurora] = useState(null);
  const [sunspots, setSunspots] = useState(null);
  const [impact, setImpact] = useState(null);

  // UI Interactive States
  const [activeTab, setActiveTab] = useState('console'); // console, aurora, flares, impact, glossary
  const [latitude, setLatitude] = useState('65');
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Canvas Refs
  const auroraCanvasRef = useRef(null);
  const windSparklineRef = useRef(null);
  const kpChartRef = useRef(null);
  const sunSphereRef = useRef(null);

  // Audio nodes refs
  const audioCtxRef = useRef(null);
  const humOscRef = useRef(null);

  // Particle tracker
  const auroraParticles = useRef([]);

  // Solar Sphere angle rotation tracker
  const solarRotationAngle = useRef(0);

  // Append items to logs
  const appendLog = (tag, message) => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      tag,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // Initialize Speech Synthesis & Audio Synth Hum
  const toggleAudio = () => {
    if (!audioEnabled) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Space hum oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        humOscRef.current = osc;
        setAudioEnabled(true);
        speakSpeech("Telemetry sound systems initialized. Space hum online.");
        appendLog('SYSTEM', 'Audio synthesis engine initialized.');
      } catch (e) {
        console.error('Audio initialization failed', e);
      }
    } else {
      if (humOscRef.current) {
        try { humOscRef.current.stop(); } catch(e){}
        humOscRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch(e){}
        audioCtxRef.current = null;
      }
      setAudioEnabled(false);
      appendLog('SYSTEM', 'Audio synthesis engine deactivated.');
    }
  };

  const speakSpeech = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
      if (premiumVoice) utterance.voice = premiumVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Run initial state loading
  const fetchData = async () => {
    setIsUpdating(true);
    try {
      const [kpRes, windRes, flaresRes, auroraRes, sunspotsRes, impactRes] = await Promise.all([
        fetch('/api/kp-index').then(r => r.json()),
        fetch('/api/wind').then(r => r.json()),
        fetch('/api/solar-flares').then(r => r.json()),
        fetch(`/api/aurora?lat=${latitude}`).then(r => r.json()),
        fetch('/api/sunspots').then(r => r.json()),
        fetch('/api/impact').then(r => r.json())
      ]);

      setKp(kpRes);
      setWind(windRes);
      setFlares(flaresRes);
      setAurora(auroraRes);
      setSunspots(sunspotsRes);
      setImpact(impactRes);

      appendLog('NOAA-DSCOVR', `Updated space telemetry: Wind velocity ${windRes.current.speed}km/s, Kp index ${kpRes.current.value}`);
      
      // Trigger voice warning on elevated Kp
      if (audioEnabled && kpRes.current.value >= 5) {
        speakSpeech(`Warning. Planetary Kp index is currently elevated at level ${kpRes.current.value}. Geomagnetic storm active.`);
      }
    } catch (e) {
      appendLog('ERROR', 'Telemetry synchronizer link failure. Retrying stream connection.');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
    appendLog('SYSTEM', 'Console mainframe boot verification successful.');
    
    const interval = setInterval(fetchData, 90000);
    return () => {
      clearInterval(interval);
      if (humOscRef.current) humOscRef.current.stop();
    };
  }, []);

  // Update dynamic aurora details immediately when selected latitude changes
  useEffect(() => {
    const fetchAuroraOnly = async () => {
      try {
        const res = await fetch(`/api/aurora?lat=${latitude}`).then(r => r.json());
        setAurora(prev => {
          if (!prev) return res;
          return {
            ...prev,
            northern: res.northern,
            southern: res.southern,
            userLocation: res.userLocation
          };
        });
      } catch (e) {
        console.error('Failed to update dynamic aurora data', e);
      }
    };
    
    // Only run if we already initialized or on lat change
    if (kp) {
      fetchAuroraOnly();
    }
  }, [latitude]);

  // CSV Telemetry exporter
  const exportToCSV = () => {
    const dataRows = [
      ["Parameter", "Value", "Units"],
      ["Planetary Kp Index", kp?.current?.value || 0, ""],
      ["Solar Wind Speed", wind?.current?.speed || 0, "km/s"],
      ["Solar Wind Density", wind?.current?.density || 0, "p/cm³"],
      ["Active Sunspots Count", sunspots?.activeRegions || 0, ""],
      ["Cycle 25 Progress", `${sunspots?.solarCycleProgress || 0}%`, ""],
      ["X-Class Flare Probability", `${flares?.flares?.[0]?.x1Probability24h || 12}%`, ""]
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + dataRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `heliocast_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    appendLog('SYSTEM', 'Exported telemetry metrics log as CSV.');
  };

  // Aurora Canvas particle renderer (Light colors)
  useEffect(() => {
    if (activeTab !== 'console' && activeTab !== 'aurora') return;
    const canvas = auroraCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (auroraParticles.current.length === 0) {
      const count = 40;
      for (let i = 0; i < count; i++) {
        auroraParticles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 20 + 8,
          speed: Math.random() * 1.2 + 0.4
        });
      }
    }

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const prob = aurora ? aurora.northern.probability : 50;
      const intensity = prob / 100;
      // Glowing soft teal for light mode background
      const color = `rgba(13, 148, 136, ${0.25 + intensity * 0.35})`;

      auroraParticles.current.forEach(p => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + intensity * 3;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();

        p.y += p.speed * (0.8 + intensity);
        if (p.y > canvas.height) {
          p.y = -p.length;
          p.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [aurora, activeTab]);

  // Sparkline generator (Light mode styling)
  useEffect(() => {
    if (activeTab !== 'console') return;
    const canvas = windSparklineRef.current;
    if (!canvas || !wind || !wind.hourly_24h) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = 50;

    ctx.clearRect(0, 0, width, height);
    const speeds = wind.hourly_24h.map(w => w.speed);
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#0284c7'; // Light mode blue
    ctx.lineWidth = 2;
    const step = width / (wind.hourly_24h.length - 1);
    wind.hourly_24h.forEach((point, i) => {
      const x = i * step;
      const y = height - 5 - ((point.speed - min) / range) * (height - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(2, 132, 199, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }, [wind, activeTab]);

  // Kp History chart generator (Light mode styling)
  useEffect(() => {
    if (activeTab !== 'console' && activeTab !== 'flares') return;
    const canvas = kpChartRef.current;
    if (!canvas || !kp || !kp.historical_7day) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = 180;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i += 3) {
      const y = height - 25 - (i / 9) * (height - 40);
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
      
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Space Grotesk';
      ctx.fillText(i, 10, y + 4);
    }

    const list = kp.historical_7day.slice(0, 56).reverse();
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
    strokeGrad.addColorStop(0, '#4f46e5');
    strokeGrad.addColorStop(0.5, '#0284c7');
    strokeGrad.addColorStop(1, '#dc2626');
    ctx.strokeStyle = strokeGrad;
    ctx.stroke();

    ctx.lineTo(points[points.length - 1].x, height - 20);
    ctx.lineTo(points[0].x, height - 20);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(2, 132, 199, 0.12)');
    fillGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    list.forEach((p, i) => {
      if (i % 8 === 0) {
        const dateStr = new Date(p.time).toLocaleDateString([], { month: 'short', day: 'numeric' });
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Space Grotesk';
        ctx.fillText(dateStr, points[i].x - 10, height - 5);
      }
    });
  }, [kp, activeTab]);

  // 3D Rotating Solar sphere canvas generator (Warm gold wireframe)
  useEffect(() => {
    if (activeTab !== 'console' && activeTab !== 'flares') return;
    const canvas = sunSphereRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width = 120;
    const height = canvas.height = 120;
    const radius = 50;
    const centerX = width / 2;
    const centerY = height / 2;

    let animId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Rotating angle
      solarRotationAngle.current += 0.007;

      // Glow outer circle
      ctx.beginPath();
      const glow = ctx.createRadialGradient(centerX, centerY, radius - 10, centerX, centerY, radius + 15);
      glow.addColorStop(0, 'rgba(217, 119, 6, 0.25)');
      glow.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
      ctx.fill();

      // Sun body background
      ctx.beginPath();
      ctx.fillStyle = '#fffdfa';
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw wireframe latitude rings
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.25)';
      ctx.lineWidth = 1;
      
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const r = radius * Math.cos(latRad);
        const y = centerY + radius * Math.sin(latRad);
        
        ctx.beginPath();
        ctx.ellipse(centerX, y, r, r * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw wireframe rotating longitudinal lines
      for (let lon = 0; lon < 360; lon += 45) {
        const currentLon = (lon + (solarRotationAngle.current * 180 / Math.PI)) % 360;
        const lonRad = (currentLon * Math.PI) / 180;
        
        if (Math.sin(lonRad) >= 0) {
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, Math.abs(radius * Math.cos(lonRad)), radius, 0, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        }
      }

      // Border contour outline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Render active region coordinates (flashing sunspots)
      const sunspotsCount = sunspots?.activeRegions || 3;
      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < Math.min(sunspotsCount, 4); i++) {
        const spotLon = (45 * i + (solarRotationAngle.current * 180 / Math.PI)) % 360;
        const spotLonRad = (spotLon * Math.PI) / 180;

        if (Math.sin(spotLonRad) >= 0) {
          const x = centerX + radius * Math.cos(spotLonRad) * 0.7;
          const y = centerY + (i - 1.5) * 15;
          ctx.beginPath();
          ctx.arc(x, y, 2.5 + Math.sin(solarRotationAngle.current * 6) * 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [sunspots, activeTab]);

  const getOptimalLocations = () => {
    if (latitude === '65') {
      return [
        'Reykjavik, Iceland',
        'Fairbanks, Alaska',
        'Tromsø, Norway',
        'Yellowknife, Canada',
        'Murmansk, Russia'
      ];
    } else if (latitude === '50') {
      return [
        'Edinburgh, Scotland',
        'Calgary, Canada',
        'Oslo, Norway',
        'Stockholm, Sweden',
        'Vancouver, Canada'
      ];
    } else {
      return [
        'Seattle, USA',
        'Chicago, USA',
        'London, UK',
        'Toronto, Canada',
        'Berlin, Germany'
      ];
    }
  };

  const kpValueNum = kp?.current?.value || 0;
  const kpGaugeOffset = 126 - (126 * kpValueNum / 9);

  const activeRegions = sunspots?.activeRegions || '---';
  const cycleProgress = sunspots?.solarCycleProgress || 0;

  // Compile active warnings for the notification dropdown list
  const activeAlertsList = [];
  if (kpValueNum >= 5) activeAlertsList.push({ type: 'warning', text: `Active storm: Kp index is currently level ${kpValueNum}` });
  if (wind?.current?.speed > 550) activeAlertsList.push({ type: 'info', text: `Elevated solar wind velocity: ${wind.current.speed} km/s` });
  if (flares?.flares?.[0]?.classValue === 'X') activeAlertsList.push({ type: 'critical', text: `Severe eruption warning: X-class solar flare active` });

  return (
    <>
      <div className="stars-bg"></div>
      <div className="nebula-bg"></div>
      
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🌟</span>
          <h1 className="logo-text">Helio<span className="highlight">Cast</span></h1>
        </div>
        <div className="header-status">
          <label className="audio-toggle">
            <input type="checkbox" checked={audioEnabled} onChange={toggleAudio} style={{ cursor: 'pointer' }} />
            <span>Audio Speech Alerts</span>
          </label>
          
          <div className="notifications-dropdown">
            <button className="dropdown-toggle" onClick={() => setShowNotifications(!showNotifications)}>
              🔔 Notifications <span className="badge" style={{ background: activeAlertsList.length > 0 ? 'var(--danger)' : 'rgba(0,0,0,0.05)', color: activeAlertsList.length > 0 ? '#fff' : 'inherit' }}>{activeAlertsList.length}</span>
            </button>
            {showNotifications && (
              <ul className="dropdown-menu">
                {activeAlertsList.length === 0 ? (
                  <li className="dropdown-item" style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>No active space storm alerts.</li>
                ) : (
                  activeAlertsList.map((a, i) => (
                    <li key={i} className={`dropdown-item alert-${a.type}`}>
                      <div className="alert-header">
                        <strong>{a.type.toUpperCase()}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LIVE</span>
                      </div>
                      <p>{a.text}</p>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <div className="status-indicator live"></div>
          <span>NOAA Feeds Online</span>
          <button onClick={fetchData} className="btn-primary-sm" disabled={isUpdating}>
            {isUpdating ? 'SYNCING...' : 'SYNC CORE'}
          </button>
        </div>
      </header>

      <div className="console-workspace">
        <aside className="sidebar">
          <span className="sidebar-title">NAVIGATION</span>
          <nav className="sidebar-menu">
            <button className={`menu-btn ${activeTab === 'console' ? 'active' : ''}`} onClick={() => setActiveTab('console')}>
              🛰️ System Console
            </button>
            <button className={`menu-btn ${activeTab === 'aurora' ? 'active' : ''}`} onClick={() => setActiveTab('aurora')}>
              🟢 Aurora Tracker
            </button>
            <button className={`menu-btn ${activeTab === 'flares' ? 'active' : ''}`} onClick={() => setActiveTab('flares')}>
              🔥 Solar Flare Analytics
            </button>
            <button className={`menu-btn ${activeTab === 'impact' ? 'active' : ''}`} onClick={() => setActiveTab('impact')}>
              🏢 Infrastructures Risk
            </button>
            <button className={`menu-btn ${activeTab === 'glossary' ? 'active' : ''}`} onClick={() => setActiveTab('glossary')}>
              📚 Space Glossary
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="btn-primary-sm" onClick={exportToCSV} style={{ width: '100%', fontSize: '0.8rem' }}>
              EXPORT DATA (.CSV)
            </button>
          </div>
        </aside>

        <section className="console-viewport">
          
          {/* Tab 1: Systems Overview Console */}
          {activeTab === 'console' && (
            <div className="dashboard-grid">
              
              <section className="card stats-card">
                <div className="card-header">
                  <h2>Geomagnetic Storm Status</h2>
                  <span className="badge">{kp?.stormLevel?.level || 'G0'}</span>
                </div>
                <div className="kp-display">
                  <div className="kp-gauge">
                    <svg viewBox="0 0 100 50" className="gauge-svg">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round"/>
                      <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="url(#kp-gradient)" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        strokeDasharray="126" 
                        strokeDashoffset={kpGaugeOffset}
                        style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                      />
                      <defs>
                        <linearGradient id="kp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0d9488" />
                          <stop offset="50%" stopColor="#d97706" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="kp-value-center">
                      <span className="kp-num">{kpValueNum}</span>
                      <span className="kp-label">Kp Index</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <p>{kp?.stormLevel?.description || 'Quiet'} conditions observed.</p>
                </div>
              </section>

              <section className="card stats-card">
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

              <section className="card stats-card">
                <div className="card-header">
                  <h2>Active Regions & Sunspots</h2>
                  <span className="badge info-badge">Cycle 25</span>
                </div>
                <div className="sunspot-container">
                  <div className="sunspot-layout">
                    <canvas ref={sunSphereRef} width="120" height="120" className="sun-sphere-canvas"></canvas>
                    <div className="cycle-progress">
                      <span className="metric-label">Sunspot count</span>
                      <span className="metric-value" style={{ color: 'var(--warning)' }}>{activeRegions}</span>
                      <div className="progress-track" style={{ marginTop: '0.4rem' }}>
                        <div className="progress-fill" style={{ width: `${cycleProgress}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card large-card">
                <div className="card-header">
                  <h2>Geomagnetic Kp Index Trend</h2>
                  <span className="card-subtitle">Historical 7-Day Observation</span>
                </div>
                <div className="chart-wrapper">
                  <canvas ref={kpChartRef} height="150"></canvas>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2>Telecommunications Status</h2>
                </div>
                <div className="impact-grid">
                  <div className="impact-item">
                    <span className="impact-icon">🛰️</span>
                    <div className="impact-details">
                      <h4>Satellite Systems</h4>
                      <span className={`status-pill status-${impact?.satellites?.status || 'nominal'}`}>{impact?.satellites?.status || 'nominal'}</span>
                    </div>
                  </div>
                  <div className="impact-item">
                    <span className="impact-icon">📻</span>
                    <div className="impact-details">
                      <h4>HF Radios</h4>
                      <span className={`status-pill status-${impact?.radio?.status || 'nominal'}`}>{impact?.radio?.status || 'nominal'}</span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* Tab 2: Aurora Tracker */}
          {activeTab === 'aurora' && (
            <div className="dashboard-grid">
              <section className="card large-card">
                <div className="card-header">
                  <h2>Aurora Northern probability Grid</h2>
                  <div className="location-selector">
                    <label style={{ marginRight: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latitudinal Target:</label>
                    <select className="theme-select" value={latitude} onChange={(e) => setLatitude(e.target.value)}>
                      <option value="65">High Latitudes (&gt;60° N)</option>
                      <option value="50">Mid Latitudes (45°-60° N)</option>
                      <option value="35">Low Latitudes (&lt;45° N)</option>
                    </select>
                  </div>
                </div>
                <div className="aurora-forecast-layout">
                  <div className="aurora-visualizer">
                    <div className="aurora-glow-circle">
                      <span className="glow-val">
                        {aurora?.northern?.probability !== undefined ? `${aurora.northern.probability}%` : '0%'}
                      </span>
                      <span className="glow-label">Probability</span>
                    </div>
                    <canvas ref={auroraCanvasRef} width="200" height="200"></canvas>
                  </div>
                  <div className="aurora-details">
                    <div className="forecast-timeline">
                      <h3>Optimal viewing zones</h3>
                      <div className="tags-container">
                        {(aurora?.northern?.optimalLocations || getOptimalLocations()).map((loc, idx) => (
                          <span key={idx} className="tag">{loc}</span>
                        ))}
                      </div>
                      <h3>Hour predictions</h3>
                      <div className="forecast-bars">
                        {aurora?.northern?.forecast_24h?.slice(0, 4).map((step, idx) => (
                          <div key={idx} className="forecast-bar-row">
                            <span className="forecast-time">{new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="forecast-bar-container">
                              <div className="forecast-fill" style={{ width: `${Math.round(step.probability)}%` }}></div>
                            </div>
                            <span className="forecast-val">{Math.round(step.probability)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2>Polar Route Advisories</h2>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                  During high Kp levels, polar flights are redirected to lower latitudes to avoid radiation exposure and GPS errors.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <span className="metric-label">Southern hemisphere prob</span>
                  <span className="metric-value">{aurora?.southern?.probability || 10}%</span>
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: Flare Analytics */}
          {activeTab === 'flares' && (
            <div className="dashboard-grid">
              <section className="card large-card">
                <div className="card-header">
                  <h2>Active Flare Telemetry Log</h2>
                  <span className="badge">{flares?.flares?.length || 0} Events in 24h</span>
                </div>
                <div className="flare-list-container">
                  <ul className="styled-list">
                    {!flares || flares.flares.length === 0 ? (
                      <li className="empty-list">No recorded solar eruptions.</li>
                    ) : (
                      flares.flares.map((f, i) => (
                        <li key={i} className={`flare-item class-${f.classValue}`}>
                          <div>
                            <strong>Class {f.classValue}{f.intensity}</strong>
                            <span style={{ marginLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Region: AR {f.activeRegion}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(f.peakTime).toLocaleString()}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2>X-Ray Eruption Probabilities</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label">X-class chance (24h)</span>
                    <span className="metric-value" style={{ color: 'var(--danger)' }}>{flares?.flares?.[0]?.x1Probability24h || 12}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label">M-class chance (24h)</span>
                    <span className="metric-value" style={{ color: 'var(--warning)' }}>45%</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Tab 4: Infrastructure Grid Risks */}
          {activeTab === 'impact' && (
            <div className="dashboard-grid">
              <section className="card full-card">
                <div className="card-header">
                  <h2>Infrastructure Matrix Integrity Report</h2>
                </div>
                <div className="impact-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  
                  <div className="impact-item">
                    <span className="impact-icon" style={{ fontSize: '2rem' }}>🛰️</span>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>Satellite Navigation</h4>
                      <span className={`status-pill status-${impact?.satellites?.status || 'nominal'}`}>{impact?.satellites?.status || 'nominal'}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{impact?.satellites?.reason || 'Nominal telemetry'}</p>
                    </div>
                  </div>

                  <div className="impact-item">
                    <span className="impact-icon" style={{ fontSize: '2rem' }}>⚡</span>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>Power Grids</h4>
                      <span className={`status-pill status-${impact?.power_grids?.status || 'nominal'}`}>{impact?.power_grids?.status || 'nominal'}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{impact?.power_grids?.reason || 'Nominal telemetry'}</p>
                    </div>
                  </div>

                  <div className="impact-item">
                    <span className="impact-icon" style={{ fontSize: '2rem' }}>📻</span>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>Aviation Radios</h4>
                      <span className={`status-pill status-${impact?.radio?.status || 'nominal'}`}>{impact?.radio?.status || 'nominal'}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{impact?.radio?.reason || 'Nominal telemetry'}</p>
                    </div>
                  </div>

                </div>
              </section>
            </div>
          )}

          {/* Tab 5: Space Glossary Almanac */}
          {activeTab === 'glossary' && (
            <div className="glossary-grid">
              <div className="glossary-item">
                <h3>Planetary Kp Index</h3>
                <p>
                  A global geomagnetic activity index measured by ground-based magnetometers. It scales from 0 (quiet) to 9 (extreme geomagnetic storm). Values above 5 indicate active geomagnetic conditions that can cause visible auroras.
                </p>
              </div>

              <div className="glossary-item">
                <h3>Coronal Mass Ejections (CMEs)</h3>
                <p>
                  Giant bubbles of magnetized plasma ejected from the Sun's corona into the solar system. When directed toward Earth, they can compress the magnetosphere and trigger severe geomagnetic storm induction currents in power lines.
                </p>
              </div>

              <div className="glossary-item">
                <h3>Solar Flare Classification</h3>
                <p>
                  Flares are classified as A, B, C, M, or X based on peak X-ray flux. Each letter represents a tenfold increase in energy. M-class flares can cause brief radio blackouts, while X-class eruptions represent massive energy releases capable of disrupting global satellite networks.
                </p>
              </div>

              <div className="glossary-item">
                <h3>Solar Wind Stream</h3>
                <p>
                  A continuous flow of charged particles (electrons and protons) escaping from the Sun's upper atmosphere. The wind carries the Sun's magnetic field out into space. Normal speeds range from 300 to 450 km/s, while coronal holes can produce high-speed streams exceeding 750 km/s.
                </p>
              </div>
            </div>
          )}

        </section>
      </div>

      <footer className="terminal-log">
        <div className="terminal-header">
          <span>HARDWARE SYSTEM STDOUT STREAM</span>
          <span>BAUD RATE: 9600</span>
        </div>
        <ul className="terminal-stdout">
          {logs.length === 0 ? (
            <li><span className="log-time">[00:00:00]</span> <span className="log-tag">[SYSTEM]</span> Verifying terminal outputs. Awaiting hardware socket...</li>
          ) : (
            logs.map(log => (
              <li key={log.id}>
                <span className="log-time">[{log.time}]</span>
                <span className="log-tag">[{log.tag}]</span>
                <span>{log.message}</span>
              </li>
            ))
          )}
        </ul>
      </footer>

      <footer className="app-footer">
        <p>HelioCast Systems © 2026. Data sourced live from NOAA SWPC and NASA planetary indexes.</p>
        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
          Developed and customized by <a href="https://github.com/SynthReaper" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>SynthReaper</a>
        </p>
      </footer>
    </>
  );
}
