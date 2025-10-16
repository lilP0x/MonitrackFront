import { useState } from "react";
import "../style/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error("Credenciales inválidas");

      const data = await res.json();

      // guardar token (si tu backend devuelve JWT)
      localStorage.setItem("token", data.token);

      // redirigir a sesiones
      window.location.href = "/sessions";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h1 className="title">MoniTrack</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn">Iniciar Sesión</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}

export default Login;
