import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Send,
  Loader2,
  Trash2,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { fetchUserContext, sendMessageToAI } from "../services/aiAssistant";
import { aiActions, getActionSchema } from "../services/aiActions";

function sanitizeForAI(value) {
  if (value === null || value === undefined) return value;
  if (
    typeof value === "object" &&
    typeof value.toDate === "function" &&
    typeof value.seconds === "number" &&
    typeof value.nanoseconds === "number"
  ) {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForAI);
  }
  if (typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = sanitizeForAI(value[key]);
    }
    return out;
  }
  return value;
}

function generateReadSummary(toolCalls, toolResults, userMessage) {
  const parts = [];
  for (const toolCall of toolCalls) {
    const name = toolCall.name;
    const result = toolResults[name];
    if (!Array.isArray(result)) continue;
    switch (name) {
      case "readMedicines": {
        if (!result.length) { parts.push("You have no medicines logged."); break; }
        const lowerMsg = userMessage.toLowerCase();
        const matched = result.find(m => m.name && lowerMsg.includes(m.name.toLowerCase()));
        if (matched) {
          const remaining = matched.remainingTablets ?? 0;
          const total = matched.totalTablets ?? 0;
          const dosage = matched.dosage ?? "";
          const freq = matched.frequency ?? "";
          parts.push(`${matched.name} is ${remaining === 0 ? "completed" : "still active"}. You have ${remaining} tablets remaining (${remaining}/${total}). Dosage: ${dosage}. Frequency: ${freq}.`);
        } else {
          const list = result.map(m => `${m.name} (${m.remainingTablets ?? 0} left)`).join(", ");
          parts.push(`Your medicines: ${list}.`);
        }
        break;
      }
      case "readAppointments": {
        if (!result.length) { parts.push("You have no appointments scheduled."); break; }
        const next = result[0];
        parts.push(`Your next appointment: ${next.doctorName} at ${next.hospital} on ${next.appointmentDate} ${next.appointmentTime}.`);
        break;
      }
      case "readMedicalRecords": {
        if (!result.length) { parts.push("No medical records found."); break; }
        const titles = result.slice(0,5).map(r => r.title).join(", ");
        parts.push(`Your medical records include: ${titles}.`);
        break;
      }
      case "readDiet": {
        if (!result.length) { parts.push("No diet entries logged."); break; }
        const latest = result[0];
        parts.push(`Latest meal: ${latest.foodName} (${latest.mealType}) on ${latest.date} at ${latest.time}.`);
        break;
      }
      case "readHealthReadings": {
        if (!result.length) { parts.push("No health readings recorded."); break; }
        const latest = result[0];
        const vitals = [];
        if (latest.heartRate) vitals.push(`HR ${latest.heartRate} bpm`);
        if (latest.systolic && latest.diastolic) vitals.push(`BP ${latest.systolic}/${latest.diastolic}`);
        if (latest.spo2) vitals.push(`SpO2 ${latest.spo2}%`);
        if (latest.bloodSugar) vitals.push(`Sugar ${latest.bloodSugar} mg/dL`);
        if (latest.temperature) vitals.push(`Temp ${latest.temperature}°C`);
        if (latest.weight) vitals.push(`Weight ${latest.weight} kg`);
        parts.push(`Latest vitals: ${vitals.join(", ") || "none recorded"}.`);
        break;
      }
      case "readPreferences": {
        if (!result.length) { parts.push("No preferences set."); break; }
        const pref = result[0];
        const prefs = [];
        if (pref.usualBreakfastTime) prefs.push(`Breakfast ${pref.usualBreakfastTime}`);
        if (pref.usualLunchTime) prefs.push(`Lunch ${pref.usualLunchTime}`);
        if (pref.usualDinnerTime) prefs.push(`Dinner ${pref.usualDinnerTime}`);
        parts.push(`Your meal preferences: ${prefs.join(", ") || "none"}.`);
        break;
      }
      default:
        parts.push(`${name} returned ${result.length} items.`);
    }
  }
  return parts.join(" ");
}

