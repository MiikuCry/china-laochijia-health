const state = {
  all: [],
  filtered: [],
  page: 1,
  pageSize: 30,
};

function applyFilters() {
  const keyword = document.getElementById("keyword").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const cuisine = document.getElementById("cuisineFilter").value;
  const minKcal = toNumber(document.getElementById("minKcal").value);
  const maxKcal = toNumber(document.getElementById("maxKcal").value);

  state.filtered = state.all.filter((item) => {
    const name = createCell(item["名称"]).toLowerCase();
    const rawMaterial = createCell(item["主要原料（参见食材表）"]).toLowerCase();
    const categoryMatch = !category || createCell(item["分类"]) === category;
    const cuisineMatch = !cuisine || createCell(item["菜系"]) === cuisine;
    const keywordMatch = !keyword || name.includes(keyword) || rawMaterial.includes(keyword);
    const kcal = toNumber(item["每100g能量(kcal)"]);
    const minMatch = minKcal === null || (kcal !== null && kcal >= minKcal);
    const maxMatch = maxKcal === null || (kcal !== null && kcal <= maxKcal);
    return categoryMatch && cuisineMatch && keywordMatch && minMatch && maxMatch;
  });

  state.page = 1;
  renderTable();
}

function renderTable() {
  const container = document.getElementById("mainCards");
  container.innerHTML = "";

  const total = state.filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, pageCount);
  const start = (state.page - 1) * state.pageSize;
  const end = start + state.pageSize;
  const rows = state.filtered.slice(start, end);

  rows.forEach((item) => {
    const card = document.createElement("article");
    card.className = "record-card";
    card.innerHTML = `
      <div class="record-head">
        <h3>${createCell(item["名称"])}</h3>
        <div class="record-tags">
          ${makeTag(item["分类"], "tag-green")}
          ${makeTag(item["菜系"], "tag-purple")}
          ${makeTag(`${createCell(item["每100g能量(kcal)"])} kcal/100g`, "tag-blue")}
          ${makeTag(`${createCell(item["每份能量(kcal)"])} kcal/份`, "tag-orange")}
        </div>
      </div>
      <div class="record-meta">
        <div><b>每份重量</b><span>${createCell(item["常见每份(g)"])} g</span></div>
        <div><b>主要原料</b><span>${createCell(item["主要原料（参见食材表）"])}</span></div>
      </div>
      <div class="record-body">
        <p><b>核心营养：</b>${createCell(item["核心营养成分"])}</p>
        <p><b>其他营养：</b>${createCell(item["其他营养成分"])}</p>
        <p><b>备注：</b>${createCell(item["备注"])}</p>
      </div>
    `;
    card.classList.add("reveal", "in");
    container.appendChild(card);
  });

  document.getElementById("stats").textContent = `共 ${total} 条，当前第 ${state.page}/${pageCount} 页`;
  document.getElementById("prevPage").disabled = state.page <= 1;
  document.getElementById("nextPage").disabled = state.page >= pageCount;
}

function setupFilters(data) {
  const categoryFilter = document.getElementById("categoryFilter");
  const cuisineFilter = document.getElementById("cuisineFilter");
  uniqueValues(data, "分类").forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    categoryFilter.appendChild(option);
  });
  uniqueValues(data, "菜系").forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    cuisineFilter.appendChild(option);
  });

  ["keyword", "categoryFilter", "cuisineFilter", "minKcal", "maxKcal"].forEach((id) => {
    document.getElementById(id).addEventListener("input", applyFilters);
    document.getElementById(id).addEventListener("change", applyFilters);
  });
}

function setupPagination() {
  document.getElementById("prevPage").addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      renderTable();
    }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page < maxPage) {
      state.page += 1;
      renderTable();
    }
  });
}

async function initMainPage() {
  renderSkeletonCards("mainCards", 8);
  const data = await loadNutritionData();
  state.all = data.main;
  state.filtered = [...state.all];
  // Reset potentially restored mobile autofill values, so first screen always shows defaults.
  document.getElementById("keyword").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("cuisineFilter").value = "";
  document.getElementById("minKcal").value = "";
  document.getElementById("maxKcal").value = "";
  setupFilters(data.main);
  setupPagination();
  renderTable();
}

initMainPage().catch((err) => {
  document.getElementById("stats").textContent = err.message;
});
