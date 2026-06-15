import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Icon from "./Icon.jsx";
import "./Auth.css";

export default function Signup() {
  const { signUp, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { data, error } = await signUp(email, password);
      if (error) throw error;
      if (data.session) {
        navigate("/app"); // email confirmation disabled — straight in
      } else {
        setMessage("Account created! Check your email to confirm, then log in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={submit}>
        <div className="auth__badge">
          <Icon name="wheel" size={26} />
        </div>
        <h1 className="auth__title">Create your account</h1>
        <p className="auth__sub">Save your favorite drives and pick up where you left off.</p>

        {!isSupabaseConfigured && (
          <div className="auth__notice">
            Auth isn’t configured yet — add your Supabase keys to <code>frontend/.env</code> to enable
            real sign-ups. You can still open the map from the home page.
          </div>
        )}
        {error && <div className="auth__error">{error}</div>}
        {message && <div className="auth__ok">{message}</div>}

        <div className="auth__field">
          <label className="auth__label" htmlFor="email">Email</label>
          <input
            id="email"
            className="auth__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="auth__field">
          <label className="auth__label" htmlFor="password">Password</label>
          <input
            id="password"
            className="auth__input"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="auth__btn" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Sign up"}
        </button>

        <div className="auth__alt">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
        <Link className="auth__back" to="/">← Back to home</Link>
      </form>
    </div>
  );
}
