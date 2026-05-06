function parseBenchmarkRows(rows) {
  const headerIndex = rows.findIndex((r) => Array.isArray(r) && r.includes("肉类/食材"));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex];
  return rows
    .slice(headerIndex + 1)
    .filter((r) => r[0])
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i];
      });
      return obj;
    });
}

function benchmarkRowMatches(row, keyword) {
  if (!keyword) return true;
  return Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(keyword));
}

function buildBenchmarkTitle(row) {
  return `${createCell(row["肉类/食材"])}${createCell(row["用油程度"])}${createCell(row["烹饪方式"])} 类菜品`;
}

function renderBenchmarkCards(rows) {
  const container = document.getElementById("benchmarkCards");
  container.innerHTML = "";
  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "record-card";
    card.innerHTML = `
      <div class="record-head">
        <h3>${buildBenchmarkTitle(row)}</h3>
        <div class="record-tags">
          ${makeTag(createCell(row["肉类/食材"]), "tag-purple")}
          ${makeTag(createCell(row["用油程度"]))}
          ${makeTag(createCell(row["烹饪方式"]), "tag-blue")}
        </div>
      </div>
      <div class="record-body">
        <p><b>示例菜品：</b>${createCell(row["标杆菜例"])}</p>
        <p><b>每100g热量：</b>${createCell(row["每100g kcal"])} kcal</p>
        <p><b>每份参考热量：</b>${createCell(row["每份 kcal"])} kcal</p>
        <p><b>健康提示：</b>${createCell(row["健康提示"])}</p>
      </div>
    `;
    card.classList.add("reveal", "in");
    container.appendChild(card);
  });
}

async function initBenchmarkPage() {
  renderSkeletonCards("benchmarkCards", 8);
  const data = await loadNutritionData();
  const rows = parseBenchmarkRows(data.references["菜肴标杆对照表"] || []);
  const keywordInput = document.getElementById("benchmarkKeyword");
  const ingredientInput = document.getElementById("benchmarkIngredient");
  const methodInput = document.getElementById("benchmarkMethod");
  const statsNode = document.getElementById("benchmarkStats");

  uniqueValues(rows, "肉类/食材").forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    ingredientInput.appendChild(option);
  });
  uniqueValues(rows, "烹饪方式").forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    methodInput.appendChild(option);
  });

  function refresh() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const ingredient = ingredientInput.value;
    const method = methodInput.value;
    const filtered = rows.filter((row) => {
      const byKeyword = benchmarkRowMatches(row, keyword);
      const byIngredient = !ingredient || createCell(row["肉类/食材"]) === ingredient;
      const byMethod = !method || createCell(row["烹饪方式"]) === method;
      return byKeyword && byIngredient && byMethod;
    });
    renderBenchmarkCards(filtered);
    statsNode.textContent = `当前匹配 ${filtered.length} 条（总计 ${rows.length} 条）`;
  }

  [keywordInput, ingredientInput, methodInput].forEach((el) => {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });
  refresh();
}

initBenchmarkPage().catch((err) => {
  document.getElementById("benchmarkStats").textContent = err.message;
});
