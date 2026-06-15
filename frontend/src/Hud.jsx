import "./Hud.css";
import Icon from "./Icon.jsx";

const DIFFICULTY_BARS = { easy: 2, moderate: 3, hard: 4, expert: 5 };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const shortName = (name = "") => name.split("—")[0].trim() || name;

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
        <Icon name={icon} size={16} className="hud-muted" />
        {value ?? "—"}
      </div>
      <div className="hud-stat__label">{label}</div>
    </div>
  );
}

// Live speedometer — driven by the device Geolocation API; reads 0 with no GPS fix.
function Speedometer({ speed = 0, hasGps = false, max = 120 }) {
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
        <span className={`hud-gps${hasGps ? " is-on" : ""}`}>
          {hasGps ? "● GPS live" : "○ awaiting GPS"}
        </span>
      </div>
    </div>
  );
}

export default function Hud({
  route,
  routes = [],
  selectedId,
  onSelectRoute,
  backendStatus,
  speed = 0,
  hasGps = false,
  score = 0,
  scoreDelta = 0,
  discovered = 0,
}) {
  const online = backendStatus && backendStatus !== "offline" && backendStatus !== "Checking...";
  const name = route?.name ?? "Finding scenic routes…";
  const vibe = route?.vibe ?? "—";
  const difficulty = route?.difficulty ?? "moderate";
  const total = routes.length || 1;

  return (
    <div className="hud">
      <div className="hud__scrim" />

      <div className="hud-wordmark">
        <div className="hud-wordmark__badge">
          <Icon name="wheel" size={22} />
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
        <Icon name="trophy" size={22} />
        <div>
          <div className="hud-label">Discovery score</div>
          <div className="hud-score__val">
            {score.toLocaleString()}
            {scoreDelta > 0 && <span>+{scoreDelta}</span>}
          </div>
        </div>
      </div>

      <div className="hud-panel hud-overlook">
        <div className="hud-overlook__head">
          <Icon name="camera" size={20} className="hud-accent" />
          <span className="hud-overlook__title">Scenic overlook</span>
          <span className="hud-ping" />
        </div>
        <div className="hud-overlook__sub">
          {route
            ? `${route.curves} curves · ${route.elevationFt} ft climb ahead`
            : "1.2 mi ahead · photo op · +250 pts"}
        </div>
      </div>

      <div className="hud-panel hud-route">
        <div className="hud-route__eyebrow">
          <Icon name="pin" size={16} className="hud-muted" /> Current route
        </div>
        <div className="hud-route__name">{name}</div>

        {routes.length > 0 && (
          <div className="hud-route__switch">
            {routes.map((f) => (
              <button
                key={f.properties.id}
                className={`hud-routebtn${f.properties.id === selectedId ? " is-on" : ""}`}
                onClick={() => onSelectRoute?.(f.properties.id)}
              >
                {shortName(f.properties.name)}
              </button>
            ))}
          </div>
        )}

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

      <Speedometer speed={speed} hasGps={hasGps} />

      <div className="hud-panel hud-skill">
        <div className="hud-skill__head">
          <span>
            <Icon name="route" size={18} className="hud-accent" /> Discovery progress
          </span>
          <span className="hud-skill__mult">
            {discovered}/{total}
          </span>
        </div>
        <div className="hud-skill__bar">
          <div style={{ width: `${Math.round((discovered / total) * 100)}%` }} />
        </div>
        <div className="hud-skill__foot">
          <span>Routes uncovered</span>
          <span>+{score.toLocaleString()} pts</span>
        </div>
      </div>
    </div>
  );
}
