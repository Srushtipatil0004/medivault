import Header from "../components/Header";
import AppointmentsCard from "../components/AppointmentsCard";
import MedicinesCard from "../components/MedicinesCard";

function Dashboard() {
  return (
    <>
      <Header />
      <section className="dashboard-grid">
        <AppointmentsCard />
        <MedicinesCard />
      </section>
    </>
  );
}

export default Dashboard;