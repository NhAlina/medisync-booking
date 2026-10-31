import "./scss/main.scss";
import type { IDoctor } from "./model/idoctor";
import type { ServiceType } from "./model/type";

let doctorsList: IDoctor[] = [];
const dataURL = "/doctors.json";

// Усі стандартні слоти зміни
const ALL_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00",
  "11:30", "12:00", "12:30", "13:00", "13:30"
];

// Заповнення випадаючого списку лікарів
function fillDoctorSelect(selectSelector: string, filterType: ServiceType) {
  const selector = document.querySelector<HTMLSelectElement>(selectSelector);
  if (!selector) return;

  selector.innerHTML = "";
  doctorsList.forEach((doc, index) => {
    if (doc.type === filterType) {
      const option = document.createElement("option");
      option.value = index.toString();
      option.text = `${doc.name} — ${doc.specialty} (${doc.price} грн)`;
      selector.add(option);
    }
  });

  updateSlotsForSelectedDay();
  calculatePrice();
}

// Динамічне оновлення слотів часу відповідно до лікаря та дати
function updateSlotsForSelectedDay() {
  const selectedDayInput = document.querySelector<HTMLInputElement>('input[name="booking-day"]:checked');
  const docSelect = document.querySelector<HTMLSelectElement>("#doc-select");
  const slotsContainer = document.querySelector(".slots-grid");

  if (!selectedDayInput || !docSelect || !slotsContainer) return;

  const dayNumber = selectedDayInput.parentElement?.querySelector("span")?.innerText.trim() || "16";
  const doctorIndex = parseInt(docSelect.value, 10);
  const selectedDoctor = doctorsList[doctorIndex];

  let availableSlots: string[] = [];
  if (selectedDoctor?.schedule) {
    availableSlots = selectedDoctor.schedule[dayNumber] || selectedDoctor.schedule["default"] || ALL_TIME_SLOTS;
  } else {
    availableSlots = ALL_TIME_SLOTS;
  }

  slotsContainer.innerHTML = "";
  let firstSelected = false;

  ALL_TIME_SLOTS.forEach((time) => {
    const isFree = availableSlots.includes(time);
    const label = document.createElement("label");
    label.className = `slot-btn ${isFree ? "" : "disabled"}`;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "time-slot";
    input.value = time;

    if (!isFree) {
      input.disabled = true;
    } else if (!firstSelected) {
      input.checked = true;
      firstSelected = true;
    }

    const span = document.createElement("span");
    span.innerText = time;

    label.appendChild(input);
    label.appendChild(span);
    slotsContainer.appendChild(label);
  });
}

// Розрахунок вартості
function calculatePrice(): number {
  const docSelect = document.querySelector<HTMLSelectElement>("#doc-select");
  const secondaryRadio = document.querySelector<HTMLInputElement>(
    'input[name="consultation-type"][value="secondary"]'
  );
  const priceDisplay = document.querySelector<HTMLElement>("#total-price");

  if (!docSelect || !priceDisplay || doctorsList.length === 0) return 0;

  const selectedIndex = parseInt(docSelect.value, 10);
  const selectedDoctor = doctorsList[selectedIndex];

  if (selectedDoctor) {
    const basePrice = selectedDoctor.price;
    const isSecondary = secondaryRadio ? secondaryRadio.checked : false;
    const finalPrice = isSecondary ? Math.round(basePrice * 0.75) : basePrice;

    priceDisplay.innerText = `${finalPrice} грн`;
    return finalPrice;
  }
  return 0;
}

// Швидкий вибір лікаря з картки (скрол + підстановка + перерахунок)
(window as any).selectDoctorByIndex = (index: number) => {
  const docSelect = document.querySelector<HTMLSelectElement>("#doc-select");
  if (docSelect) {
    docSelect.value = index.toString();
    calculatePrice();
    updateSlotsForSelectedDay();
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
  }
};

// Закриття модального вікна
(window as any).closeTicketModal = () => {
  const modal = document.querySelector("#ticket-modal");
  modal?.classList.remove("active");
};

