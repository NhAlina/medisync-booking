import "./scss/main.scss";

// Динамічний розрахунок вартості прийому
function updatePrice() {
  const docSelect = document.getElementById("doc-select") as HTMLSelectElement | null;
  const secondaryRadio = document.querySelector('input[name="consultation-type"][value="secondary"]') as HTMLInputElement | null;
  const priceDisplay = document.getElementById("total-price");

  if (!docSelect || !priceDisplay) return;

  const basePrice = parseInt(docSelect.value, 10) || 600;
  const isSecondary = secondaryRadio ? secondaryRadio.checked : false;

  // Знижка 25% на повторну консультацію
  const finalPrice = isSecondary ? Math.round(basePrice * 0.75) : basePrice;

  priceDisplay.textContent = `${finalPrice} грн`;
}

// Підключення подій після завантаження сторінки
document.addEventListener("DOMContentLoaded", () => {
  const docSelect = document.getElementById("doc-select");
  const typeRadios = document.querySelectorAll('input[name="consultation-type"]');

  if (docSelect) {
    docSelect.addEventListener("change", updatePrice);
  }

  typeRadios.forEach((radio) => {
    radio.addEventListener("change", updatePrice);
  });
});
