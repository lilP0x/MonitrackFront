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

export default function ActiveTestUI() {
  const [monitor, setMonitor] = useState("");
  const [topic, setTopic] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [studentNameInput, setStudentNameInput] = useState("");
  const [bitacora, setBitacora] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // No token: redirigir a login o mostrar UI adecuada
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
    const token = localStorage.getItem("token");
    const payload = { topic };

    try {
      const data = await apiFetchJson(
        "/api/v1/mentoring-sessions/create",
        payload,
        { method: "POST" }
      );
      setModalOpen(false);
      setSessionId(data.id || data.sessionId || null);
    } catch (error) {
      alert("Error al crear la sesión: " + (error.message || error));
    }
  };

  // Agregar estudiante (petición individual)
  const handleAddStudent = async () => {
    const token = localStorage.getItem("token");
    const id = studentIdInput.trim();
    const name = studentNameInput.trim();
    if (!id || !name || students.some(s => s.id === id)) return;

    const payload = {
      sessionId,
      id,
      name,
    };

    try {
      await apiFetchJson("/api/v1/mentoring-sessions/add-student", payload, {
        method: "POST",
      });
      setStudents([...students, { id, name }]);
      setStudentIdInput("");
      setStudentNameInput("");
    } catch (error) {
      alert("Error al agregar estudiante: " + (error.message || error));
    }
  };

  // Guardar bitácora (petición individual)
  const handleSaveBitacora = async () => {
    const token = localStorage.getItem("token");

    try {
      await apiFetchText(
        `/api/v1/mentoring-sessions/${parseInt(sessionId, 10)}/bitacora`,
        bitacora,
        { method: "PUT" }
      );
      alert("Bitácora guardada correctamente");
    } catch (error) {
      alert("Error al guardar bitácora: " + (error.message || error));
    }
  };

  return (
    <div className="container">
      <main>
        {/* Modal solo pide el tema */}
        {modalOpen && (
          <div className="modal">
            <div className="modal-content card">
              <h2>¿Qué tema se va a tratar en la sesión?</h2>
              <div className="row">
                <label htmlFor="modalTopic">Tema</label>
                <input
                  type="text"
                  id="modalTopic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Tema de la sesión"
                />
              </div>
              <button
                className="btn primary"
                onClick={handleCreateSession}
                disabled={!topic}
              >
                Crear Sesión
              </button>
            </div>
          </div>
        )}

        {/* Sección principal para agregar estudiantes y bitácora */}
        {sessionId && (
          <section className="session-details card">
            <h2>Detalles de la sesión</h2>
            <div className="row">
              <label htmlFor="studentIdInput">ID del estudiante</label>
              <input
                type="text"
                id="studentIdInput"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="ID del estudiante"
              />
            </div>
            <div className="row">
              <label htmlFor="studentNameInput">Nombre del estudiante</label>
              <input
                type="text"
                id="studentNameInput"
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
                placeholder="Nombre del estudiante"
              />
              <button
                className="btn"
                onClick={handleAddStudent}
                disabled={!studentIdInput.trim() || !studentNameInput.trim()}
              >
                Agregar estudiante
              </button>
            </div>
            <div className="row">
              <label>Estudiantes agregados:</label>
              <ul>
                {students.map((student, idx) => (
                  <li key={idx}>
                    {student.id} - {student.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="row">
              <label htmlFor="bitacora">Bitácora</label>
              <textarea
                id="bitacora"
                value={bitacora}
                onChange={(e) => setBitacora(e.target.value)}
                placeholder="Describe lo realizado en la sesión"
                rows={4}
              />
            </div>
            <button
              className="btn primary"
              onClick={handleSaveBitacora}
              disabled={!bitacora}
            >
              Guardar bitácora
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
