import React, { useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "./api.js";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  function handleAuth({ token, user }) {
    setToken(token);
    setUser(user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  if (loading) return <div className="center">Loading…</div>;
  return user ? (
    <Dashboard user={user} onLogout={logout} />
  ) : (
    <Auth onAuth={handleAuth} />
  );
}
