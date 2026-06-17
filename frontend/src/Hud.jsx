import { useState } from "react";
import "./Hud.css";
import Icon from "./Icon.jsx";

const DIFFICULTY_BARS = { easy: 2, moderate: 3, hard: 4, expert: 5 };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "-");
const shortName = (name = "") => name.split(" - ")[0].trim() || name;
const cx = (...classes) => classes.filter(Boolean).join(" ");

function formatMiles(value) {
  const miles = Number(value);
  if (!Number.isFinite(miles)) return "Nearby";
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

function formatMetric(value, fallback = "-") {
  return value ?? fallback;
}

function SectionHeading({ icon, children, className = "hud-section-title", iconSize = 20 }) {
  return (
    <div className={className}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </div>
  );
}

function MetricPill({ children }) {
  return <span>{children}</span>;
}

function DifficultyMeter({ difficulty }) {
  const filled = DIFFICULTY_BARS[String(difficulty).toLowerCase()] ?? 3;
  return (
    <div className="hud-meter" aria-label={`${cap(difficulty)} difficulty`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cx("hud-bar", i <= filled && "hud-bar--on")} />
      ))}
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
      <svg width="146" height="118" viewBox="0 0 184 146" aria-hidden="true">
        <path className="hud-speed__track" d={arc(1)} fill="none" strokeWidth="12" strokeLinecap="round" />
        <path className="hud-speed__val" d={arc(frac)} fill="none" strokeWidth="12" strokeLinecap="round" />
        <text x="92" y="83" textAnchor="middle" className="hud-speed__num">
          {Math.round(speed)}
        </text>
        <text x="92" y="112" textAnchor="middle" className="hud-speed__unit">
          MPH
        </text>
      </svg>
      <div className={cx("hud-gps", hasGps && "is-on")}>{hasGps ? "GPS live" : "GPS standby"}</div>
    </section>
  );
}

function BrandHeader({ locating }) {
  return (
    <header className="hud-brand">
      <div className="hud-brand__mark">
        <Icon name="wheel" size={29} />
      </div>
      <div className="hud-brand__copy">
        <div className="hud-brand__title">DriveScape</div>
        <div className="hud-brand__sub">{locating ? "Finding your discovery zone" : "World discovery drive"}</div>
      </div>
      <nav className="hud-brand__nav" aria-label="DriveScape sections">
        <span>Routes</span>
        <span>Landmarks</span>
        <span>Score</span>
      </nav>
    </header>
  );
}

function DiscoveryFilters({ locating, routeCount, landmarkCount }) {
  return (
    <section className="hud-filters" aria-label="Discovery scope">
      <div className="hud-search">
        <Icon name="locate" size={25} />
        <span>{locating ? "Locking onto nearby places" : "Explore near me"}</span>
      </div>
      <div className="hud-filter-pill">
        <Icon name="route" size={22} />
        <span>{routeCount} routes</span>
      </div>
      <div className="hud-filter-pill">
        <Icon name="sparkle" size={22} />
        <span>{landmarkCount} stops</span>
      </div>
    </section>
  );
}

function NextTurn({ route }) {
  return (
    <section className="hud-next" aria-label="Next discovery guidance">
      <div className="hud-next__icon">
        <Icon name="arrow" size={30} />
      </div>
      <div>
        <div className="hud-label">Next guidance</div>
        <div className="hud-next__title">Stay on scenic route</div>
        <div className="hud-next__sub">{route ? `${route.vibe} ahead` : "Loading route guidance"}</div>
      </div>
    </section>
  );
}

function GuidanceCluster({ route, speed, hasGps }) {
  return (
    <section className="hud-driving" aria-label="Driving state">
      <Speedometer speed={speed} hasGps={hasGps} />
      <NextTurn route={route} />
    </section>
  );
}

function ScoreStrip({ score, scoreDelta, discovered, total, landmarkCount, visitedLandmarkCount }) {
  return (
    <section className="hud-score-strip" aria-label="Discovery progress">
      <div>
        <span>Total score</span>
        <strong>
          {score.toLocaleString()}
          {scoreDelta > 0 && <em> +{scoreDelta}</em>}
        </strong>
      </div>
      <div>
        <span>Routes found</span>
        <strong>
          {discovered}/{total}
        </strong>
      </div>
      <div>
        <span>Stops visited</span>
        <strong>
          {visitedLandmarkCount}/{landmarkCount}
        </strong>
      </div>
    </section>
  );
}

function RouteCard({ feature, selected, onSelectRoute }) {
  const route = feature.properties;
  return (
    <button
      className={cx("hud-route-card", selected && "is-on")}
      onClick={() => onSelectRoute?.(route.id)}
      type="button"
    >
      <div className="hud-route-card__logo">
        <Icon name="route" size={26} />
      </div>
      <div className="hud-route-card__body">
        <div className="hud-route-card__top">
          <span>{route.vibe}</span>
          <span className="hud-route-card__badge">
            <DifficultyMeter difficulty={route.difficulty} />
            {cap(route.difficulty)}
          </span>
        </div>
        <div className="hud-route-card__name">{shortName(route.name)}</div>
        <div className="hud-route-card__desc">{route.description}</div>
        <div className="hud-route-card__meta">
          <MetricPill>{formatMiles(route.lengthMi)}</MetricPill>
          <MetricPill>{formatMetric(route.curves)} curves</MetricPill>
          <MetricPill>{formatMetric(route.elevationFt, "TBD")} ft</MetricPill>
        </div>
      </div>
    </button>
  );
}

