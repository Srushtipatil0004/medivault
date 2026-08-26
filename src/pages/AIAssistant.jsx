import { useState } from "react";

const exampleMessages = [
  { sender: "user", text: "I have a headache." },
  { sender: "ai", text: "Stay hydrated and monitor your symptoms. If severe or persistent, consult a doctor." },
  { sender: "user", text: "When should I take my medicine?" },
  { sender: "ai", text: "Take it after breakfast at 8:00 AM." },
];

const quickActions = [
  { icon: "🩺", title: "Symptom Checker", desc: "Check possible conditions based on symptoms." },
  { icon: "💊", title: "Medicine Guide", desc: "Learn about dosage, side effects, and interactions." },
  { icon: "🥗", title: "Diet Advice", desc: "Get personalized nutrition recommendations." },
  { icon: "📅", title: "Appointment Help", desc: "Prepare questions for your next visit." },
];

function AIAssistant() {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      // UI only – no backend
      setInput("");
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>AI Health Assistant</h1>
          <p className="subtitle">Ask health-related questions and get intelligent guidance</p>
        </div>
      </header>

      <section className="ai-layout">
        {/* Left Chat Panel */}
        <div className="glass-card chat-panel">
          <div className="chat-header">
            <h2>AI Conversation</h2>
          </div>
          <div className="chat-messages">
            {exampleMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender}`}>
                <strong>{msg.sender === "user" ? "You" : "AI"}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask your health question..."
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="primary-button send-btn" onClick={handleSend}>Send</button>
          </div>
        </div>

        {/* Right Quick Actions Panel */}
        <div className="quick-panel">
          {quickActions.map((action, idx) => (
            <article key={idx} className="glass-card quick-card">
              <div className="card-heading">
                <div className="record-title-row">
                  <span className="record-icon">{action.icon}</span>
                  <h2>{action.title}</h2>
                </div>
              </div>
              <p className="quick-desc">{action.desc}</p>
              <button className="primary-button">Ask AI</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AIAssistant;