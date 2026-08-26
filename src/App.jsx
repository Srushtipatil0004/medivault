import "./App.css";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import MedicalRecords from "./pages/MedicalRecords";
import Medicines from "./pages/Medicines";
import Appointments from "./pages/Appointments";
import Diet from "./pages/Diet";
import AIAssistant from "./pages/AIAssistant";
import HealthMonitoring from "./pages/HealthMonitoring";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
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
        </Routes>
      </main>
    </div>
  );
}

export default App;