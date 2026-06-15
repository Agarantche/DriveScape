import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Landing.css";
import Icon from "./Icon.jsx";
import { useAuth } from "./AuthContext.jsx";

const FEATURES = [
  {
    icon: "map",
    title: "Real roads, scored",
    body: "We pull live OpenStreetMap data near you and rank roads by how scenic and fun they are to drive.",
  },
  {
    icon: "gauge",
    title: "Live drive telemetry",
    body: "Real-time speed from your device wrapped in a heads-up cockpit display.",
  },
  {
    icon: "trophy",
    title: "Earn discovery points",
    body: "Rack up points as you uncover new roads, overlooks, and photo ops.",
  },
];

export default function Landing() {
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Short exit transition, then head to signup (or straight to the map if already logged in).
  const enter = () => {
    setLeaving(true);
    setTimeout(() => navigate(user ? "/app" : "/signup"), 480);
  };

  return (
    <div className={`land${leaving ? " is-leaving" : ""}`}>
      <div className="land__bg" aria-hidden="true">
        <svg className="land__route" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path d="M-60 720 C 260 640, 360 380, 640 360 S 1080 520, 1180 300 S 1480 120, 1560 150" />
          <path d="M-60 840 C 300 800, 520 560, 760 560 S 1180 700, 1320 460" />
        </svg>
      </div>

      <div className="land__inner">
        <div className="land__badge">
          <Icon name="wheel" size={32} strokeWidth={1.6} />
        </div>

        <div className="land__eyebrow">
          <Icon name="sparkle" size={14} className="hud-accent" />
          Real roads near you, scored for the drive
        </div>

        <h1 className="land__title">
          Find the roads <span>worth driving.</span>
        </h1>
        <p className="land__lede">
          DriveScape turns the map into a game. It finds the most scenic routes near your
          location, tracks your drive in a live cockpit HUD, and rewards you for every road you uncover.
        </p>

        <button className="land__cta" onClick={enter}>
          {user ? "Open the map" : "Start exploring"} <Icon name="arrow" size={20} strokeWidth={2} />
        </button>
        {!user && (
          <Link className="land__login" to="/login">
            Already have an account? Log in
          </Link>
        )}

        <div className="land__features">
          {FEATURES.map((f) => (
            <div className="land__feat" key={f.title}>
              <div className="land__feat-ic">
                <Icon name={f.icon} size={22} />
              </div>
              <div className="land__feat-title">{f.title}</div>
              <div className="land__feat-body">{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="land__foot">Built for the curious drive &middot; {new Date().getFullYear()}</div>
    </div>
  );
}
