function parseDailySections(rows) {
  const maleRows = [];
  const femaleRows = [];
  let gender = "";

  for (const row of rows) {
    const first = String(row[0] ?? "");
    if (first.includes("▸ 男性")) {
      gender = "male";
      continue;
    }
    if (first.includes("▸ 女性")) {
      gender = "female";
      continue;
    }
    if (first.startsWith("二、")) {
      gender = "";
    }
    if (gender && /^\d+kg$/.test(first)) {
      const weight = Number(first.replace("kg", ""));
      const bmi = row[1] ?? "—";
      const calories = row.slice(2, 7).map((v) => toNumber(String(v ?? "").replace("kcal", "")));
      const item = { weight, bmi, calories };
      if (gender === "male") {
        maleRows.push(item);
      } else {
        femaleRows.push(item);
      }
    }
  }
  return { maleRows, femaleRows };
}

function pickNearestWeightRow(list, weight) {
  return [...list].sort((a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight))[0];
}

function parseExerciseRecords(rows) {
  const header = rows[2] || [];
  const body = rows.slice(3);
  return body
    .filter((r) => r[0] && r[2] !== null && r[2] !== undefined)
    .map((row) => {
      const obj = {};
      header.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      obj["MET值"] = toNumber(obj["MET值"]);
      return obj;
    });
}

function calcBurn(met, weight, minutes) {
  return Math.round(met * weight * (minutes / 60));
}

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

function buildBenchmarkTitle(row) {
  return `${createCell(row["肉类/食材"])}${createCell(row["用油程度"])}${createCell(row["烹饪方式"])} 类菜品`;
}

