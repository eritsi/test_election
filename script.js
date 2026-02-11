const width = window.innerWidth;
const height = window.innerHeight * 0.8;

const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

const projection = d3.geoMercator()
  .center([137, 37])
  .scale(width * 1.1)
  .translate([width / 2, height / 2]);

// 🔥 疑似デフォルメ変換
function deform([lon, lat]) {
  const centerLon = 137;
  const centerLat = 37;

  return [
    centerLon + (lon - centerLon) * 0.65, // 東西圧縮
    centerLat + (lat - centerLat) * 0.85  // 南北圧縮
  ];
}

const path = d3.geoPath().projection({
  stream: function(stream) {
    const projectionStream = projection.stream({
      point(lon, lat) {
        const [newLon, newLat] = deform([lon, lat]);
        stream.point(...projection([newLon, newLat]));
      },
      lineStart: () => stream.lineStart(),
      lineEnd: () => stream.lineEnd(),
      polygonStart: () => stream.polygonStart(),
      polygonEnd: () => stream.polygonEnd()
    });
    return projectionStream;
  }
});

d3.json("prefectures.geojson").then(geojson => {

  svg.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#f0f0f0")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);
});
