import { useState, useEffect } from "react";
import "../style/ActiveTestUi.css";
import { apiFetchJson, apiFetchText } from "../lib/apiFetch";

function getUsernameFromToken(token) {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.sub || "";
  } catch {
    return "";
  }
}

export default function MonitorHome() {
  const [monitor, setMonitor] = useState("");
  const [topic, setTopic] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [studentNameInput, setStudentNameInput] = useState("");
  const [bitacora, setBitacora] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      try {
        window.location.href = "/login";
      } catch (e) {}
      return;
    }
    const username = getUsernameFromToken(token);
    setMonitor(username);
    setModalOpen(true);
  }, []);

  // Crear sesión solo con el tema
  const handleCreateSession = async () => {
    if (!topic || topic.trim().length < 2) return setError("Escribe un tema válido");
    setLoading(true);
    setError(null);
    try {
      const payload = { topic: topic.trim(), monitor, creationDate: new Date().toISOString() };
      const data = await apiFetchJson("/api/v1/mentoring-sessions/create", payload, { method: "POST" });
      const id = data?.id ?? data?.sessionId ?? null;
      setSessionId(id ? (typeof id === "string" ? parseInt(id, 10) : id) : null);
      setModalOpen(false);
      setSuccessMsg("Sesión creada");
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401 || err?.message === "Unauthorized") {
        setError("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      } else {
        setError(err.message || "Error creando sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  // Agregar estudiante (petición individual)
  const handleAddStudent = async () => {
    if (!sessionId) return setError("Crea una sesión primero");
    const id = studentIdInput.trim();
    const name = studentNameInput.trim();
    if (!id || !name) return setError("Completa ambos campos");
    if (students.some((s) => s.id === id)) return setError("Estudiante ya agregado");
    setLoading(true);
    setError(null);
    // debug: log token and payload
    const tokenDebug = localStorage.getItem("token");
    console.debug("[addStudent] token present:", !!tokenDebug);
    try {


      const sid = parseInt(sessionId, 10);
      // prefer numeric studentId if user entered digits
      const studentIdVal = /^\d+$/.test(id) ? parseInt(id, 10) : id;
      const payload = { sessionId: sid, id: studentIdVal, name: name };

      
      console.debug("[addStudent] payload:", payload);
      setLastRequest({ url: "/api/v1/mentoring-sessions/add-student", payload });
      const res = await apiFetchJson("/api/v1/mentoring-sessions/add-student", payload, { method: "POST" });

      console.debug("[addStudent] response:", res);
      setLastResponse({ status: 200, body: res });
      setStudents((s) => [...s, { id, name }]);
      setStudentIdInput("");
      setStudentNameInput("");
      setSuccessMsg("Estudiante agregado");
      setTimeout(() => setSuccessMsg(null), 1800);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const bodyMsg = err?.body?.message || err?.body || null;
      if (status === 401 || err?.message === "Unauthorized") {
        setError("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      } else if (status) {
        setError(`Error ${status}: ${bodyMsg || err.message || 'Error agregando estudiante'}`);
      } else {
        setError(err.message || "Error agregando estudiante");
      }
    } finally {
      setLoading(false);
    }
  };

  // Guardar bitácora (petición individual)
  const handleSaveBitacora = async () => {
    if (!sessionId) return setError("Crea una sesión primero");
    if (!bitacora || bitacora.trim().length < 3) return setError("La bitácora es muy corta");
    setLoading(true);
    setError(null);
    // debug: token + payload
    const tokenDebug = localStorage.getItem("token");
    console.debug("[saveBitacora] token present:", !!tokenDebug);
    try {
      const url = `/api/v1/mentoring-sessions/${parseInt(sessionId, 10)}/bitacora`;

      console.debug("[saveBitacora] url:", url, "body:", bitacora.trim());

      setLastRequest({ url, payload: bitacora.trim() });
      const res = await apiFetchText(url, bitacora.trim(), { method: "PUT" });

      setLastResponse({ status: 200, body: res });
      setBitacora("");
      setSuccessMsg("Bitácora guardada");
      setTimeout(() => setSuccessMsg(null), 2000);
      
    } catch (err) {


      console.error(err);
      const status = err?.response?.status;
      const bodyMsg = err?.body?.message || err?.body || null;
      if (status === 401 || err?.message === "Unauthorized") {
        setError("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      } else if (status) {
        setError(`Error ${status}: ${bodyMsg || err.message || 'Error guardando bitácora'}`);
      } else {
        setError(err.message || "Error guardando bitácora");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleFinishSession = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      setLastRequest({ url: `/api/v1/mentoring-sessions/${sessionId}/finish` });
      const res = await apiFetchJson(`/api/v1/mentoring-sessions/${sessionId}/finish`, null, { method: "PUT" });
      setLastResponse({ status: 200, body: res });
      setSuccessMsg("Sesión finalizada");
      setSessionId(null);
      setStudents([]);
      setTopic("");
      setTimeout(() => {
        setSuccessMsg(null);
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al finalizar la sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="active-container">
      <header className="title-row">
        <div>
          <h1>Sesión activa</h1>
          <div className="subtitle">{monitor ? `Monitor: ${monitor}` : "Sin monitor detectado"}</div>
        </div>
        <div className="actions-header">
          <button className="btn" onClick={() => setModalOpen(true)}>Crear nueva sesión</button>
          {sessionId && <span className="badge">ID: {sessionId}</span>}
        </div>
      </header>

      {modalOpen && (
        <div className="modal">
          <div className="modal-content card">
            <h2>¿Qué tema se va a tratar en la sesión?</h2>
            <div className="row">
              <label htmlFor="modalTopic">Tema</label>
              <input id="modalTopic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: Testing unitario" />
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={handleCreateSession} disabled={loading}>{loading ? "Creando..." : "Crear sesión"}</button>
              <button className="btn plain" onClick={() => setModalOpen(false)} disabled={loading}>Cancelar</button>
            </div>
            {error && <div className="feedback error">{error}</div>}
            {successMsg && <div className="feedback success">{successMsg}</div>}
          </div>
        </div>
      )}

      <main>
        <div className="grid">
          <section className="card session-card">
            <h2 className="card-title">{sessionId ? `Sesión ${sessionId}` : "No hay sesión activa"}</h2>
            <p className="muted">{topic ? `Tema: ${topic}` : "Tema no establecido"}</p>

            <div className="students-block">
              <h3>Agregar estudiante</h3>
              <div className="form-inline">
                <input placeholder="ID" value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)} />
                <input placeholder="Nombre" value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} />
                <button className="btn" onClick={handleAddStudent} disabled={loading}>Agregar</button>
              </div>

              <ul className="student-list">
                {students.length === 0 ? <li className="muted">No hay estudiantes añadidos</li> : students.map((s, i) => (<li key={i}>{s.id} — {s.name}</li>))}
              </ul>
            </div>

            <div className="bitacora-block">
              <h3>Bitácora</h3>
              <textarea rows={6} placeholder="Escribe la bitácora..." value={bitacora} onChange={(e) => setBitacora(e.target.value)} />
              <div className="actions-row">
                <button className="btn primary" onClick={handleSaveBitacora} disabled={loading}>Guardar bitácora</button>
                <button className="btn plain" onClick={() => setBitacora("")}>Limpiar</button>
              </div>
            </div>

            {error && <div className="feedback error">{error}</div>}
            {successMsg && <div className="feedback success">{successMsg}</div>}
          </section>

          <aside className="card info-card">
            <h3>Información</h3>
            <p className="muted">Aquí puedes crear una sesión con el tema, añadir estudiantes uno a uno y guardar la bitácora en cualquier momento.</p>
            <div className="info-actions">
              <button className="btn" onClick={handleFinishSession} disabled={loading || !sessionId}>Finalizar sesión</button>
            </div>
          </aside>
        </div>
      </main>
     
    </div>
  );
}
