
import { dishes, loadDishes } from "./dishes.js";

const blocks = {
  soup:    document.querySelector("#soups"),
  main:    document.querySelector("#mains"),
  salad:   document.querySelector("#salads"),
  drink:   document.querySelector("#drinks"),
  dessert: document.querySelector("#desserts")
};

const card = (d) => {
  const el = document.createElement("div");
  el.className = "Cell";
  el.dataset.id = d.id;
  el.dataset.cat = d.category;
  el.dataset.kind = d.kind;
  el.innerHTML = `
    <img class="img" src="${d.image}">
    <p>${d.price}р</p>
    <p>${d.name}</p>
    <p class="mil">${d.count}</p>
    <button type="button" class="add-btn">Добавить</button>
  `;
  return el;
};

function render(cat, kind = "") {
  const box = blocks[cat];
  if (!box) return;
  box.innerHTML = "";

  dishes
    .filter(d => d.category === cat && (!kind || d.kind === kind))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(d => box.appendChild(card(d)));
}

async function init() {
  await loadDishes();
  Object.keys(blocks).forEach(c => render(c));
}
init();

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".filters button");
  if (!btn) return;

  const wrap = btn.closest(".filters");
  const cat = wrap.dataset.category;
  const kind = btn.dataset.kind;

  const active = btn.classList.contains("active");
  wrap.querySelectorAll("button").forEach(b => b.classList.remove("active"));

  if (active) render(cat);
  else { btn.classList.add("active"); render(cat, kind); }
});
