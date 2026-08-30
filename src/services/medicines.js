import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Listen to the current user's medicines in real time.
 * @param {string} uid - authenticated user id
 * @param {function} callback - receives array of medicines (each with id and data)
 * @returns unsubscribe function
 */
export function fetchMedicines(uid, callback, onError) {
  const q = query(collection(db, "medicines"), where("uid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const medicines = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(medicines);
  }, (err) => {
    console.error("[Firestore] listener error:", err.code, err.message);
    if (onError) onError(err);
  });
}

/**
 * Add a new medicine.
 * @param {string} uid
 * @param {Object} data - { name, dosage, frequency, timingType, exactTime, reminderEnabled, reminderLeadMinutes, doctorInstruction, startDate, endDate, notes, totalTablets, tabletsPerDose }
 * @returns {Promise<string>} document id
 */
export async function addMedicine(uid, data) {
  const docRef = await addDoc(collection(db, "medicines"), {
    uid,
    ...data,
    remainingTablets: data.totalTablets,
    takenDoses: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete a medicine.
 * @param {string} uid
 * @param {string} medicineId
 */
export async function deleteMedicine(uid, medicineId) {
  await deleteDoc(doc(db, "medicines", medicineId));
}

/**
 * Update an existing medicine (preserves tracking fields).
 * @param {string} uid
 * @param {string} medicineId
 * @param {Object} data - fields to update (name, dosage, frequency, timingType, exactTime, reminderEnabled, reminderLeadMinutes, doctorInstruction, startDate, endDate, notes, totalTablets, tabletsPerDose, times)
 */
export async function updateMedicine(uid, medicineId, data) {
  const ref = doc(db, "medicines", medicineId);
  await updateDoc(ref, data);
}

/**
 * Decrease remaining tablets for a medicine.
 * @param {string} uid
 * @param {string} medicineId
 * @param {number} decrement - number of tablets to subtract (usually tabletsPerDose)
 */
function getNextUntakenSchedule(times, takenDoses) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  // check today
  for (let i = 0; i < times.length; i++) {
    const already = takenDoses.some(d => d.date === dateStr && d.timeIndex === i);
    if (!already) return { date: dateStr, timeIndex: i };
  }
  // next day
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return { date: tomorrowStr, timeIndex: 0 };
}

export async function takeDose(uid, medicine) {
  const { id, times = [], takenDoses = [], tabletsPerDose = 1, remainingTablets, totalTablets } = medicine;
  const currentRemaining = Number(remainingTablets ?? totalTablets) || 0;
  if (currentRemaining <= 0) return;
  const perDose = Number(tabletsPerDose) || 1;
  const newRemaining = Math.max(0, currentRemaining - perDose);
  const schedule = getNextUntakenSchedule(times, takenDoses);
  const newTaken = [...takenDoses, { date: schedule.date, timeIndex: schedule.timeIndex, mode: 'manual', takenAt: Timestamp.now() }];
  await updateDoc(doc(db, "medicines", id), {
    remainingTablets: newRemaining,
    takenDoses: newTaken,
  });
}