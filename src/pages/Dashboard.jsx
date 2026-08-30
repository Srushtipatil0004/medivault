import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import AppointmentsCard from "../components/AppointmentsCard";
import MedicinesCard from "../components/MedicinesCard";
import NotificationCenter from "../components/NotificationCenter";
import { Bell } from "lucide-react";
import { fetchAppointments } from "../services/appointments";
import { fetchMedicines } from "../services/medicines";
import { fetchPreferences } from "../services/preferences";

const DEFAULT_MEAL_REFERENCE = {
  before_breakfast: "08:00",
  after_breakfast: "08:30",
  before_lunch: "13:00",
  after_lunch: "13:30",
  before_dinner: "20:00",
  after_dinner: "20:30",
  at_bedtime: "22:00",
};

function getMealFromTiming(timing) {
  if (!timing) return null;
  if (timing.includes("breakfast")) return "breakfast";
  if (timing.includes("lunch")) return "lunch";
  if (timing.includes("dinner")) return "dinner";
  return null;
}

function computeDoseOccurrence(med, timeStr, timeIndex, now, mealPrefs) {
  if (!med.reminderEnabled) return null;
  const lead = med.reminderLeadMinutes || 60;
  let scheduledStr = timeStr;
  if (!scheduledStr) {
    const meal = getMealFromTiming(med.timingType);
    if (meal) {
      const prefKey = `usual${meal.charAt(0).toUpperCase() + meal.slice(1)}Time`;
      scheduledStr = mealPrefs[prefKey] || DEFAULT_MEAL_REFERENCE[med.timingType] || "08:00";
    } else {
      scheduledStr = DEFAULT_MEAL_REFERENCE[med.timingType] || "08:00";
    }
  }
  const [sh, sm] = scheduledStr.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(sh, sm, 0, 0);
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  const trigger = new Date(scheduled.getTime() - lead * 60000);
  return {
    id: med.id,
    medicineName: med.name,
    dosage: med.dosage,
    scheduledTime: scheduled,
    triggerTime: trigger,
    timeIndex,
    takenDoses: med.takenDoses || [],
  };
}