function RoutePlanner({ routes, selectedId, onSelectRoute }) {
  return (
    <section className="hud-route" aria-label="Scenic route results">
      <div className="hud-panel-heading">
        <SectionHeading icon="map">Scenic routes</SectionHeading>
        <span>{routes.length} results</span>
      </div>

      <div className="hud-route-list">
        {routes.length ? (
          routes.slice(0, 4).map((feature) => (
            <RouteCard
              key={feature.properties.id}
              feature={feature}
              selected={feature.properties.id === selectedId}
              onSelectRoute={onSelectRoute}
            />
          ))
        ) : (
          <div className="hud-empty">Scanning nearby backroads and scenic corridors.</div>
        )}
      </div>
    </section>
  );
}

function LandmarkRow({ feature, selected, visited, onSelectLandmark }) {
  const landmark = feature.properties;
  return (
    <button
      className={cx("hud-landmark-row", selected && "is-on", visited && "is-visited")}
      onClick={() => onSelectLandmark?.(landmark.id)}
      type="button"
    >
      <div className="hud-landmark-row__pin">
        <Icon name={visited ? "trophy" : "sparkle"} size={22} />
      </div>
      <div>
        <div className="hud-landmark-row__name">{landmark.name}</div>
        <div className="hud-landmark-row__meta">
          {landmark.category} / {formatMiles(landmark.distanceMi)} / +{landmark.points} pts
        </div>
      </div>
    </button>
  );
}

function LandmarkQueue({ landmarks, selectedLandmarkId, visitedLandmarkIds, onSelectLandmark }) {
  return (
    <section className="hud-landmark-list" aria-label="Nearby landmarks">
      <div className="hud-panel-heading">
        <SectionHeading icon="sparkle">Nearby landmarks</SectionHeading>
        <span>{landmarks.length} stops</span>
      </div>
      <div className="hud-landmark-list__items">
        {landmarks.length ? (
          landmarks.slice(0, 4).map((feature) => (
            <LandmarkRow
              key={feature.properties.id}
              feature={feature}
              selected={feature.properties.id === selectedLandmarkId}
              visited={visitedLandmarkIds.includes(feature.properties.id)}
              onSelectLandmark={onSelectLandmark}
            />
          ))
        ) : (
          <div className="hud-empty">No landmark cards loaded for this area yet.</div>
        )}
      </div>
    </section>
  );
}

function DiscoveryPanel({
  route,
  routes,
  landmarks,
  selectedId,
  selectedLandmarkId,
  visitedLandmarkIds,
  onSelectRoute,
  onSelectLandmark,
  locating,
  speed,
  hasGps,
  score,
  scoreDelta,
  discovered,
  total,
  landmarkCount,
  visitedLandmarkCount,
}) {
  return (
    <main className="hud-primary" aria-label="DriveScape discovery board">
      <BrandHeader locating={locating} />
      <DiscoveryFilters locating={locating} routeCount={routes.length} landmarkCount={landmarkCount} />
      <GuidanceCluster route={route} speed={speed} hasGps={hasGps} />
      <ScoreStrip
        score={score}
        scoreDelta={scoreDelta}
        discovered={discovered}
        total={total}
        landmarkCount={landmarkCount}
        visitedLandmarkCount={visitedLandmarkCount}
      />
      <RoutePlanner routes={routes} selectedId={selectedId} onSelectRoute={onSelectRoute} />
      <LandmarkQueue
        landmarks={landmarks}
        selectedLandmarkId={selectedLandmarkId}
        visitedLandmarkIds={visitedLandmarkIds}
        onSelectLandmark={onSelectLandmark}
      />
    </main>
  );
}

function CheckInButton({ landmark, onCheckIn }) {
  const isVisited = Boolean(landmark.isVisited);
  const canCheckIn = Boolean(landmark.canCheckIn);
  const checkInRadiusMi = landmark.checkInRadiusMi ?? 1.5;
  const buttonText = isVisited ? "Visited" : canCheckIn ? "Check in" : `Move within ${checkInRadiusMi} mi`;

  return (
    <button
      className={cx("hud-checkin", isVisited && "is-visited")}
      type="button"
      disabled={isVisited || !canCheckIn}
      onClick={() => onCheckIn?.(landmark.id)}
    >
      {buttonText}
    </button>
  );
}

