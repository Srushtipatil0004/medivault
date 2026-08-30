import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Listen to the current user's appointments in real time.
 * @param {string} uid - authenticated user id
 * @param {function} callback - receives array of appointments (each with id and data)
 * @returns unsubscribe function
 */
export function fetchAppointments(uid, callback, onError) {
  const q = query(
    collection(db, "appointments"),
    where("uid", "==", uid)
  );
  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(appointments);
  }, (err) => {
    console.error("[Firestore] listener error:", err.code, err.message);
    if (onError) onError(err);
  });
}

/**
 * Add a new appointment.
 * @param {string} uid
 * @param {Object} data - { doctorName, hospital, appointmentDate, appointmentTime, reason, notes }
 * @returns {Promise<string>} document id
 */
export async function addAppointment(uid, data) {
  const docRef = await addDoc(collection(db, "appointments"), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete an appointment.
 * @param {string} uid
 * @param {string} appointmentId
 */
export async function deleteAppointment(uid, appointmentId) {
  await deleteDoc(doc(db, "appointments", appointmentId));
}

export async function updateAppointment(uid, appointmentId, data) {
  console.log('[appointments.js] updateAppointment called', { uid, appointmentId, data });
  await updateDoc(doc(db, "appointments", appointmentId), data);
  console.log('[appointments.js] updateDoc resolved');
}