function generateWriteSummary(toolCall, result) {
  const name = toolCall.name;
  const args = toolCall.arguments;
  switch (name) {
    case "addMedicine":
      return `Done! Added **${args.name}** (${args.dosage}) to your medicines.`;
    case "updateMedicine": {
      const fields = Object.keys(args).filter(k => k !== "medicineId").join(", ");
      return `Done! Updated ${args.name || "medicine"} (${fields}).`;
    }
    case "deleteMedicine":
      return `Done! Medicine has been removed.`;
    case "takeDose":
      return `Done! Dose recorded for medicine.`;
    case "addAppointment":
      return `Done! Appointment with **${args.doctorName}** at **${args.hospital}** scheduled for **${args.appointmentDate} at ${args.appointmentTime}**.`;
    case "updateAppointment": {
      const updates = [];
      if (args.appointmentDate) updates.push(`date to ${args.appointmentDate}`);
      if (args.appointmentTime) updates.push(`time to ${args.appointmentTime}`);
      if (args.doctorName) updates.push(`doctor to ${args.doctorName}`);
      if (args.hospital) updates.push(`hospital to ${args.hospital}`);
      return `Done! Appointment updated: ${updates.join(", ")}.`;
    }
    case "deleteAppointment":
      return `Done! Appointment has been cancelled.`;
    case "addMedicalRecord":
      return `Done! Medical record "**${args.title}**" added.`;
    case "deleteMedicalRecord":
      return `Done! Medical record removed.`;
    case "addDietEntry":
      return `Done! **${args.foodName}** (${args.mealType}) logged for ${args.date} at ${args.time}.`;
    case "deleteDietEntry":
      return `Done! Diet entry removed.`;
    case "addHealthReading": {
      const vitals = [];
      if (args.weight) vitals.push(`Weight: ${args.weight} kg`);
      if (args.systolic && args.diastolic) vitals.push(`BP: ${args.systolic}/${args.diastolic}`);
      if (args.heartRate) vitals.push(`HR: ${args.heartRate} bpm`);
      if (args.bloodSugar) vitals.push(`Blood Sugar: ${args.bloodSugar} mg/dL`);
      if (args.spo2) vitals.push(`SpO2: ${args.spo2}%`);
      if (args.temperature) vitals.push(`Temp: ${args.temperature}°C`);
      return `Done! Health reading recorded: ${vitals.join(", ")}.`;
    }
    case "deleteHealthReading":
      return `Done! Health reading removed.`;
    case "updateUserPreference":
      return `Done! ${args.field} updated to ${args.value}.`;
    default:
      return `Done! ${name} completed successfully.`;
  }
}

