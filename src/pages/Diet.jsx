import { useState } from "react";

const meals = [
  {
    title: "Breakfast",
    time: "08:00 AM",
    icon: "🥣",
    items: ["Oats", "Banana", "Milk"],
    calories: 350,
    protein: 12,
    carbs: 55,
    status: "Healthy",
  },
  {
    title: "Lunch",
    time: "01:00 PM",
    icon: "🍛",
    items: ["Rice", "Dal", "Salad"],
    calories: 550,
    protein: 20,
    carbs: 80,
    status: "Healthy",
  },
  {
    title: "Snacks",
    time: "04:30 PM",
    icon: "🥜",
    items: ["Almonds", "Green Tea"],
    calories: 180,
    protein: 5,
    carbs: 15,
    status: "Healthy",
  },
  {
    title: "Dinner",
    time: "08:00 PM",
    icon: "🍽️",
    items: ["Chapati", "Vegetable Curry", "Curd"],
    calories: 420,
    protein: 15,
    carbs: 60,
    status: "Healthy",
  },
];

const nutritionSummary = {
  caloriesConsumed: 1500,
  caloriesGoal: 2200,
  protein: 52,
  proteinGoal: 70,
  waterIntake: 1.8,
  waterGoal: 3.0,
};

function Diet() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Breakfast", "Lunch", "Snacks", "Dinner"];

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Diet & Nutrition</h1>
          <p className="subtitle">Track your daily meals and maintain a healthy lifestyle</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search meals..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {filters.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="primary-button">+ Add Meal</button>
        </div>
      </header>

      <section className="diet-layout">
        {/* Meal Cards */}
        <div className="meals-grid">
          {meals.map((meal, idx) => (
            <article key={idx} className="glass-card meal-card">
              <div className="card-heading">
                <div className="record-title-row">
                  <span className="record-icon">{meal.icon}</span>
                  <h2>{meal.title}</h2>
                </div>
              </div>

              <div className="record-meta">
                <p><strong>Time:</strong> {meal.time}</p>
                <p><strong>Items:</strong> {meal.items.join(", ")}</p>
                <p><strong>Calories:</strong> {meal.calories} kcal</p>
                <p><strong>Protein:</strong> {meal.protein} g</p>
                <p><strong>Carbs:</strong> {meal.carbs} g</p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status-badge ${meal.status.toLowerCase()}`}>{meal.status}</span>
                </p>
              </div>

              <div className="record-actions">
                <button className="primary-button">View Details</button>
              </div>
            </article>
          ))}
        </div>

        {/* Nutrition Summary Card */}
        <aside className="nutrition-card glass-card">
          <div className="card-heading">
            <h2>Nutrition Summary</h2>
          </div>
          <div className="nutrition-meta">
            <div className="nutrient">
              <div className="nutrient-label">Calories Consumed</div>
              <div className="nutrient-value">{nutritionSummary.caloriesConsumed} / {nutritionSummary.caloriesGoal} kcal</div>
              <div className="progress-bar"><div className="progress-fill" style={{width: `${Math.round(nutritionSummary.caloriesConsumed/nutritionSummary.caloriesGoal*100)}%`}}></div></div>
            </div>
            <div className="nutrient">
              <div className="nutrient-label">Protein</div>
              <div className="nutrient-value">{nutritionSummary.protein} / {nutritionSummary.proteinGoal} g</div>
              <div className="progress-bar"><div className="progress-fill" style={{width: `${Math.round(nutritionSummary.protein/nutritionSummary.proteinGoal*100)}%`}}></div></div>
            </div>
            <div className="nutrient">
              <div className="nutrient-label">Water Intake</div>
              <div className="nutrient-value">{nutritionSummary.waterIntake} / {nutritionSummary.waterGoal} L</div>
              <div className="progress-bar"><div className="progress-fill" style={{width: `${Math.round(nutritionSummary.waterIntake/nutritionSummary.waterGoal*100)}%`}}></div></div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default Diet;