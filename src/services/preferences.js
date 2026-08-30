import { collection, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Listen to the current user's meal time preferences.
 * @param {string} uid
 * @param {function} callback - receives object {usualBreakfastTime, usualLunchTime, usualDinnerTime}
 * @param {function} onError
 */
export function fetchPreferences(uid, callback, onError) {
  const ref = doc(db, "userPreferences", uid);
  return onSnapshot(ref, (snap) => {
    const data = snap.data() || {};
    callback({
      usualBreakfastTime: data.usualBreakfastTime || "",
      usualLunchTime: data.usualLunchTime || "",
      usualDinnerTime: data.usualDinnerTime || "",
    });
  }, (err) => {
    console.error("[Preferences] listener error:", err.code, err.message);
    if (onError) onError(err);
  });
}

/**
 * Update a single meal preference field for the user.
 * @param {string} uid
 * @param {string} field - one of "usualBreakfastTime", "usualLunchTime", "usualDinnerTime"
 * @param {string} value - HH:mm format
 */
export async function updatePreference(uid, field, value) {
  const ref = doc(db, "userPreferences", uid);
  await setDoc(ref, { [field]: value }, { merge: true });
}