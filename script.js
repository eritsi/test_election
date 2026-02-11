const width = 1400;
const height = 900;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .style("background", "#e8e4da");

// =====================
// 政党カラー
// =====================
const partyColors = {
  "自民党": "#c53a3a",
  "立憲民主党": "#4f9ad6",
  "維新": "#77b255",
  "公明党": "#f1b400",
  "共産党": "#9b7ac6",
  "無所属": "#666"
};

let activeParty = null; // legendクリック状態

// =====================
// タイル座標（全県分）
// =====================
const tile = {
  "北海道":[9,0],

  "青森県":[8,1],"岩手県":[9,1],"秋田県":[7,1],
  "宮城県":[9,2],"山形県":[7,2],"福島県":[8,2],

  "新潟県":[7,3],"富山県":[6,3],"石川県":[5,3],
  "福井県":[5,4],"長野県":[7,4],

  "茨城県":[10,4],"栃木県":[9,4],"群馬県":[8,4],
  "埼玉県":[9,5],"千葉県":[11,6],
  "東京都":[10,6],"神奈川県":[9,6],

  "岐阜県":[6,5],"静岡県":[8,7],"愛知県":[7,7],
  "三重県":[6,7],

  "滋賀県":[5,6],"京都府":[4,6],
  "大阪府":[5,7],"兵庫県":[4,7],
  "奈良県":[6,8],"和歌山県":[5,8],

  "鳥取県":[3,6],"島根県":[2,6],
  "岡山県":[3,7],"広島県":[2,7],
  "山口県":[1,8],

  "徳島県":[5,9],"香川県":[4,9],
  "愛媛県":[3,9],"高知県":[4,10],

  "福岡県":[3,10],"佐賀県":[2,10],
  "長崎県":[1,10],"熊本県":[3,11],
  "大分県":[4,11],
  "宮崎県":[4,12],"鹿児島県":[3,12],

  "沖縄県":[2,14]
};


// =====================
// ツールチップ
// =====================
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("padding", "8px 12px")
  .style("border", "1px solid #999")
  .style("border-radius", "6px")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// =====================
// legend描画
// =====================
const legend = svg.append("g")
  .attr("transform", "translate(50,50)");

Object.entries(partyColors).forEach(([party, color], i) => {

  const g = legend.append("g")
    .attr("transform", `translate(${(i%3)*160}, ${Math.floor(i/3)*30})`)
    .style("cursor", "pointer")
    .on("click", () => toggleParty(party));

  g.append("circle")
    .attr("r", 8)
    .attr("fill", color);

  g.append("text")
    .attr("x", 15)
    .attr("y", 4)
    .text(party);
});

function toggleParty(party) {
  activeParty = activeParty === party ? null : party;
  updateHighlight();
}

function updateHighlight() {
  svg.selectAll(".dot")
    .attr("opacity", d => {
      if (!activeParty) return 1;
      return d.party === activeParty ? 1 : 0.15;
    });
}

// =====================
// データ読み込み
// =====================
d3.json("data.json").then(data => {

  const grouped = d3.group(data, d => d.prefecture);

  const cellW = 110;
  const cellH = 90;
  const cols = 4;

  // 🔥 全県ループ（データ無でも描画）
  Object.keys(tile).forEach(pref => {

    const members = grouped.get(pref) || [];

    const pos = tile[pref];
    const x = pos[0] * cellW;
    const y = pos[1] * cellH;

    const rows = Math.ceil(members.length / cols);
    const boxHeight = 40 + Math.max(rows, 1) * 20;

    // カード
    const card = svg.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", 100)
      .attr("height", boxHeight)
      .attr("rx", 8)
      .attr("fill", "#f4f4f4")
      .attr("stroke", "#b9a88f")
      .on("mouseover", (event) => {
        tooltip
          .style("opacity", 1)
          .html(`<strong>${pref}</strong><br/>議席数: ${members.length}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // タイトル
    svg.append("text")
      .attr("x", x + 8)
      .attr("y", y + 16)
      .attr("font-size", 12)
      .text(`${pref.replace(/都|府|県/,"")} (${members.length})`);

    // ドット
    members.forEach((m, i) => {

      const col = i % cols;
      const row = Math.floor(i / cols);

      svg.append("circle")
        .datum(m)
        .attr("class", "dot")
        .attr("cx", x + 15 + col * 20)
        .attr("cy", y + 30 + row * 20)
        .attr("r", 6)
        .attr("fill", partyColors[m.party] || "#999")
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(`${d.member}<br/>${d.party}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
    });

  });

});
