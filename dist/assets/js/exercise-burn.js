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
      obj["MET值"] = Number(obj["MET值"]);
      return obj;
    });
}

function calcBurn(met, weight, minutes) {
  return Math.round(met * weight * (minutes / 60));
}

function renderExerciseTable(records) {
  const container = document.getElementById("exerciseCards");
  container.innerHTML = "";
  records.forEach((item) => {
    const card = document.createElement("article");
    card.className = "record-card";
    card.innerHTML = `
      <div class="record-head">
        <h3>${createCell(item["运动/活动类型"])}</h3>
        <div class="record-tags">
          ${makeTag(item["分类"], "tag-blue")}
          ${makeTag(item["强度等级"])}
          ${makeTag(item["减脂效果"], "tag-purple")}
          ${makeTag(`${createCell(item["估算消耗(kcal)"])} kcal`, "tag-orange")}
        </div>
      </div>
      <div class="record-meta">
        <div><b>MET值</b><span>${createCell(item["MET值"])}</span></div>
        <div><b>备注</b><span>${createCell(item["备注"])}</span></div>
      </div>
    `;
    card.classList.add("reveal", "in");
    container.appendChild(card);
  });
}

async function initExercisePage() {
  renderSkeletonCards("exerciseCards", 8);
  const data = await loadNutritionData();
  const rows = data.references["运动能量消耗参考"] || [];
  const all = parseExerciseRecords(rows);

  const typeInput = document.getElementById("exerciseType");
  const levelInput = document.getElementById("intensityLevel");
  const keywordInput = document.getElementById("exerciseKeyword");
  const weightInput = document.getElementById("bodyWeight");
  const minutesInput = document.getElementById("duration");
  const sortInput = document.getElementById("sortMode");

  uniqueValues(all, "分类").forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    typeInput.appendChild(option);
  });
  uniqueValues(all, "强度等级").forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    levelInput.appendChild(option);
  });

  function refresh() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const type = typeInput.value;
    const level = levelInput.value;
    const weight = Number(weightInput.value || 60);
    const minutes = Number(minutesInput.value || 30);
    const sortMode = sortInput.value;

    const filtered = all
      .filter((item) => {
        const name = String(item["运动/活动类型"] ?? "").toLowerCase();
        const byKeyword = !keyword || name.includes(keyword);
        const byType = !type || item["分类"] === type;
        const byLevel = !level || item["强度等级"] === level;
        return byKeyword && byType && byLevel;
      })
      .map((item) => ({
        ...item,
        "估算消耗(kcal)": calcBurn(item["MET值"], weight, minutes),
      }));

    filtered.sort((a, b) => {
      if (sortMode === "name") {
        return String(a["运动/活动类型"]).localeCompare(String(b["运动/活动类型"]), "zh-Hans-CN");
      }
      return b["估算消耗(kcal)"] - a["估算消耗(kcal)"];
    });

    renderExerciseTable(filtered);

    const top = filtered.slice(0, 3);
    document.getElementById("exerciseStats").textContent = `当前匹配 ${filtered.length} 项，体重 ${weight}kg，时长 ${minutes} 分钟。`;
    document.getElementById("top1").textContent = top[0]
      ? `${top[0]["运动/活动类型"]}（${top[0]["估算消耗(kcal)"]} kcal）`
      : "—";
    document.getElementById("top2").textContent = top[1]
      ? `${top[1]["运动/活动类型"]}（${top[1]["估算消耗(kcal)"]} kcal）`
      : "—";
    document.getElementById("top3").textContent = top[2]
      ? `${top[2]["运动/活动类型"]}（${top[2]["估算消耗(kcal)"]} kcal）`
      : "—";
  }

  [typeInput, levelInput, keywordInput, weightInput, minutesInput, sortInput].forEach((el) => {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });

  refresh();
}

initExercisePage().catch((err) => {
  document.getElementById("exerciseError").textContent = err.message;
});