function LandmarkCard({ landmark, onCheckIn }) {
  if (!landmark) {
    return (
      <section className="hud-landmark" aria-label="Landmark discovery">
        <SectionHeading icon="sparkle" className="hud-landmark__eyebrow">
          Landmark discovery
        </SectionHeading>
        <div className="hud-landmark__name">Scanning nearby places</div>
        <div className="hud-landmark__fact">Select a stop from the discovery board to reveal facts and points.</div>
      </section>
    );
  }

  const meta = [cap(landmark.rarity), formatMiles(landmark.distanceMi), landmark.vibe].filter(Boolean);

  return (
    <section className="hud-landmark" aria-label="Selected landmark">
      <div className="hud-landmark__top">
        <SectionHeading icon="sparkle" className="hud-landmark__eyebrow">
          {landmark.category}
        </SectionHeading>
        <div className="hud-landmark__points">+{landmark.points} pts</div>
      </div>
      <div className="hud-landmark__name">{landmark.name}</div>
      <div className="hud-landmark__fact">{landmark.fact}</div>
      <div className="hud-landmark__meta">
        {meta.map((item) => (
          <MetricPill key={item}>{item}</MetricPill>
        ))}
      </div>
      <CheckInButton landmark={landmark} onCheckIn={onCheckIn} />
    </section>
  );
}

function MapUtilityBar({ drawerOpen, mapMode, onToggleMapMode, onToggleDrawer }) {
  return (
    <div className="hud-map-actions" aria-label="Map controls">
      <button className="hud-map-mode" onClick={onToggleMapMode} type="button">
        <Icon name="layers" size={24} />
        <span>{mapMode === "streets" ? "Street map" : "Satellite"}</span>
      </button>
      <button
        className={cx("hud-drawer-toggle", drawerOpen && "is-open")}
        onClick={onToggleDrawer}
        aria-label={drawerOpen ? "Close secondary controls" : "Open secondary controls"}
        type="button"
      >
        <Icon name={drawerOpen ? "x" : "menu"} size={28} />
      </button>
    </div>
  );
}

function DrawerSection({ label, children }) {
  return (
    <div className="hud-drawer__section">
      <div className="hud-drawer__label">{label}</div>
      {children}
    </div>
  );
}

function DrawerAction({ icon, children, danger = false, onClick }) {
  return (
    <button className={cx("hud-action", danger && "hud-action--danger")} onClick={onClick} type="button">
      <Icon name={icon} size={24} />
      <span>{children}</span>
    </button>
  );
}

function DiscoveryProgress({ score, scoreDelta, discovered, total, landmarkCount, visitedLandmarkCount }) {
  return (
    <DrawerSection label="Discovery">
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
    </DrawerSection>
  );
}

function SecondaryDrawer({
  open,
  user,
  onSignOut,
  backendStatus,
  score,
  scoreDelta,
  discovered,
  total,
  landmarkCount,
  visitedLandmarkCount,
}) {
  const online = backendStatus && backendStatus !== "offline" && backendStatus !== "Checking...";

  return (
    <aside className={cx("hud-drawer", open && "is-open")} aria-label="Secondary controls">
      <div className="hud-drawer__inner">
        <DiscoveryProgress
          score={score}
          scoreDelta={scoreDelta}
          discovered={discovered}
          total={total}
          landmarkCount={landmarkCount}
          visitedLandmarkCount={visitedLandmarkCount}
        />

        <DrawerSection label="System">
          <div className={cx("hud-status", online && "is-on")}>{online ? "Backend online" : "Backend offline"}</div>
        </DrawerSection>

        {user && (
          <DrawerSection label="Account">
            <div className="hud-account">
              <Icon name="user" size={24} />
              <span>{user.email}</span>
            </div>
            <DrawerAction icon="logout" danger onClick={onSignOut}>
              Sign out
            </DrawerAction>
          </DrawerSection>
        )}
      </div>
    </aside>
  );
}

export default function Hud({
  route,
  routes = [],
  landmarks = [],
  landmark,
  landmarkCount = 0,
  visitedLandmarkCount = 0,
  visitedLandmarkIds = [],
  onCheckInLandmark,
  selectedId,
  selectedLandmarkId,
  onSelectRoute,
  onSelectLandmark,
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

      <DiscoveryPanel
        route={route}
        routes={routes}
        landmarks={landmarks}
        selectedId={selectedId}
        selectedLandmarkId={selectedLandmarkId}
        visitedLandmarkIds={visitedLandmarkIds}
        onSelectRoute={onSelectRoute}
        onSelectLandmark={onSelectLandmark}
        locating={locating}
        speed={speed}
        hasGps={hasGps}
        score={score}
        scoreDelta={scoreDelta}
        discovered={discovered}
        total={total}
        landmarkCount={landmarkCount}
        visitedLandmarkCount={visitedLandmarkCount}
      />

      <MapUtilityBar
        drawerOpen={drawerOpen}
        mapMode={mapMode}
        onToggleMapMode={onToggleMapMode}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
      />

      <LandmarkCard landmark={landmark} onCheckIn={onCheckInLandmark} />

      <SecondaryDrawer
        open={drawerOpen}
        user={user}
        onSignOut={onSignOut}
        backendStatus={backendStatus}
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
