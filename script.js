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
    centerLon + (coord[0] - centerLon) * 0.65,
    centerLat + (coord[1] - centerLat) * 0.85
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

  return {
    ...geometry,
    coordinates: recurse(geometry.coordinates)
  };
}

// --------------------
// GeoJSON読み込み
// --------------------
d3.json("prefectures.geojson")
  .then(function(geojson) {

    // 座標変形
    geojson.features.forEach(function(feature) {
      feature.geometry = deformGeometry(feature.geometry);
    });

    // 描画
    svg.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#f5f5f5")
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5);

  })
  .catch(function(error) {
    console.error("GeoJSON読み込みエラー:", error);
  });
