import { NavLink } from "react-router-dom";
import {
  Cross,
  Home,
  FileText,
  Pill,
  Calendar,
  UtensilsCrossed,
  Bot,
  Heart,
  Settings,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Cross className="icon" /></div>
        <div>
          <h2>MediVault</h2>
          <span>Smart Health Manager</span>
        </div>
      </div>

      <nav className="navigation">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Home className="icon" /> Dashboard
        </NavLink>

        <NavLink
          to="/medical-records"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <FileText className="icon" /> Medical Records
        </NavLink>

        <NavLink
          to="/medicines"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Pill className="icon" /> Medicines
        </NavLink>

        <NavLink
          to="/appointments"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Calendar className="icon" /> Appointments
        </NavLink>

        <NavLink
          to="/diet"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <UtensilsCrossed className="icon" /> Diet
        </NavLink>

        <NavLink
          to="/ai-assistant"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Bot className="icon" /> AI Assistant
        </NavLink>

        <NavLink
          to="/health-monitoring"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Heart className="icon" /> Health Monitoring
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Settings className="icon" /> Settings
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `profile-mini${isActive ? " active" : ""}`}
        >
          <div className="avatar">P</div>
          <div>
            <strong>Patient</strong>
            <small>MediVault Account</small>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;