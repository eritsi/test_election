const width = window.innerWidth;
const height = window.innerHeight * 0.8;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

const projection = d3.geoMercator()
  .center([137, 37])
  .scale(width * 1.1)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// --------------------
// 疑似デフォルメ関数
// --------------------
function deformCoord(coord) {
  const centerLon = 137;
  const centerLat = 37;

  return [
    centerLon + (coord[0] - centerLon) * 0.65, // 東西圧縮
    centerLat + (coord[1] - centerLat) * 0.85  // 南北圧縮
  ];
}

// --------------------
// GeoJSONの座標を再帰変換
// --------------------
function deformGeometry(geometry) {

  function recurse(coords) {
    if (typeof coords[0] === "number") {
      return deformCoord(coords);
    }
    return coords.map(recurse);
  }

  geometry.coordinates = recurse(geometry.coordinates);
  return geometry;
}

// --------------------
// 読み込み
// --------------------
d3.json("prefectures.geojson").then(geojson => {

  // 🔥 座標を直接変形
  geojson.features.forEach(feature => {
    feature.geometry = deformGeometry(feature.geometry);
  });

  svg.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
