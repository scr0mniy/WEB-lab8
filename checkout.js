
import { dishes, loadDishes } from "./dishes.js";

const API_KEY = "107be99b-aad2-4eee-826e-0d53e1dc8ae7";
const ORDERS = "https://edu.std-900.ist.mospolytech.ru/labs/api/orders";
const LS = "fc_order";

const empty = () => ({
  soup_id: null, main_course_id: null, salad_id: null, drink_id: null, dessert_id: null
});

const read = () => {
  try { return { ...empty(), ...(JSON.parse(localStorage.getItem(LS)) || {}) }; }
  catch { return empty(); }
};

const write = (o) => localStorage.setItem(LS, JSON.stringify(o));
const clear = () => localStorage.removeItem(LS);

const byId = (id) => dishes.find(d => d.id === id) || null;

const sum = (o) =>
  (byId(o.soup_id)?.price || 0) +
  (byId(o.main_course_id)?.price || 0) +
  (byId(o.salad_id)?.price || 0) +
  (byId(o.drink_id)?.price || 0) +
  (byId(o.dessert_id)?.price || 0);

const validCombo = (o) => {
  const soup=!!o.soup_id, main=!!o.main_course_id, salad=!!o.salad_id, drink=!!o.drink_id;
  if (!drink) return false;
  return (soup && main && salad) || (soup && main && !salad) || (soup && !main && salad) ||
         (!soup && main && salad) || (!soup && main && !salad);
};

const line = (id, dish, emptyText) =>
  document.querySelector(id).textContent = dish ? `${dish.name} ${dish.price}₽` : emptyText;

function renderLeft(o) {
  line("#order-soup", byId(o.soup_id), "Не выбран");
  line("#order-main", byId(o.main_course_id), "Не выбрано");
  line("#order-salad", byId(o.salad_id), "Не выбран");
  line("#order-drink", byId(o.drink_id), "Не выбран");
  line("#order-dessert", byId(o.dessert_id), "Не выбран");
  document.querySelector("#order-total").textContent = String(sum(o));
}

function renderCards(o) {
  const wrap = document.querySelector("#checkout-cards");
  const emptyText = document.querySelector("#empty-text");
  wrap.innerHTML = "";

  const ids = [o.soup_id, o.main_course_id, o.salad_id, o.drink_id, o.dessert_id].filter(Boolean);

  emptyText.style.display = ids.length ? "none" : "block";
  ids.map(byId).filter(Boolean).forEach(d => {
    const el = document.createElement("div");
    el.className = "Cell";
    el.dataset.id = d.id;
    el.innerHTML = `
      <img class="img" src="${d.image}">
      <p>${d.price}р</p>
      <p>${d.name}</p>
      <p class="mil">${d.count}</p>
      <button type="button" class="del-btn">Удалить</button>
    `;
    wrap.appendChild(el);
  });
}

function validateTime(fd) {
  const type = fd.get("delivery_type");
  const t = (fd.get("delivery_time") || "").trim();
  if (type !== "by_time") return null;
  if (!t) return "Укажите время доставки";

  const [hh, mm] = t.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return "Некорректное время";
  if (hh < 7 || (hh === 23 && mm > 0) || hh > 23) return "Время доставки: 7:00—23:00";
  if (mm % 5 !== 0) return "Шаг времени — 5 минут";

  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const tMin = hh*60 + mm;
  if (tMin < nowMin) return "Время не должно быть раньше текущего";

  return null;
}

async function send(o, fd) {
  if (!validCombo(o)) throw new Error("Состав ланча не соответствует доступным комбо");

  const timeErr = validateTime(fd);
  if (timeErr) throw new Error(timeErr);

  const body = {
    full_name: fd.get("full_name"),
    email: fd.get("email"),
    subscribe: fd.get("subscribe") ? 1 : 0,
    phone: fd.get("phone"),
    delivery_address: fd.get("delivery_address"),
    delivery_type: fd.get("delivery_type"),
    delivery_time: fd.get("delivery_type") === "by_time" ? fd.get("delivery_time") : null,
    comment: fd.get("comment") || null,
    soup_id: o.soup_id,
    main_course_id: o.main_course_id,
    salad_id: o.salad_id,
    drink_id: o.drink_id,
    dessert_id: o.dessert_id
  };

  const res = await fetch(`${ORDERS}?api_key=${encodeURIComponent(API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ошибка при оформлении заказа");
  return data;
}

async function init() {
  await loadDishes();

  let o = read();
  renderCards(o);
  renderLeft(o);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".del-btn");
    if (!btn) return;

    const id = Number(btn.closest(".Cell").dataset.id);
    o = read();
    for (const k in o) if (o[k] === id) o[k] = null;
    write(o);

    renderCards(o);
    renderLeft(o);
  });

  const form = document.querySelector("#checkout-form");

  form.addEventListener("change", () => {
    if (form.querySelector('input[name="delivery_type"]:checked')?.value === "now") {
      form.querySelector("#delivery_time").value = "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const current = read();
      const fd = new FormData(form);
      await send(current, fd);
      clear();
      alert("Заказ успешно оформлен!");
      renderCards(empty());
      renderLeft(empty());
      form.reset();
    } catch (err) {
      alert(err.message || "Не удалось оформить заказ");
    }
  });
}

init();