function AIAssistant() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);
  const messagesEndRef = useRef(null);
  const actionSchema = getActionSchema();

  // fetch user context once
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    fetchUserContext(user.uid).then((data) => {
      if (!cancelled) setContext(sanitizeForAI(data));
    });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const executeAction = useCallback(async (actionName, args) => {
    if (!user) throw new Error("User not authenticated");
    const action = aiActions[actionName];
    if (!action) throw new Error(`Unknown action: ${actionName}`);
    return action(user.uid, ...Object.values(args));
  }, [user]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    
    try {
        let currentContext = context || {};
        let conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join("\n");
        
        // Map read tool names to context keys
        const contextKeyMap = {
          readMedicines: 'medicines',
          readAppointments: 'appointments',
          readMedicalRecords: 'medicalRecords',
          readDiet: 'diet',
          readHealthReadings: 'healthReadings',
          readPreferences: 'preferences',
        };
        
        // First, send to AI with available tools
        let aiResponse = await sendMessageToAIWithTools(text, currentContext, conversationHistory);
        
        // Handle function calls from AI
        while (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
          const toolCalls = aiResponse.toolCalls;
          const allRead = toolCalls.every(tc => tc.name.startsWith("read"));
          const toolResults = {};
          
          for (const toolCall of toolCalls) {
            setExecutingAction({ name: toolCall.name, args: toolCall.arguments });
            
            // Ask for confirmation before destructive actions
            const isDelete = toolCall.name.startsWith("delete");
            if (isDelete) {
              const confirmed = window.confirm(`Are you sure you want to delete this ${toolCall.name.replace("delete", "").toLowerCase()}?`);
              if (!confirmed) {
                setMessages((prev) => [...prev, { 
                  role: "assistant", 
                  content: "Action cancelled." 
                }]);
                setExecutingAction(null);
                setLoading(false);
                return;
              }
            }
            
            try {
              const rawResult = await executeAction(toolCall.name, toolCall.arguments);
              const result = sanitizeForAI(rawResult);
              toolResults[toolCall.name] = result;
              
              // Merge read-tool results into the standard context keys so the server sees them
              const ctxKey = contextKeyMap[toolCall.name];
              if (ctxKey && Array.isArray(result)) {
                currentContext = { ...currentContext, [ctxKey]: result };
              }
              // Also keep a private copy for UI display if needed
              currentContext = { ...currentContext, [`_toolResult_${toolCall.name}`]: result };
              
              // For read-only tools we will not show raw JSON in chat
              if (!toolCall.name.startsWith("read")) {
                setMessages((prev) => [...prev, { 
                  role: "tool", 
                  content: JSON.stringify({ action: toolCall.name, result: rawResult, success: true }),
                  toolCallId: toolCall.id 
                }]);
              }
            } catch (err) {
              setMessages((prev) => [...prev, { 
                role: "tool", 
                content: JSON.stringify({ action: toolCall.name, error: err.message, success: false }),
                toolCallId: toolCall.id 
              }]);
              
              // If tool fails, inform AI and continue
              aiResponse = await sendMessageToAIWithTools(
                `Tool ${toolCall.name} failed: ${err.message}. Please explain to the user and ask if they want to try again.`,
                currentContext,
                conversationHistory
              );
              setExecutingAction(null);
              continue;
            }
          }
          setExecutingAction(null);
          
          if (allRead) {
            // Generate natural-language summary directly, no second AI call
            const summary = generateReadSummary(toolCalls, toolResults, text);
            setMessages((prev) => [...prev, { role: "assistant", content: summary }]);
            break; // exit while loop
          } else {
            // For write actions, generate summary and show to user
            const writeSummaries = toolCalls
              .filter(tc => !tc.name.startsWith("read"))
              .map(tc => generateWriteSummary(tc, toolResults[tc.name]));
            
            if (writeSummaries.length > 0) {
              setMessages((prev) => [...prev, { role: "assistant", content: writeSummaries.join(" ") }]);
            }
            
            // Get AI response after tool execution for any follow-up
            aiResponse = await sendMessageToAIWithTools("", currentContext, conversationHistory);
          }
        }
      
      // Final response for non-read-only paths
      if (aiResponse.text && !aiResponse.toolCalls) {
        setMessages((prev) => [...prev, { role: "assistant", content: aiResponse.text }]);
      }
    } catch (err) {
      console.error("AI Assistant error:", err);
      
      // Handle different error types
      let errorMessage = "Sorry, I couldn't process that request. Please try again.";
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("ECONNREFUSED")) {
        errorMessage = "I'm temporarily unable to reach the AI service. Please check your connection and try again.";
      } else if (err.message.includes("API error: 5")) {
        errorMessage = "I'm temporarily unable to reach the AI service. Please try again in a moment.";
      } else if (err.message.includes("API error: 401") || err.message.includes("API error: 403")) {
        errorMessage = "AI service authentication failed. Please contact support.";
      }
      
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: errorMessage 
      }]);
    } finally {
      setLoading(false);
      setExecutingAction(null);
    }
  };

  // Send message to AI with tool definitions
  const sendMessageToAIWithTools = async (userMessage, userContext, history) => {
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
    
    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage, 
          context: userContext,
          history,
          tools: Object.entries(actionSchema).map(([name, schema]) => ({
            type: "function",
            function: {
              name,
              description: schema.description,
              parameters: schema.parameters,
            },
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both old format (just reply) and new format (with tool calls)
      if (data.toolCalls) {
        return { toolCalls: data.toolCalls, text: data.reply };
      }
      
      return { text: data.reply || "No response from AI." };
    } catch (error) {
      console.error("AI Assistant error:", error);
      throw error;
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-text">
          <h1>AI Assistant</h1>
          <p className="subtitle">Ask about your health data or request actions</p>
        </div>
        <div className="header-actions">
          {messages.length > 0 && (
            <button
              className="secondary-button"
              onClick={handleClear}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Trash2 className="icon" /> Clear Chat
            </button>
          )}
        </div>
      </header>

      <section className="glass-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: "400px" }}>
        <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7c93", marginTop: "40px" }}>
              <MessageSquare className="icon" style={{ fontSize: "48px", marginBottom: "12px", display: "block", marginLeft: "auto", marginRight: "auto" }} />
              <h3>Welcome to your AI Health Assistant</h3>
              <p>Ask me about your medical records, medicines, appointments, diet, or vitals.</p>
              <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>I can also perform actions like adding medicines, updating appointments, recording doses, and more.</p>
              <p style={{ fontSize: "0.85rem", marginTop: "8px", color: "#e11d48" }}>This assistant does not provide medical diagnoses. Consult a healthcare professional for medical advice.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              if (msg.role === "tool") {
                try {
                  const parsed = JSON.parse(msg.content);
                  return (
                    <div key={idx} className="chat-bubble tool" style={{
                      alignSelf: "flex-start",
                      background: parsed.success ? "#d1fae5" : "#fee2e2",
                      color: parsed.success ? "#065f46" : "#991b1b",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      maxWidth: "85%",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      border: `1px solid ${parsed.success ? "#a7f3d0" : "#fecaca"}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        {parsed.success ? <CheckCircle className="icon" style={{fontSize:"14px"}} /> : <AlertCircle className="icon" style={{fontSize:"14px"}} />}
                        <span style={{fontWeight:600}}>Action: {parsed.action}</span>
                      </div>
                      <pre style={{margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word"}}>{parsed.success ? JSON.stringify(parsed.result, null, 2) : parsed.error}</pre>
                    </div>
                  );
                } catch {
                  return null;
                }
              }
              
              return (
                <div key={idx} className={`chat-bubble ${msg.role}`} style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  background: msg.role === "user" ? "#2563eb" : "#e8eef7",
                  color: msg.role === "user" ? "#fff" : "#172b4d",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  maxWidth: "80%",
                  lineHeight: 1.5,
                  fontSize: "14px",
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "14px",
                  borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "14px",
                }}>
                  {msg.content}
                </div>
              );
            })
          )}
          {executingAction && (
            <div className="chat-bubble assistant" style={{ alignSelf: "flex-start", background: "#fff3cd", color: "#856404", padding: "10px 14px", borderRadius: "14px", maxWidth: "80%", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #ffecb5" }}>
              <Loader2 className="icon" style={{ animation: "spin 1s linear infinite" }} />
              <span>Executing: {executingAction.name}...</span>
            </div>
          )}
          {loading && !executingAction && (
            <div className="chat-bubble assistant" style={{ alignSelf: "flex-start", background: "#e8eef7", color: "#172b4d", padding: "10px 14px", borderRadius: "14px", maxWidth: "80%", display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader2 className="icon" style={{ animation: "spin 1s linear infinite" }} />
              <span>Thinking…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area" style={{ display: "flex", gap: "12px", padding: "16px", borderTop: "1px solid #e0e7ef", background: "#fff", borderBottomLeftRadius: "22px", borderBottomRightRadius: "22px", flexShrink: 0, minHeight: "150px", width: "100%", boxSizing: "border-box" }}>
          <form onSubmit={handleSend} style={{ display: "flex", flex: 1, gap: "12px", alignItems: "flex-end", width: "100%" }}>
            <textarea
              className="chat-input"
              placeholder="Type your question or request…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={3}
              autoComplete="off"
              style={{ 
                flex: 1, 
                minWidth: 0,
                width: "100%",
                padding: "12px 16px", 
                border: "1px solid #dbe5ef", 
                borderRadius: "12px", 
                fontSize: "15px", 
                background: "#fff", 
                color: "#172b4d",
                resize: "vertical",
                minHeight: "110px",
                maxHeight: "180px",
                lineHeight: 1.5,
                fontFamily: "inherit",
                boxShadow: "0 1px 3px rgba(16,42,67,0.05)",
                transition: "border 0.2s ease, box-shadow 0.2s ease",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              className="primary-button"
              disabled={loading || !input.trim()}
              style={{ 
                padding: "12px 12px", 
                whiteSpace: "nowrap", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                height: "48px",
                width: "80px",
                minWidth: "80px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="icon" style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
                  <span>{executingAction ? "Executing…" : "Sending…"}</span>
                </>
              ) : (
                <>
                  <Send className="icon" style={{ marginRight: "8px" }} />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default AIAssistant;