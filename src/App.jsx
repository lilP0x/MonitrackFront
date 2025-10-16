import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ActiveTestUI from "./pages/ActiveTestUI";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/sessions"
          element={
            <PrivateRoute>
              <ActiveTestUI />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
