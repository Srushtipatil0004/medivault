import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Listen to the current user's medical records in real time.
 * @param {string} uid - authenticated user id
 * @param {function} callback - receives array of records (each with id and data)
 * @returns unsubscribe function
 */
export function fetchRecords(uid, callback, onError) {
  const q = query(collection(db, "medicalRecords"), where("uid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(records);
  }, (err) => {
    console.error("[Firestore] listener error:", err.code, err.message);
    if (onError) onError(err);
  });
}

/**
 * Add a new medical record (attachments not stored).
 * @param {string} uid
 * @param {Object} data - { title, type, date, hospital, doctor }
 * @param {File|null} _file - ignored (attachments not supported)
 * @returns {Promise<string>} document id
 */
export async function addRecord(uid, data, _file = null) {
  const docRef = await addDoc(collection(db, "medicalRecords"), {
    uid,
    ...data,
    fileUrl: "",
    filePath: "",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete a medical record.
 * @param {string} uid
 * @param {string} recordId
 * @param {string} _filePath - ignored (no storage)
 */
export async function deleteRecord(uid, recordId, _filePath = "") {
  await deleteDoc(doc(db, "medicalRecords", recordId));
}