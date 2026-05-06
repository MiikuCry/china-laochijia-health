function buildListCard(titleText, items, formatter) {
  const card = document.createElement("section");
  card.className = "index-card";
  const title = document.createElement("h3");
  title.textContent = titleText;
  card.appendChild(title);

  const ul = document.createElement("ul");
  ul.className = "item-list";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = formatter(item);
    ul.appendChild(li);
  });
  card.appendChild(ul);
  return card;
}

function renderGroupBlocks(containerId, title, groupedMap, labelBuilder) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const keys = Array.from(groupedMap.keys()).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  keys.forEach((key) => {
    const list = groupedMap.get(key);
    const sorted = [...list].sort((a, b) => createCell(a["名称"]).localeCompare(createCell(b["名称"]), "zh-Hans-CN"));
    container.appendChild(
      buildListCard(`${title}：${key}（${sorted.length}）`, sorted, (item) => labelBuilder(item))
    );
  });
}

async function initCategoryPage() {
  const data = await loadNutritionData();
  const list = data.main;

  renderGroupBlocks("byCategory", "分类", groupBy(list, "分类"), (item) => {
    return `${createCell(item["名称"])} ｜ ${createCell(item["每100g能量(kcal)"])} kcal`;
  });

  renderGroupBlocks("byCuisine", "菜系", groupBy(list, "菜系"), (item) => {
    return `${createCell(item["名称"])} ｜ ${createCell(item["分类"])}`;
  });

  renderGroupBlocks("byMaterial", "主要原料", groupBy(list, "主要原料（参见食材表）"), (item) => {
    return `${createCell(item["名称"])} ｜ ${createCell(item["分类"])}`;
  });

  document.getElementById("categoryStats").textContent = `已按 分类 / 菜系 / 主要原料 三种方式完成索引，共 ${list.length} 条菜品。`;
}

initCategoryPage().catch((err) => {
  document.getElementById("categoryStats").textContent = err.message;
});
