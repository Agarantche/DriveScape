import { useState } from "react";
import "./Hud.css";
import Icon from "./Icon.jsx";

const DIFFICULTY_BARS = { easy: 2, moderate: 3, hard: 4, expert: 5 };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "-");
const shortName = (name = "") => name.split(" - ")[0].trim() || name;

function DifficultyMeter({ difficulty }) {
  const filled = DIFFICULTY_BARS[String(difficulty).toLowerCase()] ?? 3;
  return (
    <div className="hud-meter" aria-label={`${cap(difficulty)} difficulty`}>
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
        <Icon name={icon} size={22} className="hud-muted" />
        {value ?? "-"}
      </div>
      <div className="hud-stat__label">{label}</div>
    </div>
  );
}

function Speedometer({ speed = 0, hasGps = false, max = 120 }) {
  const polar = (deg) => {
    const a = (deg * Math.PI) / 180;
    return [92 + 76 * Math.cos(a), 92 + 76 * Math.sin(a)];
  };
  const arc = (frac) => {
    const [sx, sy] = polar(150);
    const [ex, ey] = polar(150 + 240 * frac);
    const large = 240 * frac > 180 ? 1 : 0;
    return `M${sx.toFixed(1)},${sy.toFixed(1)} A76,76 0 ${large} 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
  };
  const frac = Math.max(0, Math.min(1, speed / max));

  return (
    <section className="hud-speed" aria-label="Current speed">
      <svg width="206" height="158" viewBox="0 0 184 146" aria-hidden="true">
        <path className="hud-speed__track" d={arc(1)} fill="none" strokeWidth="12" strokeLinecap="round" />
        <path className="hud-speed__val" d={arc(frac)} fill="none" strokeWidth="12" strokeLinecap="round" />
        <text x="92" y="83" textAnchor="middle" className="hud-speed__num">
          {Math.round(speed)}
        </text>
        <text x="92" y="112" textAnchor="middle" className="hud-speed__unit">
          MPH
        </text>
      </svg>
      <div className={`hud-gps${hasGps ? " is-on" : ""}`}>{hasGps ? "GPS live" : "GPS standby"}</div>
    </section>
  );
}

function NextTurn({ route }) {
  return (
    <section className="hud-next" aria-label="Next direction">
      <div className="hud-next__icon">
        <Icon name="arrow" size={34} />
      </div>
      <div>
        <div className="hud-label">Next guidance</div>
        <div className="hud-next__title">Stay on scenic route</div>
        <div className="hud-next__sub">{route ? `${route.vibe} ahead` : "Loading route guidance"}</div>
      </div>
    </section>
  );
}

function RoutePlanner({ route, routes, selectedId, onSelectRoute }) {
  const name = route?.name ?? "Finding scenic routes...";
  const vibe = route?.vibe ?? "-";
  const difficulty = route?.difficulty ?? "moderate";

  return (
    <section className="hud-route" aria-label="Current route">
      <div className="hud-route__eyebrow">
        <Icon name="pin" size={22} className="hud-muted" /> Current route
      </div>
      <div className="hud-route__name">{name}</div>
      <div className="hud-route__desc">{route?.description ?? "Scanning nearby scenic roads."}</div>

      {routes.length > 0 && (
        <div className="hud-route__switch" aria-label="Route selection">
          {routes.map((f) => (
            <button
              key={f.properties.id}
              className={`hud-routebtn${f.properties.id === selectedId ? " is-on" : ""}`}
              onClick={() => onSelectRoute?.(f.properties.id)}
              type="button"
            >
              {shortName(f.properties.name)}
            </button>
          ))}
        </div>
      )}

      <div className="hud-route__meta">
        <span className="hud-chip">{vibe}</span>
        <div className="hud-route__diff">
          <DifficultyMeter difficulty={difficulty} />
          <span>{cap(difficulty)}</span>
        </div>
      </div>

      <div className="hud-route__stats">
        <Stat icon="ruler" value={route?.lengthMi} label="miles" />
        <Stat icon="wave" value={route?.curves} label="curves" />
        <Stat icon="mountain" value={route?.elevationFt} label="ft climb" />
      </div>
    </section>
  );
}

function LandmarkCard({ landmark, checkInRadiusMi, onCheckIn }) {
  if (!landmark) {
    return (
      <section className="hud-landmark" aria-label="Landmark discovery">
        <div className="hud-landmark__eyebrow">
          <Icon name="sparkle" size={22} /> Landmark discovery
        </div>
        <div className="hud-landmark__name">Scanning nearby places</div>
        <div className="hud-landmark__fact">Tap a landmark pin to reveal facts and points.</div>
      </section>
    );
  }

  const isVisited = Boolean(landmark.isVisited);
  const canCheckIn = Boolean(landmark.canCheckIn);
  const buttonText = isVisited
    ? "Visited"
    : canCheckIn
      ? "Check in"
      : `Move within ${checkInRadiusMi} mi`;

  return (
    <section className="hud-landmark" aria-label="Selected landmark">
      <div className="hud-landmark__top">
        <div className="hud-landmark__eyebrow">
          <Icon name="sparkle" size={22} /> {landmark.category}
        </div>
        <div className="hud-landmark__points">+{landmark.points} pts</div>
      </div>
      <div className="hud-landmark__name">{landmark.name}</div>
      <div className="hud-landmark__fact">{landmark.fact}</div>
      <div className="hud-landmark__meta">
        <span>{cap(landmark.rarity)}</span>
        <span>{landmark.distanceMi} mi away</span>
        <span>{landmark.vibe}</span>
      </div>
      <button
        className={`hud-checkin${isVisited ? " is-visited" : ""}`}
        type="button"
        disabled={isVisited || !canCheckIn}
        onClick={() => onCheckIn?.(landmark.id)}
      >
        {buttonText}
      </button>
    </section>
  );
}

function SecondaryDrawer({
  open,
  user,
  onSignOut,
  backendStatus,
  mapMode,
  onToggleMapMode,
  score,
  scoreDelta,
  discovered,
  total,
  landmarkCount,
  visitedLandmarkCount,
}) {
  const online = backendStatus && backendStatus !== "offline" && backendStatus !== "Checking...";

  return (
    <aside className={`hud-drawer${open ? " is-open" : ""}`} aria-label="Secondary controls">
      <div className="hud-drawer__inner">
        <div className="hud-drawer__section">
          <div className="hud-drawer__label">Map detail</div>
          <button className="hud-action" onClick={onToggleMapMode} type="button">
            <Icon name="layers" size={24} />
            <span>{mapMode === "streets" ? "Street map" : "Satellite"}</span>
          </button>
        </div>

        <div className="hud-drawer__section">
          <div className="hud-drawer__label">Discovery</div>
          <div className="hud-score__val">
            {score.toLocaleString()}
            {scoreDelta > 0 && <span> +{scoreDelta}</span>}
          </div>
          <div className="hud-progress" aria-label="Discovery progress">
            <div style={{ width: `${Math.round((discovered / total) * 100)}%` }} />
          </div>
          <div className="hud-drawer__sub">
            {discovered}/{total} routes uncovered
          </div>
          <div className="hud-drawer__sub">
            {visitedLandmarkCount}/{landmarkCount} landmarks visited
          </div>
        </div>

        <div className="hud-drawer__section">
          <div className="hud-drawer__label">System</div>
          <div className={`hud-status${online ? " is-on" : ""}`}>{online ? "Backend online" : "Backend offline"}</div>
        </div>

        {user && (
          <div className="hud-drawer__section">
            <div className="hud-drawer__label">Account</div>
            <div className="hud-account">
              <Icon name="user" size={24} />
              <span>{user.email}</span>
            </div>
            <button className="hud-action hud-action--danger" onClick={onSignOut} type="button">
              <Icon name="logout" size={24} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Hud({
  route,
  routes = [],
  landmark,
  landmarkCount = 0,
  visitedLandmarkCount = 0,
  checkInRadiusMi = 1.5,
  onCheckInLandmark,
  selectedId,
  onSelectRoute,
  backendStatus,
  user,
  onSignOut,
  mapMode = "streets",
  onToggleMapMode,
  locating = false,
  speed = 0,
  hasGps = false,
  score = 0,
  scoreDelta = 0,
  discovered = 0,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const total = routes.length || 1;

  return (
    <div className="hud">
      <div className="hud__scrim" />

      <main className="hud-primary" aria-label="Driving dashboard">
        <div className="hud-brand">
          <div className="hud-brand__badge">
            <Icon name="wheel" size={28} />
          </div>
          <div>
            <div className="hud-brand__title">DriveScape</div>
            <div className="hud-brand__sub">{locating ? "Finding scenic roads" : "Discovery drive"}</div>
          </div>
        </div>

        <div className="hud-driving">
          <Speedometer speed={speed} hasGps={hasGps} />
          <NextTurn route={route} />
        </div>

        <RoutePlanner route={route} routes={routes} selectedId={selectedId} onSelectRoute={onSelectRoute} />
      </main>

      <LandmarkCard landmark={landmark} checkInRadiusMi={checkInRadiusMi} onCheckIn={onCheckInLandmark} />

      <button
        className={`hud-drawer-toggle${drawerOpen ? " is-open" : ""}`}
        onClick={() => setDrawerOpen((v) => !v)}
        aria-label={drawerOpen ? "Close secondary controls" : "Open secondary controls"}
        type="button"
      >
        <Icon name={drawerOpen ? "x" : "menu"} size={28} />
      </button>

      <SecondaryDrawer
        open={drawerOpen}
        user={user}
        onSignOut={onSignOut}
        backendStatus={backendStatus}
        mapMode={mapMode}
        onToggleMapMode={onToggleMapMode}
        score={score}
        scoreDelta={scoreDelta}
        discovered={discovered}
        total={total}
        landmarkCount={landmarkCount}
        visitedLandmarkCount={visitedLandmarkCount}
      />
    </div>
  );
}
