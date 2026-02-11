const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

// ------------------
// 政党カラー
// ------------------
const partyColors = {
  "自民党": "#0070c0",
  "立憲民主党": "#ff0000",
  "公明党": "#ffc000",
  "共産党": "#ff6600",
  "維新": "#00b050",
  "国民民主党": "#a020f0",
  "無所属": "#999999"
};

// ------------------
// 参考サイト風レイアウト座標
// （見た目重視・地理ではない）
// ------------------
const layout = {
  "北海道":[600,80],

  "青森県":[580,170],"岩手県":[620,200],"秋田県":[540,200],
  "宮城県":[610,250],"山形県":[540,240],"福島県":[580,300],

  "新潟県":[500,310],"富山県":[440,350],"石川県":[400,350],
  "福井県":[380,390],"長野県":[520,360],

  "茨城県":[660,360],"栃木県":[610,340],"群馬県":[570,350],
  "埼玉県":[600,390],"千葉県":[680,410],
  "東京都":[630,420],"神奈川県":[600,450],
  "山梨県":[560,410],

  "岐阜県":[470,400],"静岡県":[580,480],"愛知県":[500,470],
  "三重県":[460,500],

  "滋賀県":[420,470],"京都府":[380,470],
  "大阪府":[410,510],"兵庫県":[350,510],
  "奈良県":[430,520],"和歌山県":[400,560],

  "鳥取県":[300,500],"島根県":[260,470],
  "岡山県":[330,540],"広島県":[290,560],
  "山口県":[250,600],

  "徳島県":[400,600],"香川県":[360,580],
  "愛媛県":[320,610],"高知県":[360,650],

  "福岡県":[350,640],"佐賀県":[320,670],
  "長崎県":[280,680],"熊本県":[380,690],
  "大分県":[420,660],
  "宮崎県":[430,720],"鹿児島県":[380,740],

  "沖縄県":[450,820]
};

// ------------------
// 県円（簡略形状）
// ------------------
Object.entries(layout).forEach(([name, pos]) => {

  svg.append("circle")
    .attr("cx", pos[0])
    .attr("cy", pos[1])
    .attr("r", 28)
    .attr("fill", "#f2f2f2")
    .attr("stroke", "#333");

  svg.append("text")
    .attr("x", pos[0])
    .attr("y", pos[1] - 35)
    .attr("text-anchor", "middle")
    .text(name.replace(/都|府|県/, ""));
});

// ------------------
// ドット描画
// ------------------
d3.json("data.json").then(data => {

  const grouped = d3.group(data, d => d.prefecture);

  grouped.forEach((members, prefectureName) => {

    const pos = layout[prefectureName];
    if (!pos) return;

    const radius = 16;
    const angleStep = (2 * Math.PI) / members.length;

    members.forEach((member, i) => {

      const angle = i * angleStep;

      const x = pos[0] + radius * Math.cos(angle);
      const y = pos[1] + radius * Math.sin(angle);

      svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", partyColors[member.party] || "#000")
        .append("title")
        .text(`${member.member} (${member.party})`);
    });
  });
});
