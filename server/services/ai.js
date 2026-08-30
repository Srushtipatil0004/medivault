/**
 * AI Service for MediVault backend
 * Replace the implementation in callAIProvider() with your chosen AI provider (OpenAI, Anthropic, etc.)
 */

const SYSTEM_PROMPT = `You are MediVault's AI Health Assistant. You have access to the user's health data including:
- Medical Records
- Medicines
- Appointments
- Diet entries
- Health Monitoring readings (vitals)

You can perform actions on the user's data using the available tools.

=== MEDICAL-FIRST PRIORITY ===
When the user asks about medical topics, prioritize in this order:
1. **Personal MediVault data** (medicines, appointments, records, vitals, diet) — ALWAYS use read tools first
2. **General medical knowledge** (drug info, side effects, dosage guidelines) — use your training knowledge
3. **Internet/OpenRouter knowledge** — for latest research, interactions, etc.

Rules:
- "How many Paracetamol tablets left?" → MUST call readMedicines first, then answer from actual data
- "What is Paracetamol?" → Answer from your medical knowledge (drug class, uses, side effects)
- "Paracetamol dosage for adults?" → Answer from medical knowledge, but also check user's personal records if they have it
- "What are Paracetamol side effects?" → Answer from medical knowledge
- "Drug interactions with Paracetamol?" → Answer from medical knowledge
- Always prefer local records for personal data queries

=== READ RULE ===
Before answering ANY question that depends on the user's personal MediVault data, you MUST call the appropriate read tool:
- Medicine quantity, remaining tablets, dosage, frequency, timing, end date, stock → call readMedicines
- Appointments → call readAppointments
- Medical records → call readMedicalRecords
- Diet → call readDiet
- Weight / health readings → call readHealthReadings
- Preferences → call readPreferences

Do NOT answer from the initial static context when the requested information requires current user data. If the relevant read tool is available, call it first. After receiving the tool result, use that actual data to answer.

=== WRITE RULE ===
When the user asks you to add, update, or delete something, use the appropriate write tool when all required information is available.
If required fields are missing:
1. DO NOT call the tool with invented values.
2. DO NOT guess medical information.
3. DO NOT claim you are read‑only.
4. Ask the user specifically for the missing required fields.
5. Once the user supplies them, execute the appropriate tool.

Examples:
- User: "Add TestMed once daily at 8 PM." → if dosage, totalTablets, or tabletsPerDose are required but missing, ask for those fields.
- User: "Change my appointment tomorrow to 5 PM." → if exactly one matching appointment exists, call updateAppointment; if multiple could match, ask which appointment.
- User: "How many Ram tablets are left?" → first call readMedicines, then identify Ram and return its actual remainingTablets value.
- User: "Update my weight to 70kg" → call addHealthReading with weight: 70, date: today, time: now
- User: "Add BP reading 120/80" → call addHealthReading with systolic: 120, diastolic: 80, date: today, time: now

Never state:
"I'm a read-only AI assistant."
"I cannot modify your records."
"I cannot add medicines."
Those statements are incorrect for the current architecture.

=== GENERAL GUIDELINES ===
- Provide helpful summaries and insights based on the user's data
- NEVER claim to diagnose diseases or provide medical diagnoses
- Always recommend consulting a qualified healthcare professional for medical concerns
- Be cautious and clear that you are an AI assistant, not a doctor
- Keep responses concise and relevant to the user's question
- If you don't have relevant data, say so honestly
- For destructive actions (delete), confirm with the user if there's any ambiguity
- Only operate on the currently authenticated user's data
- When using tools, you MUST call them via the function calling mechanism
- Remember the user's original requested action across turns; if you ask for missing fields, use the supplied information on the next turn.`;

/**
 * Call the AI provider (OpenAI, Anthropic, etc.)
 * REPLACE THIS FUNCTION with your actual AI provider integration
 * @param {string} userMessage
 * @param {Object} userContext
 * @param {Array} tools - available tool definitions
 * @returns {Promise<Object>} { reply, toolCalls }
 */
