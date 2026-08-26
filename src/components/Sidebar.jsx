import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">✚</div>
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
          <span>⌂</span> Dashboard
        </NavLink>

        <NavLink
          to="/medical-records"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>▣</span> Medical Records
        </NavLink>

        <NavLink
          to="/medicines"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>💊</span> Medicines
        </NavLink>

        <NavLink
          to="/appointments"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>📅</span> Appointments
        </NavLink>

        <NavLink
          to="/diet"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>🥗</span> Diet
        </NavLink>

        <NavLink
          to="/ai-assistant"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>🤖</span> AI Assistant
        </NavLink>

        <NavLink
          to="/health-monitoring"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>❤️</span> Health Monitoring
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span>⚙️</span> Settings
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