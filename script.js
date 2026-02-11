const width = window.innerWidth;
const height = window.innerHeight * 0.8;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

// =====================
// 政党カラー
// =====================
const partyColors = {
  "自民党": "#0070c0",
  "立憲民主党": "#ff0000",
  "公明党": "#ffc000",
  "共産党": "#ff6600",
  "維新": "#00b050",
  "国民民主党": "#a020f0",
  "無所属": "#999999"
};

// =====================
// 都道府県グリッド座標
// （簡易版・必要に応じて調整可能）
// =====================
const prefectureGrid = {
  "北海道": [6,0],

  "青森県":[5,1],"岩手県":[6,1],"秋田県":[4,1],
  "宮城県":[6,2],"山形県":[4,2],"福島県":[5,2],

  "茨城県":[7,3],"栃木県":[6,3],"群馬県":[5,3],
  "埼玉県":[6,4],"千葉県":[7,4],"東京都":[6,5],"神奈川県":[5,5],

  "新潟県":[4,3],"富山県":[3,4],"石川県":[2,4],"福井県":[2,5],
  "山梨県":[5,4],"長野県":[4,4],"岐阜県":[3,5],
  "静岡県":[5,6],"愛知県":[4,6],

  "三重県":[3,6],"滋賀県":[2,6],"京都府":[1,6],
  "大阪府":[2,7],"兵庫県":[1,7],"奈良県":[3,7],"和歌山県":[2,8],

  "鳥取県":[0,7],"島根県":[0,6],"岡山県":[1,8],
  "広島県":[0,8],"山口県":[0,9],

  "徳島県":[2,9],"香川県":[1,9],"愛媛県":[0,10],"高知県":[1,10],

  "福岡県":[2,10],"佐賀県":[1,11],"長崎県":[0,11],
  "熊本県":[2,11],"大分県":[3,10],
  "宮崎県":[3,11],"鹿児島県":[2,12],

  "沖縄県":[3,14]
};

const cellSize = 70;

// =====================
// 県マス描画
// =====================
Object.entries(prefectureGrid).forEach(([name, pos]) => {

  const x = pos[0] * cellSize + 100;
  const y = pos[1] * cellSize + 50;

  svg.append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#333");

  svg.append("text")
    .attr("x", x + cellSize/2)
    .attr("y", y + 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(name.replace("県","").replace("府","").replace("都",""));
});

// =====================
// 議員読み込み
// =====================
d3.json("data.json").then(data => {

  const grouped = d3.group(data, d => d.prefecture);

  grouped.forEach((members, prefectureName) => {

    const gridPos = prefectureGrid[prefectureName];
    if (!gridPos) return;

    const baseX = gridPos[0] * cellSize + 100 + cellSize/2;
    const baseY = gridPos[1] * cellSize + 50 + cellSize/2 + 10;

    const radius = 18;
    const angleStep = (2 * Math.PI) / members.length;

    members.forEach((member, i) => {

      const angle = i * angleStep;

      const x = baseX + radius * Math.cos(angle);
      const y = baseY + radius * Math.sin(angle);

      svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 6)
        .attr("fill", partyColors[member.party] || "#000")
        .attr("stroke", "#222")
        .attr("stroke-width", 0.5)
        .append("title")
        .text(`${member.member} (${member.party})`);
    });
  });
});
