import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYnqGVu-3oemsn-gvx3zT_GhXfo09g3bU",
  authDomain: "duty-7bbf3.firebaseapp.com",
  databaseURL: "https://duty-7bbf3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duty-7bbf3",
  storageBucket: "duty-7bbf3.firebasestorage.app",
  messagingSenderId: "125339319944",
  appId: "1:125339319944:web:2d9d3a61d4800ecd8ea93d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = getDatabase(app);

let dutyList = [];
let currentDutyList = [];

async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, username, password);

    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "index.html";
  } catch (error) {
    alert("Ошибка авторизации: " + error.message);
  }
}
const loginForm = document.getElementById("login");
if (loginForm) {
  loginForm.addEventListener("submit", login);
}

async function saveDutyToFirebase() {
  showLoader();
  try {
    await set(ref(db, "duties/"), {
      dutyList: dutyList,
      currentDutyList: currentDutyList,
    });
    console.log("Данные успешно сохранены в Firebase.");
  } catch (error) {
    console.error("Ошибка при сохранении данных в Firebase: ", error);
  } finally {
    hideLoader();
  }
}

async function checkDutyList() {
  try {
    const snapshot = await get(ref(db, "duties"));
    if (!snapshot.exists() || snapshot.val().length === 0) {
      if (!window.location.href.includes("add-fio.html")) {
        window.location.href = "add-fio.html";
      }
    }
  } catch (error) {
    console.error("Ошибка при получении списка дежурных: ", error);
  }
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (!window.location.href.includes("login.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  try {
    await checkDutyList();
  } catch (error) {
    console.error("Ошибка при проверке списка дежурных: ", error);
  }
});

async function loadDutyList() {
  showLoader();
  try {
    const snapshot = await get(ref(db, "duties/"));

    if (snapshot.exists()) {
      const data = snapshot.val();

      dutyList = data.dutyList || [];
      currentDutyList = data.currentDutyList || [];
      console.log("Данные успешно загружены из Firebase.");

      displayDutyList();
    } else {
      console.log("Данные в Firebase отсутствуют.");
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных из Firebase: ", error);
  } finally {
    hideLoader();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.id === "main") {
    await loadDutyList();
  }
});

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
    const dutyDates =
      duty.dutyDates && duty.dutyDates.length > 0 ? duty.dutyDates.join(", ") : "нет";
    const buttonsHtml =
      duty.status === "ongoing"
        ? `
        <button onclick="markAsCompleted(${index})"><i class="fas fa-check"></i></button>
        <button onclick="markAsSkipped(${index})"><i class="fas fa-times"></i></button>
        <button onclick="cancelDuty(${index})"><i class="fas fa-ban"></i></button>
      `
        : duty.status === "skipped"
        ? `
        <button onclick="markAsAddet(${index})"><i class="fas fa-plus"></i></button>
        <button onclick="cancelDuty(${index})"><i class="fas fa-ban"></i></button>
        `
        : `
        <button onclick="markAsAddet(${index})"><i class="fas fa-plus"></i></button>
      `;

    const dutyHtml = `
      <div class="duty ${duty.status}">
        <span>${duty.name} - Всего: ${duty.count}</span>
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

  document.getElementById("totalDutyCount").innerText = `Всего дежурных: ${
    dutyList.length - ongoingCount - completedCount - skippedCount
  }`;
  document.getElementById("ongoingDutyCount").innerText = `Текущие дежурства: ${ongoingCount}`;
  document.getElementById(
    "completedDutyCount"
  ).innerText = `Завершенные дежурства: ${completedCount}`;
  document.getElementById("skippedDutyCount").innerText = `Сбежавшие дежурства: ${skippedCount}`;
  document.getElementById(
    "lastResetDate"
  ).innerText = `Последнее обновление статистики: ${new Date().toLocaleDateString()}`;
}

async function markAsAddet(index) {
  showLoader();

  try {
    const duty = dutyList[index];

    if (currentDutyList.some((d) => d.name === duty.name)) {
      alert("Этот дежурный уже в текущем дежурстве.");
      return;
    }

    if (duty.status !== "skipped") {
      duty.count++;
    }

    duty.status = "ongoing";
    if (duty.dutyDates) {
      duty.dutyDates.push(new Date().toLocaleDateString());
    } else {
      duty.dutyDates = [new Date().toLocaleDateString()];
    }

    currentDutyList.push({
      name: duty.name,
      count: duty.count,
      dutyDates: [...duty.dutyDates],
    });

    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при добавлении дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.markAsAddet = markAsAddet;

async function markAsCompleted(index) {
  showLoader();

  try {
    const duty = dutyList[index];
    if (duty.status !== "ongoing") {
      alert("Этот дежурный не может быть завершен.");
      return;
    }

    duty.status = "completed";
    currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при обновлении дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.markAsCompleted = markAsCompleted;

async function markAsSkipped(index) {
  showLoader();

  try {
    const duty = dutyList[index];
    if (duty.status !== "ongoing") {
      alert("Этот дежурный не может быть отмечен как сбежавший.");
      return;
    }

    duty.status = "skipped";
    currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при сбросе дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.markAsSkipped = markAsSkipped;

async function cancelDuty(index) {
  showLoader();

  try {
    const duty = dutyList[index];
    if (duty.status === "ongoing") {
      currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
    }

    duty.status = "";
    duty.count--;
    duty.dutyDates.pop();

    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при отмене дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.cancelDuty = cancelDuty;

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

function logout() {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Ошибка выхода: ", error);
    });
}

const addFio = async (event) => {
  event.preventDefault();
  const fioList = document
    .getElementById("fioList")
    .value.split("\n")
    .map((fio) => fio.trim())
    .filter((fio) => fio.length > 0);

  if (fioList.length === 0) {
    alert("Список не может быть пустым");
    return;
  }

  try {
    await set(ref(db, "duties/"), {
      dutyList: fioList.map((fio) => ({ name: fio, count: 0, status: "", dutyDates: [] })),
      currentDutyList: [],
    });
    alert("Список ФИО успешно сохранен!");
    window.location.href = "index.html"; // Редирект на главную страницу
  } catch (error) {
    console.error("Ошибка при сохранении данных: ", error);
    alert("Не удалось сохранить данные. Попробуйте снова.");
  }
};
const fioForm = document.getElementById("fioForm");
if (fioForm) {
  fioForm.addEventListener("submit", addFio);
}

const logoutButton = document.getElementById("logout");
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}
const selectDutiesButton = document.getElementById("selectDuties");

if (selectDutiesButton) {
  selectDutiesButton.addEventListener("click", selectDuties);
}

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");
}
