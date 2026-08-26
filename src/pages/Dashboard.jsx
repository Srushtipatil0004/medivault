import AppointmentsCard from "../components/AppointmentsCard";
import MedicinesCard from "../components/MedicinesCard";

function Dashboard() {
  return (
    <section className="dashboard-grid">
      <AppointmentsCard />
      <MedicinesCard />
    </section>
  );
}

export default Dashboard;