// Валідація та генерація талона
function handleBookingSubmit() {
  const nameInput = document.querySelector<HTMLInputElement>("#patient-name");
  const phoneInput = document.querySelector<HTMLInputElement>("#patient-phone");
  const nameError = document.querySelector<HTMLElement>("#name-error");
  const phoneError = document.querySelector<HTMLElement>("#phone-error");

  const nameVal = nameInput?.value.trim() || "";
  const phoneVal = phoneInput?.value.trim() || "";

  const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ']{2,}(\s+[A-Za-zА-Яа-яІіЇїЄєҐґ']{2,})+$/;
  const phoneClean = phoneVal.replace(/[\s\-\(\)]/g, "");
  const phoneRegex = /^(\+?380|0)\d{9}$/;

  let isValid = true;

  if (!nameRegex.test(nameVal)) {
    nameInput?.classList.add("invalid");
    if (nameError) {
      nameError.textContent = "Введіть прізвище та ім'я літерами (без цифр та спецсимволів).";
      nameError.classList.add("visible");
    }
    isValid = false;
  } else {
    nameInput?.classList.remove("invalid");
    nameError?.classList.remove("visible");
  }

  if (!phoneRegex.test(phoneClean)) {
    phoneInput?.classList.add("invalid");
    if (phoneError) {
      phoneError.textContent = "Невірний номер. Введіть коректний телефон (+380XXXXXXXXX або 0XXXXXXXXX).";
      phoneError.classList.add("visible");
    }
    isValid = false;
  } else {
    phoneInput?.classList.remove("invalid");
    phoneError?.classList.remove("visible");
  }

  if (!isValid) return;

  const selectedDayInput = document.querySelector<HTMLInputElement>('input[name="booking-day"]:checked');
  const dayText = selectedDayInput?.parentElement?.querySelector("span")?.innerText.trim() || "16";
  const dayNum = parseInt(dayText, 10);
  const monthName = dayNum >= 16 ? "жовтня" : "листопада";
  const fullDateText = `${dayNum} ${monthName} 2026 р.`;

  const docSelect = document.querySelector<HTMLSelectElement>("#doc-select");
  const selectedDoctor = doctorsList[parseInt(docSelect?.value || "0", 10)];
  const selectedTimeInput = document.querySelector<HTMLInputElement>('input[name="time-slot"]:checked');
  const secondaryRadio = document.querySelector<HTMLInputElement>('input[name="consultation-type"][value="secondary"]');
  const onlineRadio = document.querySelector<HTMLInputElement>('input[name="payment-method"][value="online"]');

  const randomTicketNum = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `№MS-2026-${randomTicketNum}`;

  document.querySelector("#modal-ticket-id")!.textContent = `Талон ${ticketId}`;
  document.querySelector("#modal-patient-name")!.textContent = nameVal;
  document.querySelector("#modal-patient-phone")!.textContent = phoneVal;
  document.querySelector("#modal-doctor-name")!.textContent = `${selectedDoctor.name} (${selectedDoctor.specialty})`;
  document.querySelector("#modal-date")!.textContent = fullDateText;
  document.querySelector("#modal-time")!.textContent = selectedTimeInput?.value || "09:00";
  document.querySelector("#modal-type")!.textContent = secondaryRadio?.checked ? "Повторний прийом (-25%)" : "Первинний прийом";
  document.querySelector("#modal-payment")!.textContent = onlineRadio?.checked ? "Онлайн-картка" : "На рецепції";
  document.querySelector("#modal-total-price")!.textContent = `${calculatePrice()} грн`;

  document.querySelector("#ticket-modal")?.classList.add("active");
}

// Завантаження бази лікарів
async function loadData() {
  try {
    const res = await fetch(dataURL);
    doctorsList = (await res.json()) as IDoctor[];
    fillDoctorSelect("#doc-select", "Consultation");
  } catch (e) {
    console.error("Помилка завантаження doctors.json:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const docSelect = document.querySelector<HTMLSelectElement>("#doc-select");
  const consultationRadios = document.querySelectorAll<HTMLInputElement>('input[name="consultation-type"]');
  const submitButton = document.querySelector<HTMLButtonElement>(".submit-btn");

  document.querySelectorAll('input[name="booking-day"]').forEach((dayRadio) => {
    dayRadio.addEventListener("change", updateSlotsForSelectedDay);
  });

  if (docSelect) {
    docSelect.addEventListener("change", () => {
      calculatePrice();
      updateSlotsForSelectedDay();
    });
  }

  consultationRadios.forEach((radio) => {
    radio.addEventListener("change", calculatePrice);
  });

  if (submitButton) {
    submitButton.addEventListener("click", handleBookingSubmit);
  }
});