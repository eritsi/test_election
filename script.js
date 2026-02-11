// 1. 政党ごとの色設定
const partyColors = {
  "自民党": "#0070c0",
  "立憲民主党": "#ff0000",
  "公明党": "#ffc000",
  "共産党": "#ff6600",
  "維新": "#00b050",
  "国民民主党": "#a020f0",
  "無所属": "#999999"
};

// 2. マップ初期化
const map = L.map('map').setView([37.8, 138], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. 県GeoJSON読み込み（例：Japan prefectures GeoJSON）
fetch('japan_prefectures.geojson')
  .then(res => res.json())
  .then(geojson => {
    L.geoJSON(geojson, {
      style: { color: '#555', weight: 1, fillOpacity: 0.7 },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => showMembers(feature.properties.name));
      }
    }).addTo(map);
  });

// 4. 議員データ読み込み
let membersData = [];
fetch('data.json')
  .then(res => res.json())
  .then(data => { membersData = data; });

// 5. 県クリック時に議員リスト表示
function showMembers(prefName) {
  const infoTitle = document.getElementById('info-title');
  const memberList = document.getElementById('member-list');

  infoTitle.textContent = prefName + 'の議員一覧';
  memberList.innerHTML = '';

  const members = membersData.filter(m => m.prefecture === prefName);
  members.forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.district}: ${m.member} (${m.party})`;
    li.style.color = partyColors[m.party] || '#000';
    memberList.appendChild(li);
  });
}