function computeNextOccurrence(med, now, mealPrefs) {
  if (!med.reminderEnabled) return null;
  const lead = med.reminderLeadMinutes || 60;
  let scheduledStr = med.exactTime;
  if (!scheduledStr) {
    const meal = getMealFromTiming(med.timingType);
    if (meal) {
      const prefKey = `usual${meal.charAt(0).toUpperCase() + meal.slice(1)}Time`;
      scheduledStr = mealPrefs[prefKey] || DEFAULT_MEAL_REFERENCE[med.timingType] || "08:00";
    } else {
      scheduledStr = DEFAULT_MEAL_REFERENCE[med.timingType] || "08:00";
    }
  }
  const [sh, sm] = scheduledStr.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(sh, sm, 0, 0);
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  const trigger = new Date(scheduled.getTime() - lead * 60000);
  return {
    id: med.id,
    uid: med.uid,
    name: med.name,
    dosage: med.dosage,
    timingLabel: med.timingType,
    exactTime: med.exactTime,
    doctorInstruction: med.doctorInstruction,
    scheduledTime: scheduled,
    triggerTime: trigger,
    reminderLeadMinutes: med.reminderLeadMinutes,
    takenDoses: med.takenDoses || [],
    times: med.times || [],
  };
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Patient";
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [mealPrefs, setMealPrefs] = useState({ usualBreakfastTime: "", usualLunchTime: "", usualDinnerTime: "" });
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  // one-second timer for real-time current time
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // fetch appointments once (real-time listener)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAppointments([]);
      setLoadingAppts(false);
      return;
    }
    setLoadingAppts(true);
    const unsubscribe = fetchAppointments(
      user.uid,
      (data) => {
        setAppointments(data);
        setLoadingAppts(false);
      },
      (err) => {
        console.error("Dashboard appointments listener error:", err);
        setLoadingAppts(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  // fetch medicines once (real-time listener)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMedicines([]);
      setLoadingMeds(false);
      return;
    }
    setLoadingMeds(true);
    const unsubscribe = fetchMedicines(
      user.uid,
      (data) => {
        setMedicines(data);
        setLoadingMeds(false);
      },
      (err) => {
        console.error("Dashboard medicines listener error:", err);
        setLoadingMeds(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  // fetch meal preferences
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const unsub = fetchPreferences(
      user.uid,
      (prefs) => setMealPrefs(prefs),
      (err) => console.error("Failed to load meal prefs", err)
    );
    return unsub;
  }, [user, authLoading]);

  // helper to validate stored date/time
  const isValidAppointment = (appt) => {
    const dt = new Date(`${appt.appointmentDate}T${appt.appointmentTime}`);
    return !isNaN(dt.getTime());
  };

  // Upcoming appointments (next 7 days)
  const upcomingAppointmentsList = useMemo(() => {
    const now = currentTime;
    const limit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return appointments
      .filter(isValidAppointment)
      .map((a) => ({ ...a, dt: new Date(`${a.appointmentDate}T${a.appointmentTime}`) }))
      .filter((a) => a.dt > now && a.dt <= limit)
      .sort((a, b) => a.dt - b.dt);
  }, [appointments, currentTime]);

  // Upcoming medicine doses within reminder window
  const upcomingMedicineDosesList = useMemo(() => {
    const now = currentTime;
    const todayStr = now.toISOString().split("T")[0];
    const doses = [];
    medicines
      .filter(m => m.reminderEnabled)
      .forEach((med) => {
        const times = med.times && med.times.length ? med.times : [med.exactTime || ""];
        times.forEach((t, idx) => {
          const occ = computeDoseOccurrence(med, t, idx, now, mealPrefs);
          if (!occ) return;
          const takenToday = (occ.takenDoses || []).some(d => d.date === todayStr && d.timeIndex === occ.timeIndex);
          if (now >= occ.triggerTime && !takenToday) {
            doses.push(occ);
          }
        });
      });
    return doses.sort((a, b) => a.triggerTime - b.triggerTime);
  }, [medicines, currentTime, mealPrefs]);

  // compute medicine notifications (triggered) - unchanged for NotificationCenter
  const medicineNotifications = useMemo(() => {
    const now = currentTime;
    return medicines
      .filter(m => m.reminderEnabled)
      .map(m => computeNextOccurrence(m, now, mealPrefs))
      .filter(Boolean)
      .filter(o => {
        const todayStr = now.toISOString().split("T")[0];
        const takenToday = (o.takenDoses || []).some(d => d.date === todayStr && d.timeIndex === 0);
        return now >= o.triggerTime && !takenToday;
      })
      .map(o => ({
        id: o.id,
        type: "medicine",
        medicineName: o.name,
        dueTime: formatTime(o.scheduledTime),
        instruction: o.exactTime ? `Take at ${formatTime(o.scheduledTime)}` : `Instruction: ${o.timingLabel.replace(/_/g, ' ')}`,
        dosage: o.dosage,
        uid: o.uid,
        takenDoses: o.takenDoses,
        times: o.times,
      }));
  }, [medicines, currentTime]);

  // appointment notifications within next 24h - unchanged
  const appointmentNotifications = useMemo(() => {
    const now = currentTime;
    const limit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return appointments
      .filter(isValidAppointment)
      .map(a => ({ ...a, dt: new Date(`${a.appointmentDate}T${a.appointmentTime}`) }))
      .filter(a => a.dt > now && a.dt <= limit)
      .map(a => ({
        id: a.id,
        type: "appointment",
        doctorName: a.doctorName,
        hospital: a.hospital,
        date: formatDate(a.dt),
        time: formatTime(a.dt),
      }));
  }, [appointments, currentTime]);

  const allNotifications = useMemo(() => [
    ...medicineNotifications,
    ...appointmentNotifications,
  ].sort((a,b) => {
    const ta = a.type==='medicine' ? new Date(currentTime.toDateString() + ' ' + a.dueTime) : new Date(a.date + ' ' + a.time);
    const tb = b.type==='medicine' ? new Date(currentTime.toDateString() + ' ' + b.dueTime) : new Date(b.date + ' ' + b.time);
    return ta - tb;
  }), [medicineNotifications, appointmentNotifications, currentTime]);

  const notificationCount = allNotifications.length;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Hello, {displayName}! 👋</h1>
          <p className="subtitle">Your health, organized in one secure place.</p>
        </div>
        <div className="header-actions" style={{ marginLeft: "auto", position:"relative" }}>
          <button className="icon-button" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="icon" />
            {notificationCount > 0 && (
              <span className="notification-badge" style={{
                position:"absolute", top:"-4px", right:"-4px",
                background:"#e53935", color:"#fff", fontSize:"0.65rem",
                padding:"2px 5px", borderRadius:"999px", minWidth:"16px", textAlign:"center"
              }}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>
      {showNotifications && (
        <NotificationCenter
          notifications={allNotifications}
          medicines={medicines}
          onClose={() => setShowNotifications(false)}
        />
      )}
      <section className="dashboard-grid">
        <AppointmentsCard appointments={upcomingAppointmentsList} />
        <MedicinesCard reminders={upcomingMedicineDosesList} />
      </section>
    </>
  );
}

export default Dashboard;