async function callAIProvider(userMessage, userContext, tools = []) {
  const provider = process.env.AI_PROVIDER || "placeholder";

  // Diagnostic logging (safe, no secrets)
  console.debug("[AI] Provider:", provider);
  console.debug("[AI] Context keys:", Object.keys(userContext || {}));
  const collections = ["medicalRecords", "medicines", "appointments", "diet", "healthReadings"];
  for (const col of collections) {
    const arr = userContext?.[col];
    console.debug(`[AI] ${col}:`, Array.isArray(arr) ? arr.length : typeof arr, Array.isArray(arr));
  }
  if (userContext?.appointments?.length) {
    const sample = userContext.appointments[0];
    console.debug("[AI] Sample appointment:", {
      id: sample.id,
      doctorName: sample.doctorName,
      hospital: sample.hospital,
      appointmentDate: sample.appointmentDate,
      appointmentTime: sample.appointmentTime
    });
  }

  // Build context summary for the AI
  const contextSummary = buildContextSummary(userContext);

  const prompt = `${SYSTEM_PROMPT}

User's Health Context:
${contextSummary}

User Question: ${userMessage}

Available tools: ${tools.length > 0 ? JSON.stringify(tools.map(t => t.function), null, 2) : 'None available'}

Respond with either a direct answer or tool calls in this format:
TOOL_CALLS: [{"name": "toolName", "arguments": {...}, "id": "call_123"}]`;

  switch (provider) {
    case "openrouter":
      return await callOpenRouter(prompt, tools);
    case "anthropic":
      return await callAnthropic(prompt, tools);
    case "placeholder":
    default:
      return getPlaceholderResponse(userMessage, userContext, tools);
  }
}

