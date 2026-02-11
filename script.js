const partyColors = {
  "自民党": "#0070c0",
  "立憲民主党": "#ff0000",
  "公明党": "#ffc000",
  "共産党": "#ff6600",
  "維新": "#00b050",
  "国民民主党": "#a020f0",
  "無所属": "#999999"
};

let allMembers = [];
let features;

const container = document.getElementById("map");
const width = container.clientWidth;
const height = container.clientHeight;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

const projection = d3.geoMercator()
  .center([137, 37])
  .scale(width * 1.2)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const cartogram = d3.cartogram()
  .projection(projection)
  .value(d => 1); // 全県均等化

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("display", "none");

// --------------------
// GeoJSON読み込み
// --------------------
d3.json("prefectures.geojson").then(geojson => {

  features = cartogram(geojson).features;

  drawMap(features);
  loadMembers();
});

// --------------------
// 地図描画
// --------------------
function drawMap(features) {

  svg.selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
}

// --------------------
// 議員読み込み
// --------------------
function loadMembers() {
  d3.json("data.json").then(data => {
    allMembers = data;
    createFilters();
    createLegend();
    plotMembers();
  });
}

// --------------------
// 円形ドット配置
// --------------------
function plotMembers() {

  svg.selectAll(".member-dot").remove();

  const checkedParties = Array.from(
    document.querySelectorAll('#filters input:checked')
  ).map(cb => cb.value);

  const filtered = allMembers.filter(m =>
    checkedParties.includes(m.party)
  );

  const grouped = d3.group(filtered, d => d.prefecture);

  grouped.forEach((members, prefectureName) => {

    const prefecture = features.find(f =>
      f.properties.name === prefectureName
    );

    if (!prefecture) return;

    const centroid = path.centroid(prefecture);

    const radius = 18;
    const angleStep = (2 * Math.PI) / members.length;

    members.forEach((member, i) => {

      const angle = i * angleStep;

      const x = centroid[0] + radius * Math.cos(angle);
      const y = centroid[1] + radius * Math.sin(angle);

      svg.append("circle")
        .attr("class", "member-dot")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", partyColors[member.party] || "#000")
        .attr("stroke", "#222")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event) => {
          tooltip
            .style("display", "block")
            .html(`${member.member}<br>${member.party}<br>${member.district}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        });
    });
  });
}

// --------------------
// フィルター
// --------------------
function createFilters() {
  const filterDiv = document.getElementById('filters');
  const parties = [...new Set(allMembers.map(m => m.party))];

  parties.forEach(party => {
    const label = document.createElement('label');
    label.style.marginRight = "10px";

    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = party;
    checkbox.addEventListener('change', plotMembers);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + party));
    filterDiv.appendChild(label);
  });
}

// --------------------
// 凡例
// --------------------
function createLegend() {

  const legend = document.createElement("div");
  legend.className = "legend";

  Object.keys(partyColors).forEach(party => {
    const item = document.createElement("div");
    item.innerHTML = `
      <span style="display:inline-block;width:12px;height:12px;background:${partyColors[party]};margin-right:5px;"></span>
      ${party}
    `;
    legend.appendChild(item);
  });

  document.body.appendChild(legend);
}
