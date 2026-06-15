import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Icon from "./Icon.jsx";
import "./Auth.css";

export default function Login() {
  const { signIn, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate("/app");
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
        <h1 className="auth__title">Welcome back</h1>
        <p className="auth__sub">Log in to keep exploring scenic drives.</p>

        {!isSupabaseConfigured && (
          <div className="auth__notice">
            Auth isn’t configured yet — add your Supabase keys to <code>frontend/.env</code> to enable
            real logins. You can still open the map from the home page.
          </div>
        )}
        {error && <div className="auth__error">{error}</div>}

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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="auth__btn" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <div className="auth__alt">
          New here? <Link to="/signup">Create an account</Link>
        </div>
        <Link className="auth__back" to="/">← Back to home</Link>
      </form>
    </div>
  );
}
