import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { apiFetch } from "../lib/apiFetch"; // helper central
import "../style/InsightsOverview.css";

// Registrar elementos necesarios de Chart.js (v3+)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function InsightsOverview() {
  const [overview, setOverview] = useState(null);
  const [topics, setTopics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch("/api/v1/insights/overview", { method: "GET" }),
      apiFetch("/api/v1/insights/topics", { method: "GET" }),
    ])
      .then(([ov, tp]) => {
        if (!mounted) return;
        setOverview(ov || null);
        setTopics(tp || {});
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error al cargar insights");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!topics) return null;
    const labels = Object.keys(topics);
    const values = labels.map((k) => {
      const v = topics[k];
      return typeof v === "number" ? v : Number(v) || 0;
    });
    return {
      labels,
      datasets: [
        {
          label: "Sesiones por tema",
          data: values,
          backgroundColor: "rgba(54,162,235,0.8)",
        },
      ],
    };
  }, [topics]);

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h2>Insights</h2>
        <div>
          {loading ? <span className="spinner" /> : null}
        </div>
      </div>

      {error ? (
        <div className="error">Error: {error}</div>
      ) : loading ? (
        <div> Cargando insights...</div>
      ) : !overview ? (
        <div>No hay datos de resumen.</div>
      ) : (
        <>
          <div className="cards">
            <div className="card">
              <h4>Duración media sesión (min)</h4>
              <div className="value">{Number(overview.avgSessionDurationMinutes ?? 0).toFixed(1)}</div>
            </div>
            <div className="card">
              <h4>Sesiones esta semana</h4>
              <div className="value">{overview.sessionsThisWeek ?? 0}</div>
            </div>
            <div className="card">
              <h4>Monitor top</h4>
              <div className="value">{overview.topMonitorName ?? '-'}</div>
              <div className="subvalue">Sesiones: {overview.topMonitorSessions ?? 0}</div>
            </div>
            <div className="card">
              <h4>Promedio estudiantes/sesión</h4>
              <div className="value">{Number(overview.avgStudentsPerSession ?? 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Tópicos</h3>
            {chartData && chartData.labels.length > 0 ? (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                }}
              />
            ) : (
              <div>No hay datos por tópico.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}