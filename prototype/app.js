const goalSelect = document.querySelector("#goal-select");
const goalSummary = document.querySelector("#goal-summary");
const goalPills = document.querySelector("#goal-pills");
const hydrationOutput = document.querySelector("#hydration-output");
const weeklyOutput = document.querySelector("#weekly-output");
const waterNo = document.querySelector("#water-no");
const waterYes = document.querySelector("#water-yes");
const weeklyButtons = document.querySelectorAll(".weekly-check");

const goalContent = {
  strength: {
    summary: "Prioritize heavy compound lifts, stable protein intake, and longer recovery between high-output sessions.",
    pills: ["Heavy top sets", "Protein forward", "Manage fatigue"],
  },
  hypertrophy: {
    summary: "Bias toward higher weekly volume, moderate rep ranges, and meal timing that supports muscle growth and recovery.",
    pills: ["Volume focus", "Recovery meals", "Muscle balance"],
  },
  endurance: {
    summary: "Reduce unnecessary lifting fatigue, support glycogen availability, and protect quality cardio sessions.",
    pills: ["Cardio priority", "Fuel sessions", "Fatigue control"],
  },
  fatloss: {
    summary: "Maintain muscle and strength while controlling calories, keeping protein high, and preventing burnout.",
    pills: ["Calorie control", "High protein", "Strength retention"],
  },
  flexibility: {
    summary: "Add mobility dosage, reduce movement restrictions, and organize sessions to improve range without excess fatigue.",
    pills: ["Mobility blocks", "Lower stiffness", "Recovery friendly"],
  },
};

function renderGoal(goalKey) {
  const data = goalContent[goalKey];
  goalSummary.textContent = data.summary;
  goalPills.innerHTML = data.pills.map((pill) => `<span class="pill">${pill}</span>`).join("");
}

goalSelect.addEventListener("change", (event) => {
  renderGoal(event.target.value);
});

waterNo.addEventListener("click", () => {
  hydrationOutput.textContent =
    "You are behind target. Drink 40 oz between 1:15 PM and 5:00 PM, then the app should check in again at 5:00 PM. Remaining daily target after that: 40 oz.";
});

waterYes.addEventListener("click", () => {
  hydrationOutput.textContent =
    "If you have already had at least 48 oz by 1:00 PM, you are on pace. Finish the remaining 40 oz by 8:30 PM. If you are below that, the app should schedule another hydration check 4 hours from now.";
});

weeklyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const state = button.dataset.checkin;

    if (state === "stronger") {
      weeklyOutput.textContent =
        "You feel stronger. The app should preserve the main structure of your week, consider a small load increase on your best-performing lifts, and avoid changing exercises that are progressing well.";
      return;
    }

    if (state === "same") {
      weeklyOutput.textContent =
        "You feel about the same. The app should inspect your weekly volume, recovery, and progression trend, then make a light adjustment like tightening exercise order, adding a rep target, or replacing one low-value movement.";
      return;
    }

    weeklyOutput.textContent =
      "You feel weaker. The app should check for poor sleep, low recovery, overlapping fatigue, calorie shortfall, or repeated performance drops, then suggest lowering fatigue, reducing volume, or changing exercise placement.";
  });
});

renderGoal(goalSelect.value);
