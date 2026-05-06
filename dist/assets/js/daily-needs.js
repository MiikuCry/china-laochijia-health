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
      const values = row.slice(2, 7).map((v) => Number(String(v ?? "").replace("kcal", "")));
      const item = { weight, bmi, calories: values };
      if (gender === "male") {
        maleRows.push(item);
      } else {
        femaleRows.push(item);
      }
    }
  }

  const activityStart = rows.findIndex((r) => String(r[0] ?? "") === "活动水平");
  const macroStart = rows.findIndex((r) => String(r[0] ?? "") === "营养素" && String(r[1] ?? "").includes("推荐供能比"));
  const microStart = rows.findIndex((r) => String(r[0] ?? "") === "营养素" && String(r[1] ?? "").includes("男性推荐量"));

  const activityRows = [];
  for (let i = activityStart + 1; i < rows.length; i += 1) {
    const first = String(rows[i][0] ?? "");
    if (first.startsWith("三、")) {
      break;
    }
    if (first) {
      activityRows.push(rows[i]);
    }
  }

  const macroRows = [];
  for (let i = macroStart + 1; i < rows.length; i += 1) {
    const first = String(rows[i][0] ?? "");
    if (first.startsWith("四、")) {
      break;
    }
    if (first) {
      macroRows.push(rows[i]);
    }
  }

  const microRows = [];
  for (let i = microStart + 1; i < rows.length; i += 1) {
    if (String(rows[i][0] ?? "").trim()) {
      microRows.push(rows[i]);
    }
  }

  return { maleRows, femaleRows, activityRows, macroRows, microRows };
}

function pickNearestWeightRow(list, weight) {
  return [...list].sort((a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight))[0];
}

function renderActivityCards(rows, caloriesByActivity = [], activeIdx = 1) {
  const container = document.getElementById("activityCards");
  container.innerHTML = "";
  rows.forEach((row, idx) => {
    const estimated = toNumber(caloriesByActivity[idx]);
    const activeTag = idx === activeIdx ? makeTag("当前选择", "tag-green") : "";
    const card = document.createElement("article");
    card.className = "record-card";
    card.innerHTML = `
      <div class="record-head">
        <h3>${createCell(row[0])}</h3>
        <div class="record-tags">
          ${makeTag(createCell(row[1]), "tag-blue")}
          ${activeTag}
        </div>
      </div>
      <div class="record-body">
        <p><b>估算能量消耗：</b>${estimated === null ? "—" : `${estimated} kcal/日`}</p>
        <p><b>典型人群：</b>${createCell(row[2])}</p>
        <p><b>每日步数：</b>${createCell(row[3])}</p>
        <p><b>额外说明：</b>${createCell(row[4])}</p>
      </div>
    `;
    card.classList.add("reveal", "in");
    container.appendChild(card);
  });
}

function renderMacroCards(rows) {
  const container = document.getElementById("macroCards");
  container.innerHTML = "";
  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "record-card";
    card.innerHTML = `
      <div class="record-head">
        <h3>${createCell(row[0])}</h3>
        <div class="record-tags">
          ${makeTag(createCell(row[1]), "tag-purple")}
          ${makeTag(createCell(row[2]), "tag-blue")}
        </div>
      </div>
      <div class="record-meta">
        <div><b>每克供能</b><span>${createCell(row[3])}</span></div>
        <div><b>推荐来源</b><span>${createCell(row[4])}</span></div>
      </div>
      <div class="record-body">
        <p><b>减脂期：</b>${createCell(row[5])}</p>
        <p><b>增肌期：</b>${createCell(row[6])}</p>
        <p><b>备注：</b>${createCell(row[7])}</p>
      </div>
    `;
    card.classList.add("reveal", "in");
    container.appendChild(card);
  });
}

function renderMicroCards(rows, keyword) {
  const container = document.getElementById("microCards");
  container.innerHTML = "";
  rows
    .filter((row) => {
      if (!keyword) {
        return true;
      }
      return row.some((cell) => String(cell ?? "").toLowerCase().includes(keyword));
    })
    .forEach((row) => {
      const card = document.createElement("article");
      card.className = "record-card";
      card.innerHTML = `
        <div class="record-head">
          <h3>${createCell(row[0])}</h3>
          <div class="record-tags">
            ${makeTag(`男：${createCell(row[1])}`, "tag-blue")}
            ${makeTag(`女：${createCell(row[2])}`, "tag-purple")}
          </div>
        </div>
        <div class="record-meta">
          <div><b>最高可耐受量</b><span>${createCell(row[3])}</span></div>
          <div><b>主要来源</b><span>${createCell(row[4])}</span></div>
        </div>
        <div class="record-body">
          <p><b>缺乏表现：</b>${createCell(row[5])}</p>
          <p><b>补充提示：</b>${createCell(row[6])}</p>
        </div>
      `;
      card.classList.add("reveal", "in");
      container.appendChild(card);
    });
}

