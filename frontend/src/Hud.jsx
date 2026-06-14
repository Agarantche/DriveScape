import "./Hud.css";

// Minimal inline icons (stroke = currentColor) so we don't pull in an icon dependency yet.
const ICONS = {
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 14.6V21M9.7 11 4.3 8M14.3 11l5.4-3" />
    </>
  ),
  flame: (
    <path d="M12 3c2.8 3.6 4.5 5.9 4.5 8.6a4.5 4.5 0 0 1-9 0c0-1.3.5-2.5 1.4-3.5.6.8 1.3 1.2 2 1.2C9.5 7.6 10.4 5.7 12 3Z" />
  ),
  camera: (
    <>
      <path d="M4 8h2.3l1.3-2h8.8l1.3 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="12.8" r="3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.8 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.2 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </>
  ),
  ruler: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="1" />
      <path d="M7 8.5v2.6M11 8.5v3.4M15 8.5v2.6M19 8.5v3.4" />
    </>
  ),
  wave: <path d="M2.5 15c2 0 2.3-6 4.7-6s2.8 6 4.8 6 2.4-6 4.7-6" />,
  mountain: <path d="M3 19 9 8l3.2 5.2L15.5 8 21 19Z" />,
  bolt: <path d="M13 2 5.5 13H11l-1 9 8.5-12H12Z" />,
};

function Icon({ name, size = 16, className = "" }) {
  return (
    <svg
      className={`hud-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

const DIFFICULTY_BARS = { easy: 2, moderate: 3, hard: 4, expert: 5 };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

function DifficultyMeter({ difficulty }) {
  const filled = DIFFICULTY_BARS[String(difficulty).toLowerCase()] ?? 3;
  return (
    <div className="hud-meter">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`hud-bar${i <= filled ? " hud-bar--on" : ""}`} />
      ))}
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="hud-stat">
      <div className="hud-stat__val">
        <Icon name={icon} size={14} className="hud-muted" />
        {value ?? "—"}
      </div>
      <div className="hud-stat__label">{label}</div>
    </div>
  );
}

// Static for now — becomes live once we read speed from the Geolocation API.
function Speedometer({ speed = 58, max = 120 }) {
  const polar = (deg) => {
    const a = (deg * Math.PI) / 180;
    return [70 + 56 * Math.cos(a), 70 + 56 * Math.sin(a)];
  };
  // 240-degree gauge opening at the bottom, starting bottom-left (150 deg) over the top.
  const arc = (frac) => {
    const [sx, sy] = polar(150);
    const [ex, ey] = polar(150 + 240 * frac);
    const large = 240 * frac > 180 ? 1 : 0;
    return `M${sx.toFixed(1)},${sy.toFixed(1)} A56,56 0 ${large} 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
  };
  const frac = Math.max(0, Math.min(1, speed / max));
  return (
    <div className="hud-speed">
      <svg width="150" height="118" viewBox="0 0 140 112">
        <path className="hud-speed__track" d={arc(1)} fill="none" strokeWidth="8" strokeLinecap="round" />
        <path className="hud-speed__val" d={arc(frac)} fill="none" strokeWidth="8" strokeLinecap="round" />
        <text x="70" y="66" textAnchor="middle" className="hud-speed__num">
          {Math.round(speed)}
        </text>
        <text x="70" y="86" textAnchor="middle" className="hud-speed__unit">
          mph
        </text>
      </svg>
      <div className="hud-speed__gear">
        <span>D4</span> · 4,200 rpm
      </div>
    </div>
  );
}

export default function Hud({ route, backendStatus }) {
  const online = backendStatus && backendStatus !== "offline" && backendStatus !== "Checking...";
  const name = route?.name ?? "Finding scenic routes…";
  const vibe = route?.vibe ?? "—";
  const difficulty = route?.difficulty ?? "moderate";

  return (
    <div className="hud">
      <div className="hud__scrim" />

      <div className="hud-wordmark">
        <div className="hud-wordmark__badge">
          <Icon name="wheel" size={18} />
        </div>
        <div>
          <div className="hud-wordmark__title">
            DriveScape
            <span
              className={`hud-dot ${online ? "hud-dot--on" : "hud-dot--off"}`}
              title={online ? "Backend online" : `Backend: ${backendStatus}`}
            />
          </div>
          <div className="hud-wordmark__sub">Discovery drive</div>
        </div>
      </div>

      <div className="hud-panel hud-score">
        <Icon name="flame" size={18} />
        <div>
          <div className="hud-label">Discovery score</div>
          <div className="hud-score__val">
            1,250 <span>+250</span>
          </div>
        </div>
      </div>

      <div className="hud-panel hud-overlook">
        <div className="hud-overlook__head">
          <Icon name="camera" size={17} className="hud-accent" />
          <span className="hud-overlook__title">Scenic overlook</span>
          <span className="hud-ping" />
        </div>
        <div className="hud-overlook__sub">1.2 mi ahead · photo op · +250 pts</div>
      </div>

      <div className="hud-panel hud-route">
        <div className="hud-route__eyebrow">
          <Icon name="pin" size={14} className="hud-muted" /> Current route
        </div>
        <div className="hud-route__name">{name}</div>
        <div>
          <span className="hud-chip">{vibe}</span>
        </div>
        <div className="hud-route__diff">
          <span className="hud-label">Difficulty</span>
          <div className="hud-route__diffright">
            <DifficultyMeter difficulty={difficulty} />
            <span className="hud-route__difftag">{cap(difficulty)}</span>
          </div>
        </div>
        <div className="hud-route__stats">
          <Stat icon="ruler" value={route?.lengthMi} label="miles" />
          <Stat icon="wave" value={route?.curves} label="curves" />
          <Stat icon="mountain" value={route?.elevationFt} label="ft climb" />
        </div>
      </div>

      <Speedometer speed={58} />

      <div className="hud-panel hud-skill">
        <div className="hud-skill__head">
          <span>
            <Icon name="bolt" size={16} className="hud-accent" /> Skill chain
          </span>
          <span className="hud-skill__mult">×2.4</span>
        </div>
        <div className="hud-skill__bar">
          <div style={{ width: "72%" }} />
        </div>
        <div className="hud-skill__foot">
          <span>Clean driving</span>
          <span>+180 style</span>
        </div>
      </div>
    </div>
  );
}
