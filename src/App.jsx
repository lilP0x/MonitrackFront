import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ActiveTestUI from "./pages/ActiveTestUI";
import InsightsOverview from "./pages/InsightsOverview";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/sessions"
          element={
            <PrivateRoute>
              <ActiveTestUI />
            </PrivateRoute>
          }
        />
        <Route path="/insights" element={<InsightsOverview />} />
        {/* catch-all: redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
