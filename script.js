const width = 1400;
const height = 900;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .style("background", "#e8e4da");

// =====================
// 政党カラー（正規表現パターン）
// =====================
// データ内で党名の表記ゆれが多いため、正規表現を使って
// カラーと表示名を紐付ける。データは変更せずにこちらで吸収する。
const partyColorPatterns = [
  { regex: /(?:自由民主党|自民党|自民)/, color: "#c53a3a", name: "自民党" },
  { regex: /立憲民主|立憲/, color: "#4f9ad6", name: "立憲民主党" },
  { regex: /連合/, color: "#2c1aec", name: "立憲民主党" },
  { regex: /維新/, color: "#77b255", name: "維新" },
  { regex: /公明/, color: "#f1b400", name: "公明党" },
  { regex: /共産/, color: "#9b7ac6", name: "日本共産党" },
  { regex: /国民民主/, color: "#e8a333", name: "国民民主党" },
  { regex: /参政/, color: "#8b4513", name: "参政党" },
  { regex: /ファースト/, color: "#66bb6a", name: "都民ファーストの会" },
  { regex: /1人会派/, color: "#999", name: "1人会派" },
  { regex: /空席/, color: "#000000", name: "空席" },
  { regex: /無所属/, color: "#ddd", name: "無所属" }
];

function normalizePartyName(party) {
  const entry = partyColorPatterns.find(e => e.regex.test(party));
  return entry ? entry.name : party;
}

function getPartyColor(party) {
  const entry = partyColorPatterns.find(e => e.regex.test(party));
  return entry ? entry.color : "#999"; // デフォルト灰色
}

let activeParty = null; // legendクリック状態

const tile = {
  // 北海道・東北（右上エリア）
  "北海道":  [9, 0],

  "青森県":  [9, 1],
  "岩手県":  [10, 1],
  "秋田県":  [8, 1],

  "宮城県":  [10, 2],
  "山形県":  [8, 2],
  "福島県":  [9, 2],

  // 関東
  "茨城県":  [10, 3],
  "栃木県":  [9, 3],
  "群馬県":  [8, 3],
  "新潟県":  [7, 3],

  "埼玉県":  [9, 4],
  "千葉県":  [10, 4],
  "東京都":  [9, 5],
  "神奈川県": [9, 6],

  // 中部・北陸
  "富山県":  [7, 4],
  "石川県":  [6, 3],
  "福井県":  [6, 4],
  "長野県":  [8, 4],
  "山梨県":  [8, 5],
  "岐阜県":  [7, 5],
  "静岡県":  [8, 6],
  "愛知県":  [7, 6],

  // 近畿
  "三重県":  [6, 6],
  "滋賀県":  [6, 5],
  "京都府":  [5, 5],
  "大阪府":  [5, 6],
  "兵庫県":  [4, 5],
  "奈良県":  [6, 7],
  "和歌山県": [5, 7],

  // 中国
  "鳥取県":  [3, 4],
  "島根県":  [2, 4],
  "岡山県":  [3, 5],
  "広島県":  [2, 5],
  "山口県":  [1, 5],

  // 四国
  "徳島県":  [5, 8],
  "香川県":  [4, 7],
  "愛媛県":  [3, 7],
  "高知県":  [4, 8],

  // 九州
  "福岡県":  [1, 6],
  "佐賀県":  [0, 6],
  "長崎県":  [0, 7],
  "熊本県":  [1, 7],
  "大分県":  [2, 6],
  "宮崎県":  [2, 7],
  "鹿児島県": [1, 8],

  // 沖縄
  "沖縄県":  [0, 10],
};

// =====================
// セルサイズ
// =====================
const cellW = 110;
const cellH = 90;

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
// legend（凡例）要素
// =====================
// SVGグループだけ先に作成し、データ読み込み後に中身を生成する。
const legend = svg.append("g")
  .attr("transform", "translate(50,50)");

// legend の項目はデータ読み込みの際に動的に決めるため、
// uniqueParties はその後で設定される。
let uniqueParties = [];

// toggleParty/updateHighlight は後述の関数利用する

function toggleParty(party) {
  activeParty = activeParty === party ? null : party;
  updateHighlight();
}

function updateHighlight() {
  svg.selectAll(".party-slice")
    .attr("opacity", d => {
      if (!activeParty) return 1;
      const partyName = normalizePartyName(d.data.party);
      return partyName === activeParty ? 1 : 0.15;
    });
}

// =====================
// データ読み込み
// =====================
d3.json("data.json").then(data => {

  // 凡例をデータから組み立てる
  uniqueParties = Array.from(new Set(data.map(d => normalizePartyName(d.party))));
  // 色が定義されている党のみ残す
  uniqueParties = uniqueParties.filter(p => getPartyColor(p) !== "#999");
  uniqueParties.forEach((party, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(${(i%3)*160}, ${Math.floor(i/3)*30})`)
      .style("cursor", "pointer")
      .on("click", () => toggleParty(party));

    g.append("circle")
      .attr("r", 8)
      .attr("fill", getPartyColor(party));

    g.append("text")
      .attr("x", 15)
      .attr("y", 4)
      .text(party);
  });

  // 各県ごとにデータをグループ化
  const grouped = d3.group(data, d => d.prefecture);

  // 最大人数を算出（スケール計算用）
  let maxCount = 0;
  grouped.forEach(members => {
    const total = members.reduce((sum, m) => sum + m.count, 0);
    maxCount = Math.max(maxCount, total);
  });

  // スケール関数（人数 → 半径、線形で計算して差を強調）
  const radiusScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([5, maxRadius]);

  // 全県ループ（データ無でも描画）
  Object.keys(tile).forEach(pref => {

    let members = grouped.get(pref) || [];
    // 表記ゆれを吸収して同党派をまとめる
    if (members.length > 0) {
      const agg = new Map();
      members.forEach(m => {
        const key = normalizePartyName(m.party);
        if (!agg.has(key)) {
          agg.set(key, { party: key, count: 0, positions: m.positions });
        }
        agg.get(key).count += m.count;
      });
      members = Array.from(agg.values());
    }
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
      .attr("fill", d => getPartyColor(d.data.party) || "#ccc")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 1)
      .on("mouseover", (event, d) => {
        let html = `${d.data.party}<br/>${d.data.count}人`;
        if (d.data.positions && d.data.positions[0]) {
          html = `<strong>${d.data.positions[0]}</strong><br/>` + html;
        }
        tooltip
          .style("opacity", 1)
          .html(html)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

  });

});
