
export let dishes = [];

const API = "https://edu.std-900.ist.mospolytech.ru/labs/api/dishes";
let loaded = false;

export async function loadDishes() {
  if (loaded) return dishes;

  const res = await fetch(API);
  const data = await res.json();

  dishes = data.map(d => ({
    id: d.id,
    name: d.name,
    price: d.price,
    image: d.image,
    keyword: d.keyword,
    count: d.count,
    category: (String(d.category || "").trim().toLowerCase() === "main-course")
      ? "main"
      : String(d.category || "").trim().toLowerCase(),
    kind: String(d.kind || "").trim().toLowerCase()
  }));

  loaded = true;
  return dishes;
}
