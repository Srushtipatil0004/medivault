function Header() {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">PATIENT DASHBOARD</p>
        <h1>Good morning! 👋</h1>
        <p className="subtitle">
          Your health, organized in one secure place.
        </p>
      </div>

      <div className="header-actions">
        <button className="icon-button">🔔</button>

        <div className="header-profile">
          <div className="avatar">P</div>
          <div>
            <strong>Patient</strong>
            <span>Health ID: MV-2026-001</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;