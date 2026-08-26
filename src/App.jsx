import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import MedicalRecords from "./pages/MedicalRecords";
import Medicines from "./pages/Medicines";
import Appointments from "./pages/Appointments";
import Diet from "./pages/Diet";
import AIAssistant from "./pages/AIAssistant";
import HealthMonitoring from "./pages/HealthMonitoring";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="app">
      {!isAuthPage && <Sidebar />}
      <main className="main-content">
        {!isAuthPage && <Header />}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/health-monitoring" element={<HealthMonitoring />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;