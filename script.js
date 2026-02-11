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

let prefectureLayer;
let allMembers = [];
let markers = [];
let prefectureCenters = {};

const map = L.map('map', {
  zoomControl: true,
  attributionControl: false
});

// --------------------
// GeoJSON読み込み
// --------------------
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

    // 県中心座標取得
    prefectureLayer.eachLayer(layer => {
      const name = layer.feature.properties.name;
      prefectureCenters[name] = layer.getBounds().getCenter();
    });

    // 🔥 東京の重心補正
    fixTokyoCenter();

    loadMembers();
  });

// --------------------
// 東京の重心補正
// --------------------
function fixTokyoCenter() {
  const kanagawa = prefectureCenters["神奈川県"];
  const saitama = prefectureCenters["埼玉県"];

  if (kanagawa && saitama) {
    prefectureCenters["東京都"] = L.latLng(
      (kanagawa.lat + saitama.lat) / 2,
      (kanagawa.lng + saitama.lng) / 2
    );
  }
}

// --------------------
// 議員データ読み込み
// --------------------
function loadMembers() {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      allMembers = data;
      createFilters();
      createLegend();
      plotMembers();
    });
}

// --------------------
// フィルターUI作成
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
    label.appendChild(document.createTextNode(party));
    filterDiv.appendChild(label);
  });
}

// --------------------
// 凡例作成
// --------------------
function createLegend() {

  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");

    Object.keys(partyColors).forEach(party => {
      const item = `
        <div class="legend-item">
          <div class="legend-color" style="background:${partyColors[party]}"></div>
          ${party}
        </div>
      `;
      div.innerHTML += item;
    });

    return div;
  };

  legend.addTo(map);
}

// --------------------
// ドット描画
// --------------------
function plotMembers() {

  // 既存マーカー削除
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const checkedParties = Array.from(
    document.querySelectorAll('#filters input:checked')
  ).map(cb => cb.value);

  const filtered = allMembers.filter(m =>
    checkedParties.includes(m.party)
  );

  filtered.forEach(member => {

    const center = prefectureCenters[member.prefecture];
    if (!center) return;

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

    marker.bindTooltip(
      `${member.member}<br>${member.party}<br>${member.district}`,
      { direction: "top" }
    );

    markers.push(marker);
  });
}
