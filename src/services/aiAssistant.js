import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

/**
 * Fetch all health data for the authenticated user (one-time read).
 * @param {string} uid - authenticated user id
 * @returns {Promise<Object>} object with arrays: medicalRecords, medicines, appointments, diet, healthReadings
 */
export async function fetchUserContext(uid) {
  const collections = [
    "medicalRecords",
    "appointments",
    "diet",
    "healthReadings",
  ];

  const data = {};

  for (const colName of collections) {
    const q = query(collection(db, colName), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    data[colName] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  }

  // Medicines are intentionally omitted; the AI should call the readMedicines tool
  // to get the full, up‑to‑date medicine list (including remainingTablets, dosage, etc.).
  data.medicines = [];

  return data;
}

/**
 * Send a user message to the backend AI endpoint and receive a response.
 * @param {string} userMessage
 * @param {Object} userContext - result of fetchUserContext
 * @param {Array} [history] - conversation history
 * @param {Array} [tools] - available tool definitions
 * @returns {Promise<Object>} AI response with reply and optional toolCalls
 */
export async function sendMessageToAI(userMessage, userContext, history = [], tools = []) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, context: userContext, history, tools }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Assistant error:", error);
    return { reply: "Sorry, I couldn't connect to the AI service. Please make sure the backend is running." };
  }
}