function calcMacroByTarget(targetKcal) {
  const carb = { low: Math.round((targetKcal * 0.5) / 4), high: Math.round((targetKcal * 0.65) / 4) };
  const protein = { low: Math.round((targetKcal * 0.1) / 4), high: Math.round((targetKcal * 0.2) / 4) };
  const fat = { low: Math.round((targetKcal * 0.2) / 9), high: Math.round((targetKcal * 0.3) / 9) };
  return { carb, protein, fat };
}

function getBmiRangeLabel(bmi) {
  if (!Number.isFinite(bmi)) {
    return "—";
  }
  if (bmi < 18.5) {
    return "偏瘦";
  }
  if (bmi < 24) {
    return "正常";
  }
  if (bmi < 28) {
    return "超重";
  }
  return "肥胖";
}

async function initDailyNeedsPage() {
  renderSkeletonCards("activityCards", 4);
  renderSkeletonCards("macroCards", 4);
  renderSkeletonCards("microCards", 6);
  const data = await loadNutritionData();
  const rows = data.references["每日营养需求参考"] || [];
  const sections = parseDailySections(rows);

  const genderInput = document.getElementById("gender");
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const activityInput = document.getElementById("activityLevel");
  const targetInput = document.getElementById("targetMode");
  const microKeywordInput = document.getElementById("microKeyword");

  const activityMap = [0, 1, 2, 3, 4];
  function refreshResult() {
    const gender = genderInput.value;
    const weight = Number(weightInput.value || 60);
    const heightCm = Number(heightInput.value || 170);
    const activityIdx = activityMap[Number(activityInput.value)];
    const targetMode = targetInput.value;
    const baseList = gender === "male" ? sections.maleRows : sections.femaleRows;
    const picked = pickNearestWeightRow(baseList, weight);
    const baseline = toNumber(picked.calories[activityIdx]) ?? 0;
    const adjust = targetMode === "cut" ? 0.9 : targetMode === "bulk" ? 1.1 : 1;
    const targetKcal = Math.round(baseline * adjust);
    const macro = calcMacroByTarget(targetKcal);
    const bmiValue =
      heightCm > 0 ? weight / ((heightCm / 100) * (heightCm / 100)) : Number.NaN;
    const bmi = Number.isFinite(bmiValue) ? bmiValue.toFixed(1) : "—";
    const bmiLabel = getBmiRangeLabel(bmiValue);

    document.getElementById("kpiWeight").textContent = `${picked.weight} kg（匹配）`;
    document.getElementById("kpiBmi").textContent = `${bmi}（${bmiLabel}，档位参考：${createCell(picked.bmi)}）`;
    document.getElementById("kpiBase").textContent = `${baseline} kcal`;
    document.getElementById("kpiTarget").textContent = `${targetKcal} kcal`;
    document.getElementById("macroHint").textContent =
      `建议范围：碳水 ${macro.carb.low}-${macro.carb.high}g，蛋白 ${macro.protein.low}-${macro.protein.high}g，脂肪 ${macro.fat.low}-${macro.fat.high}g。`;
    renderActivityCards(sections.activityRows, picked.calories, activityIdx);
  }

  renderActivityCards(sections.activityRows);
  renderMacroCards(sections.macroRows);

  function refreshMicros() {
    renderMicroCards(sections.microRows, microKeywordInput.value.trim().toLowerCase());
  }

  [genderInput, weightInput, heightInput, activityInput, targetInput].forEach((el) => {
    el.addEventListener("input", refreshResult);
    el.addEventListener("change", refreshResult);
  });
  microKeywordInput.addEventListener("input", refreshMicros);

  refreshResult();
  refreshMicros();
}

initDailyNeedsPage().catch((err) => {
  document.getElementById("dailyError").textContent = err.message;
});
