async function loadNutritionData() {
  if (window.NUTRITION_DATA) {
    return window.NUTRITION_DATA;
  }
  const isInPages = window.location.pathname.includes("/pages/");
  const dataPath = isInPages ? "../assets/data/nutrition-data.json" : "./assets/data/nutrition-data.json";
  const response = await fetch(dataPath);
  if (!response.ok) {
    throw new Error("数据文件加载失败，请确认 assets/data/nutrition-data.json 存在");
  }
  return response.json();
}

function createCell(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) {
      return null;
    }
    const num = Number(normalized);
    return Number.isNaN(num) ? null : num;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function uniqueValues(items, key) {
  const set = new Set();
  items.forEach((item) => {
    const value = item[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      set.add(String(value).trim());
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function groupBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const value = item[key];
    const k = value === null || value === undefined || value === "" ? "未标注" : String(value);
    if (!map.has(k)) {
      map.set(k, []);
    }
    map.get(k).push(item);
  });
  return map;
}

function getTagTone(text) {
  const value = String(text ?? "");
  if (value.includes("高") || value.includes("重油") || value.includes("肥")) {
    return "tag-red";
  }
  if (value.includes("中")) {
    return "tag-orange";
  }
  if (value.includes("低") || value.includes("轻")) {
    return "tag-green";
  }
  if (value.includes("菜系") || value.includes("川") || value.includes("粤") || value.includes("湘")) {
    return "tag-purple";
  }
  return "tag-blue";
}

function makeTag(text, toneClass = "") {
  const tone = toneClass || getTagTone(text);
  return `<span class="tag ${tone}">${createCell(text)}</span>`;
}

function renderSkeletonCards(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const card = document.createElement("article");
    card.className = "record-card skeleton-card";
    card.innerHTML = `
      <div class="skeleton-line w-50"></div>
      <div class="skeleton-line w-35"></div>
      <div class="skeleton-line w-80"></div>
      <div class="skeleton-line w-65"></div>
    `;
    container.appendChild(card);
  }
}
