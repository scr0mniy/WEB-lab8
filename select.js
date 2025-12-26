
import { dishes } from "./dishes.js";

const LS = "fc_order";

const empty = () => ({
  soup_id: null,
  main_course_id: null,
  salad_id: null,
  drink_id: null,
  dessert_id: null
});

const read = () => {
  try { return { ...empty(), ...(JSON.parse(localStorage.getItem(LS)) || {}) }; }
  catch { return empty(); }
};

const write = (o) => localStorage.setItem(LS, JSON.stringify(o));

const byId = (id) => dishes.find(d => d.id === id) || null;

const selectedFromOrder = (o) => ({
  soup: byId(o.soup_id),
  main: byId(o.main_course_id),
  salad: byId(o.salad_id),
  drink: byId(o.drink_id),
  dessert: byId(o.dessert_id)
});

const total = (s) =>
  (s.soup?.price || 0) + (s.main?.price || 0) + (s.salad?.price || 0) + (s.drink?.price || 0) + (s.dessert?.price || 0);

const validCombo = (s) => {
  const soup = !!s.soup, main = !!s.main, salad = !!s.salad, drink = !!s.drink;
  if (!drink) return false;
  return (soup && main && salad) ||
         (soup && main && !salad) ||
         (soup && !main && salad) ||
         (!soup && main && salad) ||
         (!soup && main && !salad);
};

function highlight(s) {
  document.querySelectorAll(".Cell").forEach(c => c.classList.remove("selected"));
  const ids = new Set([s.soup?.id, s.main?.id, s.salad?.id, s.drink?.id, s.dessert?.id].filter(Boolean));
  document.querySelectorAll(".Cell").forEach(c => {
    if (ids.has(Number(c.dataset.id))) c.classList.add("selected");
  });
}

function updatePanel(s) {
  const panel = document.querySelector("#checkout-panel");
  if (!panel) return;

  const sum = total(s);
  const any = sum > 0;

  panel.style.display = any ? "block" : "none";
  if (!any) return;

  document.querySelector("#panel-total").textContent = String(sum);

  const ok = validCombo(s);
  const link = document.querySelector("#go-checkout");
  link.setAttribute("aria-disabled", ok ? "false" : "true");
  document.querySelector("#panel-hint").style.display = ok ? "none" : "block";
}

function setDishId(order, dish) {
  const map = {
    soup: "soup_id",
    main: "main_course_id",
    salad: "salad_id",
    drink: "drink_id",
    dessert: "dessert_id"
  };
  return { ...order, [map[dish.category]]: dish.id };
}

let order = read();
let selected = selectedFromOrder(order);


setTimeout(() => {
  highlight(selected);
  updatePanel(selected);
}, 0);

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;

  const cell = btn.closest(".Cell");
  const id = Number(cell.dataset.id);
  const dish = byId(id);
  if (!dish) return;

  order = setDishId(order, dish);
  write(order);

  selected = selectedFromOrder(order);
  highlight(selected);
  updatePanel(selected);
});
