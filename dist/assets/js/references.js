function createRecordCard(title, tags, metas, details) {
  const card = document.createElement("article");
  card.className = "record-card";
  const metaHtml = metas.length
    ? `<div class="record-meta">${metas
        .map((m) => `<div><b>${createCell(m.k)}</b><span>${createCell(m.v)}</span></div>`)
        .join("")}</div>`
    : "";
  const detailHtml = details.length
    ? `<div class="record-body">${details
        .map((d) => `<p><b>${createCell(d.k)}：</b>${createCell(d.v)}</p>`)
        .join("")}</div>`
    : "";
  card.innerHTML = `
    <div class="record-head">
      <h3>${createCell(title)}</h3>
      <div class="record-tags">${tags.join("")}</div>
    </div>
    ${metaHtml}
    ${detailHtml}
  `;
  card.classList.add("reveal", "in");
  return card;
}

function matchesKeyword(value, keyword) {
  if (!keyword) return true;
  return String(value ?? "").toLowerCase().includes(keyword);
}

function recordMatches(record, keyword) {
  if (!keyword) return true;
  return Object.values(record).some((v) => matchesKeyword(v, keyword));
}

function appendBlock(root, title, subtitle) {
  const block = document.createElement("section");
  block.className = "panel";
  const h2 = document.createElement("h2");
  h2.textContent = title;
  block.appendChild(h2);
  if (subtitle) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = subtitle;
    block.appendChild(p);
  }
  root.appendChild(block);
  return block;
}

function renderCardList(container, cards) {
  const list = document.createElement("div");
  list.className = "record-list";
  cards.forEach((card) => list.appendChild(card));
  container.appendChild(list);
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

async function initReferencePage() {
  renderSkeletonCards("referenceRoot", 6);
  const data = await loadNutritionData();
  const root = document.getElementById("referenceRoot");
  const keywordInput = document.getElementById("refKeyword");
  const statsNode = document.getElementById("refStats");

  function renderAll() {
    const keywordRaw = keywordInput.value.trim();
    const keyword = keywordRaw.toLowerCase();
    root.innerHTML = "";

    const ingredients = (data.ingredients || []).filter((r) => recordMatches(r, keyword));
    const categoryNotes = (data.notes["分类说明"] || []).filter((r) => recordMatches(r, keyword));
    const usageNotes = (data.notes["使用说明"] || []).filter((r) => recordMatches(r, keyword));
    const benchmarkItems = parseBenchmarkRows(data.references["菜肴标杆对照表"] || []).filter((r) =>
      recordMatches(r, keyword)
    );

    statsNode.textContent = keyword
      ? `关键词“${keywordRaw}”匹配 ${ingredients.length + categoryNotes.length + usageNotes.length + benchmarkItems.length} 条内容`
      : "当前展示全部参考内容";

    const ingredientBlock = appendBlock(
      root,
      "食材营养成分",
      `共 ${ingredients.length} 条，可用于主页面“主要原料”字段联查`
    );
    renderCardList(
      ingredientBlock,
      ingredients.map((row) =>
        createRecordCard(
          row["名称"],
          [makeTag(row["分类"], "tag-green"), makeTag(`${createCell(row["每100g能量(kcal)"])} kcal/100g`, "tag-blue")],
          [
            { k: "每份重量", v: `${createCell(row["常见每份(g)"])} g` },
            { k: "每份能量", v: `${createCell(row["每份能量(kcal)"])} kcal` },
          ],
          [
            { k: "核心营养", v: row["核心营养成分"] },
            { k: "其他营养", v: row["其他营养成分"] },
            { k: "备注", v: row["备注"] },
          ]
        )
      )
    );

    const categoryBlock = appendBlock(root, "分类说明", "");
    renderCardList(
      categoryBlock,
      categoryNotes.map((row) =>
        createRecordCard(row["分类"], [makeTag("分类说明", "tag-purple")], [], [{ k: "说明", v: row["颜色说明"] }])
      )
    );

    const usageBlock = appendBlock(root, "使用说明", "");
    const usageKey = usageNotes[0] ? Object.keys(usageNotes[0])[0] : "";
    renderCardList(
      usageBlock,
      usageNotes.map((row) => createRecordCard(row[usageKey], [makeTag("使用说明", "tag-blue")], [], []))
    );

    const benchmarkBlock = appendBlock(root, "菜肴标杆对照", "");
    renderCardList(
      benchmarkBlock,
      benchmarkItems.map((row) =>
        createRecordCard(
          row["标杆菜例"],
          [makeTag(row["肉类/食材"], "tag-purple"), makeTag(row["用油程度"]), makeTag(row["减脂指数★少=好"], "tag-orange")],
          [
            { k: "烹饪方式", v: row["烹饪方式"] },
            { k: "每100g热量", v: `${createCell(row["每100g kcal"])} kcal` },
            { k: "每份热量", v: `${createCell(row["每份 kcal"])} kcal` },
          ],
          [{ k: "健康提示", v: row["健康提示"] }]
        )
      )
    );
  }

  keywordInput.addEventListener("input", renderAll);
  renderAll();
}

initReferencePage().catch((err) => {
  document.getElementById("referenceRoot").textContent = err.message;
});