async function callOpenRouter(prompt, tools = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured. Set it in .env or use AI_PROVIDER=placeholder");
  }

  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b";

  const messages = [{ role: "user", content: prompt }];
  
  const body = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 800,
  };

  // Add tools if available (OpenRouter supports OpenAI-style function calling)
  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  // Diagnostic logging (safe)
  console.debug("[AI] OpenRouter HTTP status:", response.status);
  const rawText = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    parsed = null;
  }
  console.debug("[AI] OpenRouter response top-level keys:", parsed ? Object.keys(parsed) : "non-JSON");
  if (parsed) {
    console.debug("[AI] choices exists:", Array.isArray(parsed.choices));
    console.debug("[AI] choices length:", parsed.choices ? parsed.choices.length : 0);
    if (parsed.choices && parsed.choices.length) {
      const first = parsed.choices[0];
      console.debug("[AI] choices[0] keys:", Object.keys(first));
      console.debug("[AI] choices[0].message exists:", !!first.message);
      if (first.message) {
        console.debug("[AI] choices[0].message keys:", Object.keys(first.message));
        console.debug("[AI] choices[0].message.content type:", typeof first.message.content);
        console.debug("[AI] choices[0].message.tool_calls:", first.message.tool_calls);
      }
    }
    if (parsed.error) {
      console.debug("[AI] OpenRouter error object keys:", Object.keys(parsed.error));
    }
  }

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${rawText}`);
  }

  if (!parsed) {
    throw new Error("OpenRouter returned non-JSON response");
  }

  const message = parsed.choices?.[0]?.message;
  if (!message) {
    console.debug("[AI] No message in OpenRouter response");
    return { reply: "", toolCalls: [] };
  }

  const content = message.content?.trim() || "";
  
  // Handle tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCalls = message.tool_calls.map((tc, idx) => ({
      id: tc.id || `call_${idx}`,
      name: tc.function?.name,
      arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
    })).filter(tc => tc.name);
    
    return { reply: content, toolCalls };
  }

  return { reply: content || "No response from AI.", toolCalls: [] };
}

/**
 * Build a concise summary of user's health data for the AI prompt
 */
function buildContextSummary(context) {
  const sections = [];

  // Medical Records
  const records = context.medicalRecords || [];
  if (records.length) {
    const items = records.slice(0, 5).map(r => `- ${r.title || r.name || "Untitled record"}`).join("\n");
    sections.push(`MEDICAL RECORDS:\n${items}`);
  } else {
    sections.push("MEDICAL RECORDS:\n- no records available");
  }

  // Medicines
  const meds = context.medicines || [];
  if (meds.length) {
    const items = meds.slice(0, 5).map(m => `- ${m.name || "Unnamed medicine"} (${m.remainingTablets !== undefined ? m.remainingTablets : '?' } tablets left)`).join("\n");
    sections.push(`MEDICINES:\n${items}`);
  } else {
    sections.push("MEDICINES:\n- no records available");
  }

  // Appointments
  const appts = context.appointments || [];
  if (appts.length) {
    const items = appts.slice(0, 3).map(a =>
      `- ${a.doctorName || "Unknown doctor"} at ${a.hospital || "Unknown hospital"} on ${a.appointmentDate || "Unknown date"} ${a.appointmentTime || ""}`
    ).join("\n");
    sections.push(`APPOINTMENTS:\n${items}`);
  } else {
    sections.push("APPOINTMENTS:\n- no records available");
  }

  // Diet
  const diet = context.diet || [];
  if (diet.length) {
    const items = diet.slice(0, 3).map(d =>
      `- ${d.foodName || "Unnamed food"} (${d.mealType || "meal"}) on ${d.date || "Unknown date"}`
    ).join("\n");
    sections.push(`DIET:\n${items}`);
  } else {
    sections.push("DIET:\n- no records available");
  }

  // Health Readings
  const readings = context.healthReadings || [];
  if (readings.length) {
    const latest = readings[0];
    const vitals = [];
    if (latest.heartRate) vitals.push(`HR ${latest.heartRate} bpm`);
    if (latest.systolic && latest.diastolic) vitals.push(`BP ${latest.systolic}/${latest.diastolic}`);
    if (latest.spo2) vitals.push(`SpO2 ${latest.spo2}%`);
    if (latest.bloodSugar) vitals.push(`Sugar ${latest.bloodSugar} mg/dL`);
    if (latest.temperature) vitals.push(`Temp ${latest.temperature}°C`);
    if (latest.weight) vitals.push(`Weight ${latest.weight} kg`);
    const items = vitals.length ? vitals.map(v => `- ${v}`).join("\n") : "- none recorded";
    sections.push(`HEALTH READINGS:\n${items}`);
  } else {
    sections.push("HEALTH READINGS:\n- no records available");
  }

  return sections.join("\n\n");
}

/**
 * Placeholder response for testing without an AI provider
 * Now supports basic tool calling simulation
 */
function getPlaceholderResponse(userMessage, userContext, tools = []) {
  const lower = userMessage.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi")) {
    return { reply: "Hello! I can help you review your health data. Ask me about your records, medicines, appointments, diet, or vitals.", toolCalls: [] };
  }
  if (lower.includes("medicine") || lower.includes("medication")) {
    const meds = userContext.medicines || [];
    if (!meds.length) return { reply: "You have no medicines logged.", toolCalls: [] };
    const names = meds.map(m => `${m.name} (${m.remainingTablets || '?'} left)`).join(", ");
    return { reply: `Your current medicines: ${names}.`, toolCalls: [] };
  }
  if (lower.includes("appointment")) {
    const appts = userContext.appointments || [];
    if (!appts.length) return { reply: "You have no appointments scheduled.", toolCalls: [] };
    const next = appts[0];
    return { reply: `Your next appointment: ${next.doctorName} at ${next.hospital} on ${next.appointmentDate} ${next.appointmentTime}.`, toolCalls: [] };
  }
  if (lower.includes("record")) {
    const recs = userContext.medicalRecords || [];
    if (!recs.length) return { reply: "No medical records found.", toolCalls: [] };
    const titles = recs.map(r => r.title).join(", ");
    return { reply: `Your medical records include: ${titles}.`, toolCalls: [] };
  }
  if (lower.includes("diet") || lower.includes("meal")) {
    const diet = userContext.diet || [];
    if (!diet.length) return { reply: "No diet entries logged.", toolCalls: [] };
    const latest = diet[0];
    return { reply: `Latest meal: ${latest.foodName} (${latest.mealType}) on ${latest.date} at ${latest.time}.`, toolCalls: [] };
  }
  if (lower.includes("vital") || lower.includes("health") || lower.includes("reading")) {
    const readings = userContext.healthReadings || [];
    if (!readings.length) return { reply: "No health readings recorded.", toolCalls: [] };
    const latest = readings[0];
    const parts = [];
    if (latest.heartRate) parts.push(`HR ${latest.heartRate} bpm`);
    if (latest.systolic && latest.diastolic) parts.push(`BP ${latest.systolic}/${latest.diastolic}`);
    if (latest.spo2) parts.push(`SpO2 ${latest.spo2}%`);
    if (latest.bloodSugar) parts.push(`Sugar ${latest.bloodSugar} mg/dL`);
    if (latest.temperature) parts.push(`Temp ${latest.temperature}°C`);
    if (latest.weight) parts.push(`Weight ${latest.weight} kg`);
    return { reply: `Latest vitals: ${parts.join(", ")}.`, toolCalls: [] };
  }

  return { 
    reply: "I'm a health-assistant prototype. I can summarize your records, medicines, appointments, diet, or vitals. For medical advice, please consult a qualified healthcare professional.", 
    toolCalls: [] 
  };
}


/**
 * Anthropic integration - uncomment and configure when ready
 */
/*
async function callAnthropic(prompt, tools = []) {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
    max_tokens: 500,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
    tools: tools.length > 0 ? tools : undefined,
  });
  
  const toolCalls = message.content
    .filter(c => c.type === 'tool_use')
    .map((tc, idx) => ({
      id: tc.id || `call_${idx}`,
      name: tc.name,
      arguments: tc.input,
    }));
  
  const text = message.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join("");
  
  return { reply: text.trim(), toolCalls };
}
*/

export async function aiChatHandler(req, res) {
  try {
    const { message, context, history = [], tools = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Sanitize message length
    const sanitizedMessage = message.slice(0, 2000);

    // Use provided context or empty object
    const userContext = context || {};

    const result = await callAIProvider(sanitizedMessage, userContext, tools);

    res.json(result);
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ 
      error: "Failed to process request",
      reply: "Sorry, I encountered an error. Please try again later.",
      toolCalls: []
    });
  }
}