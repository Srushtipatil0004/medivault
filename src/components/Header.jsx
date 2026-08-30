import { useAuth } from "../context/AuthContext";
import { Bell } from "lucide-react";

function Header() {
  const { user } = useAuth();

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Patient";
  const avatarInitial = displayName?.[0]?.toUpperCase() || "P";

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">PATIENT DASHBOARD</p>
        <h1>Hello, {displayName}! 👋</h1>
        <p className="subtitle">
          Your health, organized in one secure place.
        </p>
      </div>

      <div className="header-actions">
        <button className="icon-button"><Bell className="icon" /></button>

        <div className="header-profile">
          <div className="avatar">{avatarInitial}</div>
        </div>
      </div>
    </header>
  );
}

export default Header;