import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Listen to the current user's diet entries in real time.
 * @param {string} uid - authenticated user id
 * @param {function} callback - receives array of diet entries (each with id and data)
 * @returns unsubscribe function
 */
export function fetchDiet(uid, callback, onError) {
  const q = query(
    collection(db, "diet"),
    where("uid", "==", uid)
  );
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(entries);
  }, (err) => {
    console.error("[Firestore] listener error:", err.code, err.message);
    if (onError) onError(err);
  });
}

/**
 * Add a new diet entry.
 * @param {string} uid
 * @param {Object} data - { mealType, foodName, date, time, notes }
 * @returns {Promise<string>} document id
 */
export async function addDiet(uid, data) {
  const docRef = await addDoc(collection(db, "diet"), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete a diet entry.
 * @param {string} uid
 * @param {string} entryId
 */
export async function deleteDiet(uid, entryId) {
  await deleteDoc(doc(db, "diet", entryId));
}