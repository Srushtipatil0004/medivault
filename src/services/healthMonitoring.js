import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Listen to the current user's health readings in real time.
 * @param {string} uid - authenticated user id
 * @param {function} callback - receives array of readings (each with id and data)
 * @returns unsubscribe function
 */
export function fetchHealthReadings(uid, callback, onError) {
  const q = query(
    collection(db, "healthReadings"),
    where("uid", "==", uid)
  );
  return onSnapshot(q, (snapshot) => {
    const readings = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(readings);
  }, (err) => {
    console.error("[Firestore] listener error:", err.code, err.message);
    if (onError) onError(err);
  });
}

/**
 * Add a new health reading.
 * @param {string} uid
 * @param {Object} data - { date, time, systolic, diastolic, heartRate, bloodSugar, spo2, temperature, weight, notes }
 * @returns {Promise<string>} document id
 */
export async function addHealthReading(uid, data) {
  const docRef = await addDoc(collection(db, "healthReadings"), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete a health reading.
 * @param {string} uid
 * @param {string} readingId
 */
export async function deleteHealthReading(uid, readingId) {
  await deleteDoc(doc(db, "healthReadings", readingId));
}