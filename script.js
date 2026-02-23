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
  "自由民主党": "#c53a3a",
  "自民党": "#c53a3a",
  "立憲民主党": "#4f9ad6",
  "維新": "#77b255",
  "日本維新の会": "#77b255",
  "公明党": "#f1b400",
  "共産党": "#9b7ac6",
  "日本共産党": "#9b7ac6",
  "国民民主党": "#e8a333",
  "参政党": "#8b4513",
  "かながわ未来": "#66bb6a",
  "1人会派": "#999",
  "自由を守る会": "#7c7c7c",
  "空席": "#ddd",
  "無所属": "#999"
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
// セルサイズ
// =====================
const cellW = 110;
const cellH = 90;

// 半円形pie chartの最大半径（cellHから逆算）
// cellH=90, 余白を考慮して max_radius ≒ 35px
const maxRadius = 35;


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
  .style("opacity", 0)
  .style("z-index", 1000);

// =====================
// legend描画
// =====================
const legend = svg.append("g")
  .attr("transform", "translate(50,50)");

const uniqueParties = Array.from(new Set([
  "自民党", "立憲民主党", "公明党", "日本共産党", "維新",
  "国民民主党", "参政党", "かながわ未来", "1人会派", "空席"
]));

uniqueParties.forEach((party, i) => {
  const g = legend.append("g")
    .attr("transform", `translate(${(i%3)*160}, ${Math.floor(i/3)*30})`)
    .style("cursor", "pointer")
    .on("click", () => toggleParty(party));

  g.append("circle")
    .attr("r", 8)
    .attr("fill", partyColors[party] || "#999");

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
  svg.selectAll(".party-slice")
    .attr("opacity", d => {
      if (!activeParty) return 1;
      return d.data.party === activeParty ? 1 : 0.15;
    });
}

// =====================
// データ読み込み
// =====================
d3.json("data.json").then(data => {

  // 各県ごとにデータをグループ化
  const grouped = d3.group(data, d => d.prefecture);

  // 最大人数を算出（スケール計算用）
  let maxCount = 0;
  grouped.forEach(members => {
    const total = members.reduce((sum, m) => sum + m.count, 0);
    maxCount = Math.max(maxCount, total);
  });

  // スケール関数（人数 → 半径、平方根で計算）
  const radiusScale = d3.scaleSqrt()
    .domain([0, maxCount])
    .range([5, maxRadius]);

  // 全県ループ（データ無でも描画）
  Object.keys(tile).forEach(pref => {

    const members = grouped.get(pref) || [];
    const totalCount = members.reduce((sum, m) => sum + m.count, 0);
    const radius = radiusScale(totalCount);

    const pos = tile[pref];
    const x = pos[0] * cellW + cellW / 2;
    const y = pos[1] * cellH + cellH / 2 + 15;

    // 背景カード
    const card = svg.append("rect")
      .attr("x", pos[0] * cellW)
      .attr("y", pos[1] * cellH)
      .attr("width", cellW)
      .attr("height", cellH)
      .attr("rx", 4)
      .attr("fill", "#f9f7f2")
      .attr("stroke", "#b9a88f")
      .attr("stroke-width", 1);

    // タイトル
    svg.append("text")
      .attr("x", pos[0] * cellW + 8)
      .attr("y", pos[1] * cellH + 14)
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text(`${pref.replace(/都|府|県/,"")}`);

    // 人数表示
    svg.append("text")
      .attr("x", pos[0] * cellW + 8)
      .attr("y", pos[1] * cellH + 25)
      .attr("font-size", 9)
      .attr("fill", "#666")
      .text(`${totalCount}人`);

    // pie chartがない場合
    if (members.length === 0) {
      return;
    }

    // 半円形pie chart
    const pie = d3.pie()
      .value(d => d.count)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(d => d.startAngle)
      .endAngle(d => d.endAngle);

    const pieData = pie(members);

    const group = svg.append("g")
      .attr("transform", `translate(${x}, ${y})`);

    // 各党派のスライス
    group.selectAll(".party-slice")
      .data(pieData)
      .enter()
      .append("path")
      .attr("class", "party-slice")
      .attr("d", arc)
      .attr("fill", d => partyColors[d.data.party] || "#ccc")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.data.positions[0]}</strong><br/>${d.data.party}<br/>${d.data.count}人`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

  });

});
