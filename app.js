let dutyList = [];
document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
  } else {
    await fecthDutyList();
    displayDutyList();
  }
});

let currentDutyList = JSON.parse(localStorage.getItem("currentDutyList")) || [];

async function fecthDutyList() {
  const data = JSON.parse(localStorage.getItem("dutyList"));
  if (data) {
    dutyList = data;
  } else {
    const dutyListNames = await fetch("data.json").then((res) => res.json());
    dutyList = dutyListNames.map((fio) => {
      return {
        name: fio,
        count: 0,
        weeklyCount: 0,
        status: "",
        dutyDates: [],
      };
    });
  }
}

function displayDutyList() {
  const dutyListDiv = document.getElementById("dutyList");
  const completedDutyListDiv = document.getElementById("completedDutyList");
  const skippedDutyListDiv = document.getElementById("skippedDutyList");
  const currentDutyListDiv = document.getElementById("currentDutyList");

  dutyListDiv.innerHTML = "";
  completedDutyListDiv.innerHTML = "";
  skippedDutyListDiv.innerHTML = "";
  currentDutyListDiv.innerHTML = "";

  dutyList.forEach((duty, index) => {
    const dutyDates = duty.dutyDates.length > 0 ? duty.dutyDates.join(", ") : "нет";
    const buttonsHtml =
      duty.status === "ongoing"
        ? `
      <div>
        <button onclick="markAsAddet(${index})"><i class="fas fa-plus"></i></button>
        <button onclick="markAsCompleted(${index})"><i class="fas fa-check"></i></button>
        <button onclick="markAsSkipped(${index})"><i class="fas fa-times"></i></button>
        <button onclick="cancelDuty(${index})"><i class="fas fa-ban"></i></button>
      </div>
    `
        : `
      <div>
        <button onclick="markAsAddet(${index})"><i class="fas fa-plus"></i></button>
        <button onclick="markAsCompleted(${index})"><i class="fas fa-check"></i></button>
      </div>
    `;

    const dutyHtml = `
      <div class="duty ${duty.status}">
        <span>${duty.name} - Всего: ${duty.count} (неделя: ${duty.weeklyCount})</span>
        <div class="dates">Даты дежурств: ${dutyDates}</div>
        <div class="buttons">
          ${buttonsHtml}
        </div>
      </div>
    `;

    if (duty.status === "completed") {
      completedDutyListDiv.innerHTML += dutyHtml;
    } else if (duty.status === "skipped") {
      skippedDutyListDiv.innerHTML += dutyHtml;
    } else if (duty.status === "ongoing") {
      currentDutyListDiv.innerHTML += dutyHtml;
    } else {
      dutyListDiv.innerHTML += dutyHtml;
    }
  });

  updateStatistics();
}

function updateStatistics() {
  const ongoingCount = dutyList.filter((d) => d.status === "ongoing").length;
  const completedCount = dutyList.filter((d) => d.status === "completed").length;
  const skippedCount = dutyList.filter((d) => d.status === "skipped").length;

  document.getElementById("totalDutyCount").innerText = `Всего дежурных: ${dutyList.length}`;
  document.getElementById("ongoingDutyCount").innerText = `Текущие дежурства: ${ongoingCount}`;
  document.getElementById(
    "completedDutyCount"
  ).innerText = `Завершенные дежурства: ${completedCount}`;
  document.getElementById("skippedDutyCount").innerText = `Сбежавшие дежурства: ${skippedCount}`;
  document.getElementById(
    "lastResetDate"
  ).innerText = `Последнее обновление статистики: ${new Date().toLocaleDateString()}`;
}

function markAsAddet(index) {
  const duty = dutyList[index];

  if (currentDutyList.some((d) => d.name === duty.name)) {
    alert("Этот дежурный уже в текущем дежурстве.");
    return;
  }

  duty.status = "ongoing";
  duty.count++;
  duty.weeklyCount++;
  duty.dutyDates.push(new Date().toLocaleDateString());

  currentDutyList.push({
    name: duty.name,
    count: duty.count,
    weeklyCount: duty.weeklyCount,
    dutyDates: [...duty.dutyDates],
  });

  saveToLocalStorage();
  displayDutyList();
}

function markAsCompleted(index) {
  const duty = dutyList[index];
  if (duty.status !== "ongoing") {
    alert("Этот дежурный не может быть завершен.");
    return;
  }

  duty.status = "completed";
  currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
  saveToLocalStorage();
  displayDutyList();
}

function markAsSkipped(index) {
  const duty = dutyList[index];
  if (duty.status !== "ongoing") {
    alert("Этот дежурный не может быть отмечен как сбежавший.");
    return;
  }

  duty.status = "skipped";
  currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
  saveToLocalStorage();
  displayDutyList();
}

function cancelDuty(index) {
  const duty = dutyList[index];
  if (duty.status === "ongoing") {
    currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
  }

  duty.status = "";
  duty.count--;
  duty.weeklyCount--;
  duty.dutyDates.pop();

  saveToLocalStorage();
  displayDutyList();
}

function selectDuties() {
  const eligibleDuties = dutyList.filter((duty) => duty.status === "");
  if (eligibleDuties.length < 3) {
    alert("Недостаточно дежурных для выбора.");
    return;
  }

  const selectedDuties = [];
  while (selectedDuties.length < 3) {
    const randomIndex = Math.floor(Math.random() * eligibleDuties.length);
    const selectedDuty = eligibleDuties[randomIndex];
    if (!selectedDuties.includes(selectedDuty)) {
      selectedDuties.push(selectedDuty);
    }
  }

  selectedDuties.forEach((duty) => markAsAddet(dutyList.indexOf(duty)));
}

function saveToLocalStorage() {
  localStorage.setItem("dutyList", JSON.stringify(dutyList));
  localStorage.setItem("currentDutyList", JSON.stringify(currentDutyList));
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
