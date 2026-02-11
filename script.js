// --------------------
// 政党カラー
// --------------------
const partyColors = {
  "自民党": "#0070c0",
  "立憲民主党": "#ff0000",
  "公明党": "#ffc000",
  "共産党": "#ff6600",
  "維新": "#00b050",
  "国民民主党": "#a020f0",
  "無所属": "#999999"
};

// --------------------
// マップ初期化（タイルなし）
// --------------------
const map = L.map('map', {
  zoomControl: true,
  attributionControl: false
});

// --------------------
// 県GeoJSON読み込み
// --------------------
let prefectureLayer;

fetch('prefectures.geojson')
  .then(res => res.json())
  .then(geojson => {

    prefectureLayer = L.geoJSON(geojson, {
      style: {
        color: "#333",
        weight: 1,
        fillColor: "#f0f0f0",
        fillOpacity: 0.8
      }
    }).addTo(map);

    map.fitBounds(prefectureLayer.getBounds());

    // GeoJSON読み込み後に議員描画
    loadMembers();
  });

// --------------------
// 議員データ読み込み
// --------------------
function loadMembers() {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      plotMembers(data);
    });
}

// --------------------
// ドット描画処理
// --------------------
function plotMembers(members) {

  members.forEach(member => {

    // 県ポリゴン取得
    prefectureLayer.eachLayer(layer => {

      if (layer.feature.properties.name === member.prefecture) {

        // 県の中心座標を取得
        const center = layer.getBounds().getCenter();

        // 少しランダムにずらして重なり防止
        const latOffset = (Math.random() - 0.5) * 0.3;
        const lngOffset = (Math.random() - 0.5) * 0.3;

        const marker = L.circleMarker(
          [center.lat + latOffset, center.lng + lngOffset],
          {
            radius: 6,
            fillColor: partyColors[member.party] || "#000",
            color: "#000",
            weight: 1,
            fillOpacity: 0.9
          }
        ).addTo(map);

        // ホバーでポップアップ
        marker.bindTooltip(
          `${member.member}<br>${member.party}<br>${member.district}`,
          { direction: "top" }
        );
      }
    });
  });
}