function getBmiRangeLabel(bmi) {
  if (!Number.isFinite(bmi)) return "—";
  if (bmi < 18.5) return "偏瘦";
  if (bmi < 24) return "正常";
  if (bmi < 28) return "超重";
  return "肥胖";
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

async function initEnergyCalculatorPage() {
  const STORAGE_KEY = "energy_calculator_cache_v1";
  const MEAL_TYPES = [
    { id: "breakfast", label: "早餐" },
    { id: "lunch", label: "午餐" },
    { id: "dinner", label: "晚餐" },
    { id: "snack", label: "加餐" },
  ];
  const MEAL_LABEL_MAP = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐",
  };
  const data = await loadNutritionData();
  const rows = data.references["每日营养需求参考"] || [];
  const dailySections = parseDailySections(rows);
  const benchmarkRows = parseBenchmarkRows(data.references["菜肴标杆对照表"] || []);
  const exerciseRows = parseExerciseRecords(data.references["运动能量消耗参考"] || []);
  const activityMap = [0, 1, 2, 3, 4];

  const allFoods = [];
  (data.main || []).forEach((item, idx) => {
    const kcal100 = toNumber(item["每100g能量(kcal)"]);
    if (kcal100 === null) return;
    const refGrams = toNumber(item["常见每份(g)"]) ?? 100;
    allFoods.push({
      id: `main_${idx}`,
      source: "食物主表",
      name: createCell(item["名称"]),
      category: createCell(item["分类"]),
      kcalPer100: kcal100,
      refGrams,
      note: createCell(item["备注"]),
    });
  });
  benchmarkRows.forEach((item, idx) => {
    const per100 = toNumber(item["每100g kcal"]);
    const perServing = toNumber(item["每份 kcal"]);
    if (per100 === null && perServing === null) return;
    const refGrams = per100 && perServing ? Math.round((perServing / per100) * 100) : 100;
    const benchmarkTitle = buildBenchmarkTitle(item);
    const benchmarkExample = createCell(item["标杆菜例"]);
    allFoods.push({
      id: `benchmark_${idx}`,
      source: "菜肴标杆对照表",
      name: benchmarkTitle,
      category: "菜肴标杆对照",
      example: benchmarkExample,
      kcalPer100: per100 ?? Math.round(perServing),
      refGrams: refGrams || 100,
      note: createCell(item["健康提示"]),
    });
  });

  const exercises = exerciseRows
    .filter((item) => toNumber(item["MET值"]) !== null)
    .map((item, idx) => ({
      id: `exercise_${idx}`,
      name: createCell(item["运动/活动类型"]),
      category: createCell(item["分类"]),
      level: createCell(item["强度等级"]),
      met: toNumber(item["MET值"]) ?? 0,
    }));

  const state = {
    meals: [],
    exercises: [],
  };

  const genderInput = document.getElementById("calcGender");
  const heightInput = document.getElementById("calcHeight");
  const weightInput = document.getElementById("calcWeight");
  const activityInput = document.getElementById("calcActivityLevel");
  const foodSearchInput = document.getElementById("foodSearch");
  const foodCategoryInput = document.getElementById("foodCategory");
  const foodSelect = document.getElementById("foodSelect");
  const mealTypeInput = document.getElementById("mealType");
  const foodGramsInput = document.getElementById("foodGrams");
  const addFoodBtn = document.getElementById("addFoodBtn");
  const exerciseSearchInput = document.getElementById("exerciseSearch");
  const exerciseSelect = document.getElementById("exerciseSelect");
  const exerciseMinutesInput = document.getElementById("exerciseMinutes");
  const addExerciseBtn = document.getElementById("addExerciseBtn");
  const clearCacheBtn = document.getElementById("clearCacheBtn");

  const mealList = document.getElementById("mealEntryList");
  const exerciseList = document.getElementById("exerciseEntryList");
  const dailyError = document.getElementById("energyError");

  function saveCache() {
    const payload = {
      profile: {
        gender: genderInput.value,
        height: heightInput.value,
        weight: weightInput.value,
        activity: activityInput.value,
        foodSearch: foodSearchInput.value,
        foodCategory: foodCategoryInput.value,
        exerciseSearch: exerciseSearchInput.value,
      },
      meals: state.meals,
      exercises: state.exercises,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.profile) {
        genderInput.value = parsed.profile.gender || "male";
        heightInput.value = parsed.profile.height || "170";
        weightInput.value = parsed.profile.weight || "60";
        activityInput.value = parsed.profile.activity || "1";
        foodSearchInput.value = parsed.profile.foodSearch || "";
        foodCategoryInput.value = parsed.profile.foodCategory || "";
        exerciseSearchInput.value = parsed.profile.exerciseSearch || "";
      }
      state.meals = Array.isArray(parsed.meals)
        ? parsed.meals.map((item) => ({
            ...item,
            mealType: MEAL_LABEL_MAP[item.mealType] ? item.mealType : "lunch",
          }))
        : [];
      state.exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
    } catch {
      // ignore invalid cache
    }
  }

  function buildFoodCategoryOptions() {
    const categories = Array.from(
      new Set(
        allFoods
          .map((item) => item.category)
          .filter((v) => v && v !== "—" && v !== "菜肴标杆对照")
      )
    ).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
    categories.forEach((v) => {
      const option = document.createElement("option");
      option.value = v;
      option.textContent = v;
      foodCategoryInput.appendChild(option);
    });
    const benchmarkOption = document.createElement("option");
    benchmarkOption.value = "菜肴标杆对照";
    benchmarkOption.textContent = "菜肴标杆对照";
    foodCategoryInput.appendChild(benchmarkOption);
  }

  function getFilteredFoods() {
    const keyword = foodSearchInput.value.trim().toLowerCase();
    const category = foodCategoryInput.value;
    return allFoods.filter((item) => {
      const byKeyword =
        !keyword ||
        String(item.name ?? "").toLowerCase().includes(keyword) ||
        String(item.example ?? "").toLowerCase().includes(keyword);
      const byCategory = !category || item.category === category;
      return byKeyword && byCategory;
    });
  }

  function buildFoodOptions() {
    const current = foodSelect.value;
    foodSelect.innerHTML = "";
    const filtered = getFilteredFoods();
    if (!filtered.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "未找到匹配菜品，请调整搜索或分类";
      foodSelect.appendChild(option);
      addFoodBtn.disabled = true;
      return;
    }
    addFoodBtn.disabled = false;
    filtered.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      if (item.source === "菜肴标杆对照表") {
        option.textContent = `${item.name}（例：${createCell(item.example)}），${item.kcalPer100} kcal/100g`;
      } else {
        option.textContent = `${item.name}（${item.source}，${item.kcalPer100} kcal/100g）`;
      }
      foodSelect.appendChild(option);
    });
    if (filtered.some((item) => item.id === current)) {
      foodSelect.value = current;
    }
  }

  function getFilteredExercises() {
    const keyword = exerciseSearchInput.value.trim().toLowerCase();
    return exercises.filter((item) =>
      !keyword ? true : String(item.name ?? "").toLowerCase().includes(keyword)
    );
  }

  function buildExerciseOptions() {
    const current = exerciseSelect.value;
    exerciseSelect.innerHTML = "";
    const filtered = getFilteredExercises();
    if (!filtered.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "未找到匹配运动，请调整关键词";
      exerciseSelect.appendChild(option);
      addExerciseBtn.disabled = true;
      return;
    }
    addExerciseBtn.disabled = false;
    filtered.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.name}（${item.category}/${item.level}，MET ${item.met}）`;
      exerciseSelect.appendChild(option);
    });
    if (filtered.some((item) => item.id === current)) {
      exerciseSelect.value = current;
    }
  }

  function renderMeals() {
    mealList.innerHTML = "";
    const mealTypeTotals = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    if (!state.meals.length) {
      mealList.innerHTML = `<p class="calc-entry-empty">还没有添加餐食，先从主表或菜肴标杆里选一个吧。</p>`;
      document.getElementById("mealTotal").textContent = "0 kcal";
      document.getElementById("mealBreakfastTotal").textContent = "0 kcal";
      document.getElementById("mealLunchTotal").textContent = "0 kcal";
      document.getElementById("mealDinnerTotal").textContent = "0 kcal";
      document.getElementById("mealSnackTotal").textContent = "0 kcal";
      return 0;
    }
    let total = 0;
    MEAL_TYPES.forEach((mealType) => {
      const rows = state.meals.filter((item) => item.mealType === mealType.id);
      const group = document.createElement("section");
      group.className = "record-card calc-entry-card";
      const groupTotal = rows.reduce((sum, item) => sum + item.kcal, 0);
      mealTypeTotals[mealType.id] = groupTotal;
      group.innerHTML = `
        <div class="calc-entry-top">
          <h3>${mealType.label}</h3>
          <div class="record-tags">${makeTag(`${Math.round(groupTotal)} kcal`, "tag-blue")}</div>
        </div>
      `;
      if (!rows.length) {
        const empty = document.createElement("p");
        empty.className = "calc-entry-empty";
        empty.textContent = `还没有添加${mealType.label}内容。`;
        group.appendChild(empty);
      } else {
        rows.forEach((entry) => {
          total += entry.kcal;
          const card = document.createElement("article");
          card.className = "record-card calc-entry-card";
          card.innerHTML = `
            <div class="calc-entry-top">
              <h3>${createCell(entry.name)}</h3>
              <button type="button" data-action="removeMeal" data-id="${entry.id}">删除</button>
            </div>
            <div class="record-tags">
              ${makeTag(entry.source, "tag-purple")}
              ${makeTag(`${entry.grams} g`, "tag-blue")}
              ${makeTag(`${entry.kcal} kcal`, "tag-orange")}
            </div>
          `;
          group.appendChild(card);
        });
      }
      mealList.appendChild(group);
    });
    document.getElementById("mealBreakfastTotal").textContent = `${Math.round(mealTypeTotals.breakfast)} kcal`;
    document.getElementById("mealLunchTotal").textContent = `${Math.round(mealTypeTotals.lunch)} kcal`;
    document.getElementById("mealDinnerTotal").textContent = `${Math.round(mealTypeTotals.dinner)} kcal`;
    document.getElementById("mealSnackTotal").textContent = `${Math.round(mealTypeTotals.snack)} kcal`;
    document.getElementById("mealTotal").textContent = `${Math.round(total)} kcal`;
    return total;
  }

  function renderExercises(weight) {
    exerciseList.innerHTML = "";
    if (!state.exercises.length) {
      exerciseList.innerHTML = `<p class="calc-entry-empty">还没有添加运动记录，可以从“运动能量消耗”库里选。</p>`;
      document.getElementById("exerciseTotal").textContent = "0 kcal";
      return 0;
    }
    let total = 0;
    state.exercises.forEach((entry) => {
      const item = exercises.find((e) => e.id === entry.exerciseId);
      if (!item) return;
      const burn = calcBurn(item.met, weight, entry.minutes);
      total += burn;
      const card = document.createElement("article");
      card.className = "record-card calc-entry-card";
      card.innerHTML = `
        <div class="calc-entry-top">
          <h3>${item.name}</h3>
          <button type="button" data-action="removeExercise" data-id="${entry.id}">删除</button>
        </div>
        <div class="record-tags">
          ${makeTag(item.category, "tag-blue")}
          ${makeTag(`${entry.minutes} 分钟`, "tag-purple")}
          ${makeTag(`${burn} kcal`, "tag-orange")}
        </div>
      `;
      exerciseList.appendChild(card);
    });
    document.getElementById("exerciseTotal").textContent = `${Math.round(total)} kcal`;
    return total;
  }

  function refreshSummary() {
    const gender = genderInput.value;
    const height = Number(heightInput.value || 170);
    const weight = Number(weightInput.value || 60);
    const activityIdx = activityMap[Number(activityInput.value)];
    const list = gender === "male" ? dailySections.maleRows : dailySections.femaleRows;
    const matched = pickNearestWeightRow(list, weight);
    const baseBurn = toNumber(matched?.calories?.[activityIdx]) ?? 0;
    const bmi = height > 0 ? weight / ((height / 100) * (height / 100)) : Number.NaN;
    const bmiText = Number.isFinite(bmi) ? bmi.toFixed(1) : "—";
    const bmiLabel = getBmiRangeLabel(bmi);

    document.getElementById("calcBmi").textContent = bmiText;
    document.getElementById("calcBmiLabel").textContent = bmiLabel;
    document.getElementById("calcBaseBurn").textContent = `${Math.round(baseBurn)} kcal`;
    document.getElementById("calcWeightMatch").textContent = matched ? `${matched.weight}kg档位` : "—";

    const intake = renderMeals();
    const exerciseBurn = renderExercises(weight);
    const totalOut = baseBurn + exerciseBurn;
    const net = intake - totalOut;

    document.getElementById("calcExerciseBurn").textContent = `${Math.round(exerciseBurn)} kcal`;
    document.getElementById("calcIntake").textContent = `${Math.round(intake)} kcal`;
    document.getElementById("calcTotalOut").textContent = `${Math.round(totalOut)} kcal`;
    document.getElementById("calcNet").textContent =
      `${Math.round(net)} kcal（${net > 0 ? "盈余" : net < 0 ? "缺口" : "持平"}）`;
    saveCache();
  }

  addFoodBtn.addEventListener("click", () => {
    if (!foodSelect.value) return;
    const food = allFoods.find((item) => item.id === foodSelect.value);
    if (!food) return;
    const grams = Number(foodGramsInput.value || food.refGrams || 100);
    const kcal = Math.round((food.kcalPer100 * grams) / 100);
    state.meals.push({
      id: createId("meal"),
      foodId: food.id,
      name: food.name,
      source: food.source,
      mealType: mealTypeInput.value,
      grams,
      kcal,
    });
    refreshSummary();
  });

  addExerciseBtn.addEventListener("click", () => {
    if (!exerciseSelect.value) return;
    const item = exercises.find((e) => e.id === exerciseSelect.value);
    if (!item) return;
    const minutes = Number(exerciseMinutesInput.value || 30);
    state.exercises.push({
      id: createId("ex"),
      exerciseId: item.id,
      minutes,
    });
    refreshSummary();
  });

  mealList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='removeMeal']");
    if (!button) return;
    const id = button.getAttribute("data-id");
    state.meals = state.meals.filter((item) => item.id !== id);
    refreshSummary();
  });

  exerciseList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='removeExercise']");
    if (!button) return;
    const id = button.getAttribute("data-id");
    state.exercises = state.exercises.filter((item) => item.id !== id);
    refreshSummary();
  });

  foodSelect.addEventListener("change", () => {
    const food = allFoods.find((item) => item.id === foodSelect.value);
    if (food) {
      foodGramsInput.value = food.refGrams;
    }
  });
  foodSearchInput.addEventListener("input", () => {
    buildFoodOptions();
    const food = allFoods.find((item) => item.id === foodSelect.value);
    if (food) {
      foodGramsInput.value = food.refGrams;
    }
    saveCache();
  });
  foodCategoryInput.addEventListener("change", () => {
    buildFoodOptions();
    const food = allFoods.find((item) => item.id === foodSelect.value);
    if (food) {
      foodGramsInput.value = food.refGrams;
    }
    saveCache();
  });
  exerciseSearchInput.addEventListener("input", () => {
    buildExerciseOptions();
    saveCache();
  });

  [genderInput, heightInput, weightInput, activityInput].forEach((el) => {
    el.addEventListener("input", refreshSummary);
    el.addEventListener("change", refreshSummary);
  });

  clearCacheBtn.addEventListener("click", () => {
    state.meals = [];
    state.exercises = [];
    genderInput.value = "male";
    heightInput.value = "170";
    weightInput.value = "60";
    activityInput.value = "1";
    foodSearchInput.value = "";
    foodCategoryInput.value = "";
    exerciseSearchInput.value = "";
    mealTypeInput.value = "lunch";
    buildFoodOptions();
    buildExerciseOptions();
    foodGramsInput.value = String(allFoods[0]?.refGrams ?? 100);
    exerciseMinutesInput.value = "30";
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
    refreshSummary();
  });

  buildFoodCategoryOptions();
  loadCache();
  buildFoodOptions();
  buildExerciseOptions();
  if (!foodGramsInput.value) {
    foodGramsInput.value = String(allFoods[0]?.refGrams ?? 100);
  }
  refreshSummary();
  dailyError.textContent = "";
}

initEnergyCalculatorPage().catch((err) => {
  const node = document.getElementById("energyError");
  if (node) {
    node.textContent = err.message;
  }
});
