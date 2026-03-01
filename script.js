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

// タイル配列の形式
// [x, y] はセルの左上座標（ピクセル単位）を表す。
// 3 番目・4 番目の要素でセルの幅と高さをオーバーライド可能。
// 例: "東京都": [990, 450, 120, 100]
//
// **後方互換**
// 旧形式 [列, 行, w?, h?] もサポートし、自動的に座標へ変換する。
// 変換は実行時に tile オブジェクトを書き換えるため、
// 既存データはそのままで構いません。
const tile = {
  "北海道":   [960,   0,  110,  90],
  "秋田県":   [890,  97,   70,  58],
  "青森県":   [960,  97,   70,  58],
  "岩手県":  [1030,  90,   75,  58],
  "山形県":   [890, 155,   70,  58],
  "福島県":   [960, 155,   70,  58],
  "宮城県":  [1030, 148,   90,  65],
  "石川県":   [700, 213,   70,  58],
  "富山県":   [770, 213,   70,  58],
  "新潟県":   [840, 213,   70,  58],
  "福井県":   [700, 278,   70,  58],
  "長野県":   [790, 271,   90,  65],
  "山梨県":   [880, 271,   70,  58],
  "群馬県":   [910, 213,   70,  58],
  "栃木県":   [980, 213,   70,  58],
  "茨城県":  [1050, 213,   90,  65],
  "埼玉県":  [950, 271,  100,  78],
  "東京都":  [1000, 356,  110,  90],
  "千葉県":  [1100, 278,  100,  78],
  "神奈川県":[1000, 446,  105,  75],
  "静岡県":   [850, 474,   90,  65],
  "愛知県":   [840, 396,  100,  78],
  "滋賀県":   [690, 336,   70,  58],
  "岐阜県":   [800, 336,   75,  60],
  "京都府":   [610, 336,   80,  60],
  "大阪府":   [610, 396,   95,  78],
  "奈良県":   [705, 396,   65,  58],
  "三重県":   [770, 396,   70,  58],
  "和歌山県": [610, 474,   95,  65],
  "兵庫県":   [505, 396,  105,  78],
  "島根県":   [255, 396,   80,  58],
  "鳥取県":   [335, 396,   80,  58],
  "岡山県":   [335, 454,   75,  60],
  "広島県":   [255, 454,   80,  60],
  "山口県":   [175, 396,   80,  58],
  "愛媛県":   [310, 514,   75,  58],
  "香川県":   [385, 514,   75,  55],
  "徳島県":   [460, 514,   70,  58],
  "高知県":   [335, 572,   80,  60],
  "佐賀県":   [ 65, 454,   70,  58],
  "福岡県":   [135, 454,  100,  78],
  "大分県":   [235, 514,   75,  60],
  "長崎県":   [  5, 512,   75,  58],
  "熊本県":   [135, 532,   80,  60],
  "宮崎県":   [235, 574,   75,  60],
  "鹿児島県": [135, 592,   80,  60],
  "沖縄県":   [  0, 700,   70,  55],
};
// =====================
// セルサイズ（デフォルト）
// =====================
// 各都道府県ごとに異なる幅・高さを指定する際に使用。
// (x, y) は tile 定義で与えられるのでここでは扱わない。
const defaultCellW = 110;
const defaultCellH = 90;

const maxRadius = 35;

// ---- 後方互換処理: グリッド座標をピクセル座標に変換 ----
Object.keys(tile).forEach(pref => {
  const entry = tile[pref];
  if (!Array.isArray(entry) || entry.length < 2) return;
  // a,b は元の 1/2 番目要素。
  let [a, b, w = defaultCellW, h = defaultCellH] = entry;
  let x = a;
  let y = b;
  // 旧形式（列・行指定）とみなす条件:
  //   - 要素数が 2 か 4 で、幅高さがデフォルト
  //   - a,b が小さな整数（グリッド位置と推測）
  if ((entry.length === 2) ||
      (entry.length >= 4 && w === defaultCellW && h === defaultCellH &&
       Number.isInteger(a) && Number.isInteger(b) && a < 20 && b < 20)) {
    x = a * defaultCellW;
    y = b * defaultCellH;
  }
  tile[pref] = [x, y, w, h];
});

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

    // タイル情報を分解。x,y が左上座標、幅高さはオプション。
    const [x, y, cellW = defaultCellW, cellH = defaultCellH] = tile[pref];
    const centerX = x + cellW / 2;
    const centerY = y + cellH / 2 + 15;

    // 背景カード
    const card = svg.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", cellW)
      .attr("height", cellH)
      .attr("rx", 4)
      .attr("fill", "#f9f7f2")
      .attr("stroke", "#b9a88f")
      .attr("stroke-width", 1);

    // タイトル
    svg.append("text")
      .attr("x", x + 8)
      .attr("y", y + 14)
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text(`${pref.replace(/都|府|県/,"")}`);

    // 人数表示
    svg.append("text")
      .attr("x", x + 8)
      .attr("y", y + 25)
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
      // 使用するのはセル左上ではなく中心位置
      .attr("transform", `translate(${centerX}, ${centerY})`);

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