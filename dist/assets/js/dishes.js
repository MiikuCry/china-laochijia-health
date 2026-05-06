function getInitial(name) {
  if (!name) {
    return "#";
  }
  const first = String(name).trim().charAt(0);
  if (!first) {
    return "#";
  }
  return first;
}

function renderDishIndex(items) {
  const container = document.getElementById("dishIndex");
  const groups = new Map();

  items.forEach((item) => {
    const name = createCell(item["名称"]);
    const initial = getInitial(name);
    if (!groups.has(initial)) {
      groups.set(initial, []);
    }
    groups.get(initial).push(item);
  });

  const keys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  container.innerHTML = "";

  keys.forEach((key) => {
    const card = document.createElement("section");
    card.className = "index-card";

    const title = document.createElement("h3");
    title.textContent = `${key} (${groups.get(key).length})`;
    card.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "item-list";

    groups
      .get(key)
      .sort((a, b) => createCell(a["名称"]).localeCompare(createCell(b["名称"]), "zh-Hans-CN"))
      .forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${createCell(item["名称"])} ｜ ${createCell(item["分类"])} ｜ ${createCell(item["每100g能量(kcal)"])} kcal/100g`;
        ul.appendChild(li);
      });

    card.appendChild(ul);
    container.appendChild(card);
  });
}

async function initDishPage() {
  const data = await loadNutritionData();
  const keywordInput = document.getElementById("dishKeyword");
  const all = data.main;

  function refresh() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const filtered = all.filter((item) => {
      const name = createCell(item["名称"]).toLowerCase();
      return !keyword || name.includes(keyword);
    });
    document.getElementById("dishStats").textContent = `匹配 ${filtered.length} / ${all.length} 条`;
    renderDishIndex(filtered);
  }

  keywordInput.addEventListener("input", refresh);
  refresh();
}

initDishPage().catch((err) => {
  document.getElementById("dishStats").textContent = err.message;
});
