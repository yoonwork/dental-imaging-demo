// 모노덴트(가상) — 치과영상 분석 시제품 화면 모형. 서버·DB·AI 없음. 모든 데이터는 가상.
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toFixed(d);
const deg = (r) => (r * 180) / Math.PI;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ang3 = (a, b, c) => { const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]]; return deg(Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2)))))); };
const angLines = (p1, p2, q1, q2) => ang3([p1[0] + (p2[0] - p1[0]), p1[1] + (p2[1] - p1[1])], p1, [p1[0] + (q2[0] - q1[0]), p1[1] + (q2[1] - q1[1])]);
const now = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const ICON = {
  pan: '<path d="M10 2.5v15M2.5 10h15M10 2.5l-2 2M10 2.5l2 2M10 17.5l-2-2M10 17.5l2-2M2.5 10l2-2M2.5 10l2 2M17.5 10l-2-2M17.5 10l-2 2"/>',
  zoom: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.2 12.2l4.8 4.8M6.5 8.5h4M8.5 6.5v4"/>',
  wl: '<circle cx="10" cy="10" r="6.5"/><path d="M10 3.5v13" /><path d="M10 3.5a6.5 6.5 0 0 0 0 13z" fill="currentColor"/>',
  len: '<path d="M3 15L15 3M3 15l1.5-4M3 15l4-1.5M15 3l-1.5 4M15 3l-4 1.5"/>',
  ang: '<path d="M3 16h14M3 16L13 4"/><path d="M8 16a5 5 0 0 0-1.5-3.6"/>',
  lm: '<circle cx="10" cy="10" r="2.2"/><path d="M10 2.5v4M10 13.5v4M2.5 10h4M13.5 10h4"/>',
  reset: '<path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3v3.5h3.5"/>',
  cmp: '<rect x="2.5" y="4" width="6.5" height="12" rx="1"/><rect x="11" y="4" width="6.5" height="12" rx="1"/>',
  up: '<path d="M10 14V4M6 8l4-4 4 4M4 16.5h12"/>',
  inv: '<rect x="3" y="3" width="14" height="14" rx="1.5"/><path d="M3 17L17 3" /><path d="M3 3h14L3 17z" fill="currentColor"/>',
};
const svg = (k) => `<svg viewBox="0 0 20 20" aria-hidden="true">${ICON[k]}</svg>`;

// ---------------- 가상 데이터 ----------------
const S = {
  pid: 'P-0413', series: 'pano', tool: 'pan', cmp: false, cmpLink: true, slice: 31, tab: {}, patientsLoaded: false, q: '',
  ai: { 'P-0398': 'error' }, aiFindings: true, toothNo: true, meas: {}, selLm: null, edited: new Set(),
  rot: { yaw: 0, pitch: 0.9, zoom: 1 }, reportType: 'doctor',
  boneAge: { v: 11.42, state: 'done' },
};
const PATIENTS = [
  { id: 'P-0413', sex: '남', by: 2015, last: '2026-09-02', n: 14, st: 'done', memo: '교정 상담 · 성장 추적' },
  { id: 'P-0421', sex: '여', by: 2016, last: '2026-10-28', n: 6, st: 'wait', memo: '초진' },
  { id: 'P-0398', sex: '여', by: 2013, last: '2026-10-27', n: 9, st: 'err', memo: '세팔로 재촬영 예정' },
  { id: 'P-0377', sex: '남', by: 2012, last: '2026-10-21', n: 22, st: 'done', memo: '장치 장착 6개월' },
  { id: 'P-0362', sex: '여', by: 2014, last: '2026-10-15', n: 11, st: 'done', memo: '' },
  { id: 'P-0350', sex: '남', by: 2017, last: '2026-10-09', n: 4, st: 'wait', memo: '보호자 설명 리포트 요청' },
  { id: 'P-0341', sex: '남', by: 2011, last: '2026-09-30', n: 18, st: 'done', memo: '3D 스캔 비교' },
  { id: 'P-0329', sex: '여', by: 2015, last: '2026-09-24', n: 8, st: 'done', memo: '' },
];
const ST = { done: ['ok', '분석 완료'], wait: ['warn', '분석 대기'], err: ['err', 'AI 오류'] };
const STUDIES = [
  { date: '2026-09-02', items: [['pano', '파노라마', 'DX · 1장'], ['lat', '세팔로 측모', 'DX · 1장'], ['pa', '세팔로 정모(PA)', 'DX · 1장'], ['cbct', 'CBCT 축면', 'CT · 64장'], ['photo', '임상 사진', '사진 · 12장'], ['scan', '3D 스캔', 'STL · 1개'], ['hand', '수완부', 'DX · 1장']] },
  { date: '2025-03-12', items: [['pano', '파노라마', 'DX · 1장'], ['lat', '세팔로 측모', 'DX · 1장'], ['hand', '수완부', 'DX · 1장']] },
];
const SERIES = [['pano', '파노라마'], ['lat', '세팔로 측모'], ['pa', '세팔로 정모'], ['cbct', 'CBCT 축면'], ['photo', '임상 사진'], ['scan', '3D 스캔']];
const MMPX = { pano: 0.1, lat: 0.24, pa: 0.12, cbct: 0.25 };

// 세팔로 랜드마크(가상, 이미지 좌표)
const LM_LAT = { S: [380, 300], N: [690, 255], A: [692, 490], B: [671, 655], Pog: [668, 715], Me: [640, 740], Gn: [660, 733], Go: [430, 655], Ar: [360, 430], Co: [368, 405], Po: [300, 360], Or: [640, 340], ANS: [712, 465], PNS: [530, 480], U1t: [705, 595], U1a: [668, 505], L1t: [698, 588], L1a: [655, 680], Ba: [330, 470], Pt: [405, 360], Prn: [805, 390], Sn: [765, 470], Ls: [772, 520], Li: [762, 590], "Pog'": [735, 715], "N'": [712, 248] };
const LM_NAME = { S: '셀라', N: '나지온', A: 'A점', B: 'B점', Pog: '포고니온', Me: '멘톤', Gn: '그나티온', Go: '고니온', Ar: '아티큘라레', Co: '콘딜리온', Po: '포리온', Or: '오비탈레', ANS: '전비극', PNS: '후비극', U1t: '상악 중절치 끝', U1a: '상악 중절치 뿌리끝', L1t: '하악 중절치 끝', L1a: '하악 중절치 뿌리끝', Ba: '바지온', Pt: '익상점', Prn: '코끝', Sn: '비하점', Ls: '윗입술', Li: '아랫입술', "Pog'": '연조직 턱끝', "N'": '연조직 나지온' };
const LM_PA = { ZaR: [170, 380], ZaL: [730, 384], OrR: [335, 318], OrL: [565, 322], GoR: [240, 600], GoL: [664, 606], ANS: [452, 500], Me: [456, 742] };
const LMN_PA = { ZaR: '관골궁(우)', ZaL: '관골궁(좌)', OrR: '안와(우)', OrL: '안와(좌)', GoR: '고니온(우)', GoL: '고니온(좌)', ANS: '전비극', Me: '멘톤' };
const clone = (o) => JSON.parse(JSON.stringify(o));
S.lm = { lat: clone(LM_LAT), pa: clone(LM_PA) };
// 계측 엔진(계산 유형 6종) — 기준값은 예시
const TYPES = { a3: '세 점 각도', al: '두 직선 각도', d: '두 점 거리', pl: '점-직선 거리', ratio: '비율', diff: '차이' };
const MEAS_LAT = [
  ['SNA', 'a3', '°', (L) => ang3(L.S, L.N, L.A), 82, 3.5],
  ['SNB', 'a3', '°', (L) => ang3(L.S, L.N, L.B), 80, 3],
  ['ANB', 'diff', '°', (L) => ang3(L.S, L.N, L.A) - ang3(L.S, L.N, L.B), 2, 2],
  ['FMA', 'al', '°', (L) => angLines(L.Po, L.Or, L.Go, L.Me), 25, 4.5],
  ['U1-SN', 'al', '°', (L) => angLines(L.U1a, L.U1t, L.N, L.S), 104, 6],
  ['IMPA', 'al', '°', (L) => angLines(L.L1a, L.L1t, L.Me, L.Go), 95, 6.5],
  ['하악각(Ar-Go-Me)', 'a3', '°', (L) => ang3(L.Ar, L.Go, L.Me), 123, 6],
  ['전안면 높이(N-Me)', 'd', 'mm', (L) => dist(L.N, L.Me) * MMPX.lat, 118, 6],
  ['하안면 비율(ANS-Me/N-Me)', 'ratio', '%', (L) => (dist(L.ANS, L.Me) / dist(L.N, L.Me)) * 100, 55, 2.5],
  ['윗입술-E라인', 'pl', 'mm', (L) => { const d = [L["Pog'"][0] - L.Prn[0], L["Pog'"][1] - L.Prn[1]], r = [L.Ls[0] - L.Prn[0], L.Ls[1] - L.Prn[1]]; return (-(d[0] * r[1] - d[1] * r[0]) / Math.hypot(...d)) * MMPX.lat; }, -2, 2],
];
const MEAS_PA = [
  ['안와 높이 좌우 차이', 'd', 'mm', (L) => Math.abs(L.OrR[1] - L.OrL[1]) * MMPX.pa, 0, 2],
  ['고니온 높이 좌우 차이', 'd', 'mm', (L) => Math.abs(L.GoR[1] - L.GoL[1]) * MMPX.pa, 0, 2],
  ['턱끝 정중선 편위', 'pl', 'mm', (L) => (L.Me[0] - (L.ZaR[0] + L.ZaL[0]) / 2) * MMPX.pa, 0, 2],
  ['관골궁 폭', 'd', 'mm', (L) => dist(L.ZaR, L.ZaL) * MMPX.pa, 66, 4],
];
const FINDINGS = [
  { id: 'f1', t: '치아 자동 번호', s: '31개 검출 · FDI 번호', c: null, box: null, col: '#7fb2ff' },
  { id: 'f2', t: '#35 뿌리끝 부위 어두운 영역', s: '확인 필요 · 가상 결과', c: 0.82, box: [790, 396, 82, 74], col: '#ffb020' },
  { id: 'f3', t: '#38 매복 의심', s: '가상 결과', c: 0.91, box: [985, 385, 112, 112], col: '#ff6b6b' },
];
const GROWTH = [{ d: '2024-03-04', age: 8.29, h: 128.4, w: 26.1 }, { d: '2024-12-02', age: 9.04, h: 132.9, w: 28.8 }, { d: '2025-09-01', age: 9.79, h: 137.6, w: 31.0 }, { d: '2026-09-02', age: 10.79, h: 143.1, w: 35.2 }];
const BIRTH = new Date('2015-11-17');
const AUDIT = [
  ['2026-10-30 09:12', 'kim.dr', '로그인', '-'], ['2026-10-30 09:14', 'kim.dr', '영상 조회', 'P-0413 · 파노라마'], ['2026-10-29 17:40', 'lee.res', '영상 업로드 + 환자 정보 제거', 'P-0421 · 세팔로 측모'],
  ['2026-10-29 17:41', 'system', 'AI 분석 완료', 'P-0421 · 세팔로 측모'], ['2026-10-29 16:02', 'park.admin', '권한 변경', 'lee.res: 리포트 출력 허용'], ['2026-10-28 11:20', 'kim.dr', '리포트 출력(의사용)', 'P-0377'],
];
const log = (act, target) => { AUDIT.unshift([now(), 'kim.dr', act, target]); const tb = document.querySelector('#audit tbody'); if (tb) { tb.innerHTML = auditRows(); const n = document.querySelector('#audit-n'); if (n) n.textContent = `최근 ${AUDIT.length}건 · 이 화면에서 한 일도 쌓입니다`; } };
const auditRows = () => AUDIT.slice(0, 14).map((a) => `<tr><td class="num wrap">${a[0]}</td><td class="mono">${a[1]}</td><td class="wrap">${a[2]}</td><td class="wrap">${esc(a[3])}</td></tr>`).join('');

// ---------------- 공통 ----------------
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3600); }
function route() { return (location.hash.replace(/^#\/?/, '').split('?')[0] || 'patients'); }
function setTitle(t) { document.title = `${t} · 모노덴트(가상) 화면 모형`; }
function ageOf(by) { return 2026 - by - 1; }
let cleanup = [];
function render() {
  cleanup.forEach((f) => f()); cleanup = [];
  const r = route();
  $$('#nav a').forEach((a) => { if (a.dataset.r === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const fn = { dashboard: renderDash, patients: renderPatients, viewer: renderViewer, growth: renderGrowth, report: renderReport, settings: renderSettings }[r] || renderPatients;
  fn();
}
window.addEventListener('hashchange', render);

// ---------------- 대시보드 ----------------
function renderDash() {
  setTitle('대시보드');
  const recent = [['P-0421', '세팔로 측모', '2026-10-28', 'wait'], ['P-0398', '파노라마', '2026-10-27', 'err'], ['P-0377', '파노라마', '2026-10-21', 'done'], ['P-0377', '세팔로 측모', '2026-10-21', 'done'], ['P-0362', '수완부 골연령', '2026-10-15', 'done']];
  const ver = [[1, 9.871, 9.871], [2, 11.203, 11.204], [3, 12.550, 12.550], [4, 8.914, 8.912], [5, 13.067, 13.067], [6, 10.433, 10.436], [7, 7.802, 7.802], [8, 14.118, 14.119], [9, 11.690, 11.690], [10, 9.245, 9.247]];
  $('#main').innerHTML = `<div class="page">
  <div class="ph"><div><h1>대시보드</h1><div class="sub">오늘 2026-10-30 · 가상 데이터</div></div></div>
  <div class="kpis">
    <div class="kpi"><div class="l">등록 환자(가명 ID)</div><div class="v num">128</div><div class="d">이번 달 +9</div></div>
    <div class="kpi"><div class="l">이번 주 업로드</div><div class="v num">37</div><div class="d">DICOM 21 · 사진 12 · 3D 4</div></div>
    <div class="kpi"><div class="l">AI 분석 대기</div><div class="v num">3</div><div class="d">평균 처리 40초(가상)</div></div>
    <div class="kpi"><div class="l">AI 오류</div><div class="v num" style="color:var(--danger)">1</div><div class="d">P-0398 · 재시도 필요</div></div>
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>최근 분석</h2><span class="meta">행을 누르면 뷰어로 이동</span></div>
      <div class="tw"><table class="t"><thead><tr><th>환자</th><th>영상</th><th>촬영일</th><th>상태</th></tr></thead><tbody>
      ${recent.map(([p, k, d, s]) => `<tr class="click" tabindex="0" data-p="${p}"><td class="mono">${p}</td><td>${k}</td><td class="num">${d}</td><td><span class="tag ${ST[s][0]}"><i></i>${ST[s][1]}</span></td></tr>`).join('')}
      </tbody></table></div></section>
    <section class="panel"><div class="panel-h"><h2>결과 일치 시험</h2><span class="meta">예시 화면 · 값은 가상</span></div>
      <div class="panel-b"><p class="note" style="margin:0 0 10px">계약 후 만들 자동 시험의 모습입니다. 같은 영상 10장을 발주처 원본 코드와 플랫폼에서 각각 돌려 골연령 차이가 0.01년 이내인지 매번 확인합니다.</p>
      <div class="tw"><table class="t"><thead><tr><th>영상</th><th class="r">원본 코드</th><th class="r">플랫폼</th><th class="r">차이</th><th>판정</th></tr></thead><tbody>
      ${ver.map(([i, a, b]) => { const d = Math.abs(a - b); return `<tr><td>시험 영상 ${i}</td><td class="r num">${a.toFixed(3)}</td><td class="r num">${b.toFixed(3)}</td><td class="r num">${d.toFixed(3)}</td><td><span class="tag ${d <= 0.01 ? 'ok' : 'err'}">${d <= 0.01 ? '통과' : '초과'}</span></td></tr>`; }).join('')}
      </tbody></table></div><p class="note" style="margin:10px 0 0">10장 중 10장 통과 · 허용 오차 0.01년</p></div></section>
  </div></div>`;
  $$('#main tr.click').forEach((tr) => { const go = () => { S.pid = tr.dataset.p; location.hash = '#/viewer'; }; tr.onclick = go; tr.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
}

// ---------------- 환자 관리 ----------------
function renderPatients() {
  setTitle('환자 관리');
  $('#main').innerHTML = `<div class="page">
  <div class="ph"><div><h1>환자 관리</h1><div class="sub">실명 없이 가명 ID로만 관리합니다</div></div>
    <div class="act"><button class="btn" id="p-up">${svg('up')}영상 업로드</button><button class="btn pri" id="p-new">환자 등록</button></div></div>
  <div class="grid2">
    <section class="panel">
      <div class="panel-h" style="gap:10px;flex-wrap:wrap"><label class="sr" for="p-q">가명 ID 또는 메모 검색</label>
        <input class="input" id="p-q" placeholder="가명 ID·메모 검색 (예: P-0413)" value="${esc(S.q)}" style="flex:1;min-width:180px">
        <select class="select" id="p-f" aria-label="상태 필터"><option value="">전체 상태</option><option value="done">분석 완료</option><option value="wait">분석 대기</option><option value="err">AI 오류</option></select></div>
      <div id="p-list"></div>
    </section>
    <section class="panel pd" id="p-detail"></section>
  </div></div>`;
  const list = () => {
    const box = $('#p-list');
    if (!S.patientsLoaded) { box.innerHTML = `<div class="panel-b" aria-busy="true" aria-label="환자 목록 불러오는 중">${Array.from({ length: 6 }, () => '<div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--line)"><div class="skel" style="width:70px"></div><div class="skel" style="flex:1"></div><div class="skel" style="width:60px"></div></div>').join('')}</div>`; return; }
    const q = S.q.trim().toLowerCase(), f = $('#p-f').value;
    const rows = PATIENTS.filter((p) => (!q || (p.id + ' ' + p.memo).toLowerCase().includes(q)) && (!f || p.st === f));
    if (!rows.length) { box.innerHTML = `<div class="state"><h3>찾는 환자가 없습니다</h3><p>'${esc(S.q)}'와 맞는 가명 ID나 메모가 없습니다.</p><button class="btn" id="p-clear">검색어 지우기</button></div>`; $('#p-clear').onclick = () => { S.q = ''; $('#p-q').value = ''; $('#p-f').value = ''; list(); }; return; }
    box.innerHTML = `<div class="tw"><table class="t"><thead><tr><th>가명 ID</th><th>성별·나이</th><th>최근 촬영</th><th class="r">영상</th><th>상태</th><th class="hide-m">메모</th></tr></thead><tbody>
      ${rows.map((p) => `<tr class="click ${p.id === S.pid ? 'sel' : ''}" tabindex="0" data-p="${p.id}" aria-selected="${p.id === S.pid}"><td class="mono">${p.id}</td><td>${p.sex} · 만 ${ageOf(p.by)}세</td><td class="num">${p.last}</td><td class="r num">${p.n}</td><td><span class="tag ${ST[p.st][0]}"><i></i>${ST[p.st][1]}</span></td><td class="hide-m" style="color:var(--text2)">${esc(p.memo || '-')}</td></tr>`).join('')}
    </tbody></table></div>`;
    $$('#p-list tr.click').forEach((tr) => { const sel = () => { S.pid = tr.dataset.p; list(); detail(); }; tr.onclick = sel; tr.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } }; });
  };
  const detail = () => {
    const p = PATIENTS.find((x) => x.id === S.pid) || PATIENTS[0];
    $('#p-detail').innerHTML = `<div class="panel-h"><h2 class="mono">${p.id}</h2><span class="tag ${ST[p.st][0]}"><i></i>${ST[p.st][1]}</span></div>
    <div class="panel-b"><dl><dt>성별·나이</dt><dd>${p.sex} · 만 ${ageOf(p.by)}세 (출생연도만 보관)</dd><dt>메모</dt><dd>${esc(p.memo || '-')}</dd><dt>영상</dt><dd>${p.n}건 · 촬영일별 보관</dd></dl>
    ${p.st === 'err' ? '<div class="callout err" style="margin-top:12px">최근 파노라마 AI 분석이 실패했습니다. 뷰어에서 다시 실행할 수 있습니다.</div>' : ''}
    <h3 style="font-size:13px;margin:16px 0 4px">촬영일별 영상</h3>
    ${STUDIES.map((s) => `<div style="margin-top:8px"><div class="note" style="font-weight:600;color:var(--text)">${s.date}</div><ul class="studies">${s.items.map(([k, n, m]) => `<li><span class="nm">${n}</span><span class="dt">${m}</span></li>`).join('')}</ul></div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><a class="btn pri" href="#/viewer" id="p-open">뷰어에서 열기</a><a class="btn" href="#/growth">성장 분석</a><a class="btn" href="#/report">리포트</a></div></div>`;
  };
  $('#p-q').oninput = (e) => { S.q = e.target.value; list(); };
  $('#p-f').onchange = list;
  $('#p-new').onclick = openNewPatient;
  $('#p-up').onclick = () => openUpload();
  list(); detail();
  if (!S.patientsLoaded) { const t = setTimeout(() => { S.patientsLoaded = true; if (route() === 'patients') list(); }, 700); cleanup.push(() => clearTimeout(t)); }
}

// ---------------- 모달 ----------------
let lastFocus = null;
function openModal(html, onOpen) {
  lastFocus = document.activeElement; $('#dlg').innerHTML = html; $('#modal').hidden = false;
  const close = () => { $('#modal').hidden = true; $('#dlg').innerHTML = ''; lastFocus && lastFocus.focus && lastFocus.focus(); };
  $$('#dlg [data-close]').forEach((b) => (b.onclick = close));
  $('#modal').onclick = (e) => { if (e.target.id === 'modal') close(); };
  $('#modal').onkeydown = (e) => { if (e.key === 'Escape') close();
    if (e.key === 'Tab') { const f = $$('#dlg button,#dlg input,#dlg select,#dlg a').filter((x) => !x.disabled && x.offsetParent); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } } };
  onOpen && onOpen(close);
  const first = $('#dlg input,#dlg select,#dlg button:not(.x)'); first && first.focus();
}
function openNewPatient() {
  const id = 'P-0' + (430 + PATIENTS.length);
  openModal(`<div class="dlg-h"><h2 id="dlg-title">환자 등록</h2><button class="btn ghost x" data-close aria-label="닫기">닫기</button></div>
  <div class="dlg-b"><div class="callout">실명·연락처·주민번호 칸은 두지 않습니다. 가명 ID는 자동으로 만들어집니다.</div>
  <div class="field"><label>가명 ID</label><input class="input mono" value="${id}" readonly aria-readonly="true"></div>
  <div class="form-row" style="grid-template-columns:1fr 1fr"><div class="field"><label for="n-sex">성별</label><select class="select" id="n-sex"><option>남</option><option>여</option></select></div>
  <div class="field"><label for="n-by">출생연도</label><input class="input" id="n-by" inputmode="numeric" placeholder="예: 2015" aria-describedby="n-by-err"><span class="err" id="n-by-err" role="alert"></span></div></div>
  <div class="field"><label for="n-memo">메모 (선택)</label><input class="input" id="n-memo" placeholder="예: 교정 상담"></div></div>
  <div class="dlg-f"><button class="btn" data-close>취소</button><button class="btn pri" id="n-save">등록</button></div>`, (close) => {
    $('#n-save').onclick = () => {
      const by = +$('#n-by').value;
      if (!(by >= 1930 && by <= 2026)) { $('#n-by').setAttribute('aria-invalid', 'true'); $('#n-by-err').textContent = '출생연도를 4자리 숫자로 입력해 주세요 (1930~2026).'; $('#n-by').focus(); return; }
      PATIENTS.unshift({ id, sex: $('#n-sex').value, by, last: '-', n: 0, st: 'wait', memo: $('#n-memo').value });
      S.pid = id; log('환자 등록', id); close(); toast(`${id} 등록했습니다 (화면 모형 · 저장되지 않음)`); renderPatients();
    };
  });
}
function openUpload() {
  openModal(`<div class="dlg-h"><h2 id="dlg-title">영상 업로드 · ${S.pid}</h2><button class="btn ghost x" data-close aria-label="닫기">닫기</button></div>
  <div class="dlg-b" id="u-body">
  <div class="form-row" style="grid-template-columns:1fr 1fr"><div class="field"><label for="u-kind">영상 종류</label><select class="select" id="u-kind"><option>파노라마</option><option>세팔로 측모</option><option>세팔로 정모(PA)</option><option>임상 사진</option><option>3D 스캔</option><option>수완부</option></select></div>
  <div class="field"><label for="u-date">촬영일</label><input class="input" type="date" id="u-date" value="2026-10-30"></div></div>
  <div class="drop"><p style="margin:0 0 10px">JPG·PNG·DICOM(.dcm) · 3D는 STL·PLY·OBJ</p>
    <label class="btn" for="u-file" style="display:inline-flex">파일 고르기</label><input type="file" id="u-file" class="sr" accept=".jpg,.jpeg,.png,.dcm,.stl,.ply,.obj">
    <button class="btn" id="u-sample" style="margin-left:6px">예시 DICOM으로 해 보기</button>
    <p class="note" style="margin:10px 0 0">화면 모형이라 파일 내용은 읽거나 보내지 않습니다. 파일 이름만 확인합니다.</p></div>
  <div id="u-out" aria-live="polite"></div></div>
  <div class="dlg-f"><button class="btn" data-close>닫기</button></div>`, () => {
    const run = (name) => {
      const ok = /\.(jpe?g|png|dcm|stl|ply|obj)$/i.test(name);
      if (!ok) { $('#u-out').innerHTML = `<div class="callout err"><b>${esc(name)}</b>은(는) 올릴 수 없는 형식입니다. JPG·PNG·DICOM·STL·PLY·OBJ만 받습니다. 그 밖의 3D 형식은 '보관만' 메뉴로 올려 주세요.</div>`; return; }
      const steps = ['파일 받기', 'DICOM 태그 읽기', '환자 정보 제거(비식별화)', '저장소에 저장 · 썸네일 만들기'];
      $('#u-out').innerHTML = `<ol class="steps" id="u-steps">${steps.map((s) => `<li><span class="dot"></span>${s}</li>`).join('')}</ol>`;
      let i = 0; const tick = () => { const li = $$('#u-steps li'); if (!li.length) return; li.forEach((x, j) => { x.className = j < i ? 'done' : j === i ? 'on' : ''; }); if (i < steps.length) { i++; setTimeout(tick, 380); } else done(); };
      const done = () => {
        $('#u-out').insertAdjacentHTML('beforeend', `<h3 style="font-size:13px;margin:12px 0 6px">제거된 환자 정보 (예시 값)</h3><div class="tw"><table class="t"><thead><tr><th>DICOM 태그</th><th>원래 값</th><th>처리</th></tr></thead><tbody>
          <tr><td class="mono">(0010,0010) 환자 이름</td><td>홍길동(가상)</td><td><span class="tag ok">삭제</span></td></tr>
          <tr><td class="mono">(0010,0020) 환자 번호</td><td>H-77120(가상)</td><td><span class="tag acc">${S.pid}로 교체</span></td></tr>
          <tr><td class="mono">(0010,0030) 생년월일</td><td>2015-11-17(가상)</td><td><span class="tag ok">연도만 남김</span></td></tr>
          <tr><td class="mono">(0008,0080) 기관 이름</td><td>예시치과(가상)</td><td><span class="tag ok">삭제</span></td></tr>
          <tr><td class="mono">(0008,0020) 촬영일</td><td>2026-10-30</td><td><span class="tag">유지(시점 비교용)</span></td></tr></tbody></table></div>`);
        log('영상 업로드 + 환자 정보 제거', `${S.pid} · ${$('#u-kind').value}`);
      };
      tick();
    };
    $('#u-file').onchange = (e) => e.target.files[0] && run(e.target.files[0].name);
    $('#u-sample').onclick = () => run('sample_pano_0413.dcm');
  });
}

// ---------------- 뷰어 ----------------
let VPS = [];
function renderViewer() {
  setTitle('영상 분석');
  const p = PATIENTS.find((x) => x.id === S.pid) || PATIENTS[0];
  if (S.ai[p.id] === undefined) S.ai[p.id] = 'done';
  const s = S.series;
  $('#main').innerHTML = `<div class="viewer">
  <div class="v-head"><span class="pt mono">${p.id}<small>${p.sex} · 만 ${ageOf(p.by)}세</small></span>
    <label class="sr" for="v-study">검사일</label><select class="select" id="v-study" style="min-height:36px"><option>2026-09-02 검사</option><option>2025-03-12 검사</option></select>
    <div class="act"><button class="btn sm" id="v-up">${svg('up')}영상 업로드</button><a class="btn sm" href="#/report">리포트 만들기</a></div></div>
  <aside class="thumbs" aria-label="영상 목록"><h3>2026-09-02</h3>${SERIES.map(([k, n]) => `<button class="th" data-s="${k}" aria-current="${k === s}"><canvas width="150" height="76" data-th="${k}" aria-hidden="true"></canvas><span class="n">${n}</span><span class="m">${{ pano: 'DX · 1장', lat: 'DX · 랜드마크 26', pa: 'DX · 랜드마크 8', cbct: 'CT · 64장', photo: '사진 · 9/11칸', scan: 'STL · 하악' }[k]}</span></button>`).join('')}</aside>
  <div class="center" id="v-center"></div>
  <aside class="right" aria-label="분석 결과" id="v-right"></aside></div>`;
  $$('.th').forEach((b) => (b.onclick = () => { S.series = b.dataset.s; S.tool = { lat: 'lm', pa: 'lm', cbct: 'wl' }[S.series] || 'pan'; if (S.series !== 'pano') S.cmp = false; S.selLm = null; renderViewer(); }));
  $('#v-up').onclick = () => openUpload();
  $('#v-study').onchange = (e) => { if (e.target.selectedIndex === 1) { toast('2025-03-12 검사는 비교 보기에서 함께 볼 수 있습니다'); S.series = 'pano'; S.cmp = true; e.target.selectedIndex = 0; renderViewer(); } };
  drawThumbs();
  if (s === 'photo') return renderPhotos();
  if (s === 'scan') return render3D();
  renderVPs();
}
function seriesImg(k, variant = 0) {
  const key = k + ':' + variant + ':' + (k === 'cbct' ? S.slice : '');
  CACHE[key] = CACHE[key] || ({ pano: () => IMG.pano(7, variant), lat: () => IMG.cephLat(LM_LAT), pa: () => IMG.cephPA(LM_PA), cbct: () => IMG.axial(S.slice), hand: () => IMG.hand() }[k])();
  return CACHE[key];
}
const CACHE = {};
function drawThumbs() {
  $$('canvas[data-th]').forEach((c) => {
    const k = c.dataset.th, x = c.getContext('2d'); x.fillStyle = '#0b0d10'; x.fillRect(0, 0, c.width, c.height);
    if (k === 'photo') { IMG.photo(x, 72, 76, 'mouth', 3); x.save(); x.translate(76, 0); IMG.photo(x, 74, 76, 'face', 4); x.restore(); return; }
    if (k === 'scan') { x.strokeStyle = '#9aa3ad'; x.lineWidth = 6; x.beginPath(); x.ellipse(75, 64, 46, 44, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); return; }
    const im = seriesImg(k), bmp = grayBitmap(im, 255, 128), sc = Math.min(c.width / im.w, c.height / im.h);
    x.drawImage(bmp, (c.width - im.w * sc) / 2, (c.height - im.h * sc) / 2, im.w * sc, im.h * sc);
  });
}
function grayBitmap(im, W, L, inv) {
  const c = document.createElement('canvas'); c.width = im.w; c.height = im.h;
  const x = c.getContext('2d'), d = x.createImageData(im.w, im.h), lut = new Uint8ClampedArray(256), lo = L - W / 2;
  for (let i = 0; i < 256; i++) { const v = ((i - lo) / W) * 255; lut[i] = inv ? 255 - v : v; }
  for (let i = 0, n = im.w * im.h; i < n; i++) { const v = lut[im.g[i]]; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
}

function toolbar(s) {
  const tools = [['pan', '이동'], ['zoom', '확대'], ['wl', '밝기·대비'], ['len', '거리'], ['ang', '각도']];
  if (s === 'lat' || s === 'pa') tools.push(['lm', '랜드마크']);
  return `<div class="tools" role="toolbar" aria-label="뷰어 도구">${tools.map(([k, n]) => `<button class="tool" data-t="${k}" aria-pressed="${S.tool === k}" title="${n}">${svg(k)}<span>${n}</span></button>`).join('')}
  <span class="div" aria-hidden="true"></span><button class="tool" id="t-inv" aria-pressed="${!!S.inv}">${svg('inv')}<span>반전</span></button><button class="tool" id="t-reset">${svg('reset')}<span>초기화</span></button>
  ${s === 'pano' ? `<span class="div" aria-hidden="true"></span><button class="tool" id="t-cmp" aria-pressed="${S.cmp}">${svg('cmp')}<span>시점 비교</span></button>` : ''}
  ${s === 'lat' || s === 'pa' ? `<span class="div" aria-hidden="true"></span><div class="seg" role="group" aria-label="측모·정모 전환" style="border-color:#3a414b"><button data-cv="lat" aria-pressed="${s === 'lat'}">측모</button><button data-cv="pa" aria-pressed="${s === 'pa'}">정모(PA)</button></div>` : ''}</div>`;
}
function renderVPs() {
  const s = S.series;
  const pairs = s === 'pano' && S.cmp ? [[0, '2026-09-02'], [1, '2025-03-12']] : [[0, s === 'cbct' ? '2026-09-02' : '2026-09-02']];
  $('#v-center').innerHTML = toolbar(s) + `<div class="vps ${pairs.length > 1 ? 'cmp' : ''}" id="vps">${pairs.map(([v, d], i) => `<div class="vp" tabindex="0" role="img" aria-label="${SERIES.find((x) => x[0] === s)[1]} ${d} 영상 모형. 방향키·+/-로 조작" data-i="${i}">
    <canvas></canvas><div class="ov tl"><b>${S.pid}</b><br>${SERIES.find((x) => x[0] === s)[1]}<br>${d}</div><div class="ov tr" data-o="wl"></div><div class="ov bl" data-o="tool"></div><div class="ov br" data-o="z"></div>
    ${s === 'cbct' ? `<div class="slice"><label class="sr" for="sl">슬라이스</label><input type="range" id="sl" min="0" max="63" value="${S.slice}" aria-valuetext="슬라이스 ${S.slice + 1} / 64"></div>` : ''}</div>`).join('')}</div>`;
  VPS = pairs.map(([variant], i) => ({ el: $$('#vps .vp')[i], variant, k: 1, px: 0, py: 0, W: s === 'cbct' ? 220 : 255, L: s === 'cbct' ? 120 : 128, draft: null }));
  $$('.tool[data-t]').forEach((b) => (b.onclick = () => { S.tool = b.dataset.t; $$('.tool[data-t]').forEach((x) => x.setAttribute('aria-pressed', x === b)); VPS.forEach(drawVP); }));
  $('#t-reset').onclick = () => { VPS.forEach((v) => { v.k = 1; v.px = v.py = 0; v.W = s === 'cbct' ? 220 : 255; v.L = s === 'cbct' ? 120 : 128; v.bmpKey = null; }); S.meas[s] = []; VPS.forEach(drawVP); renderRight(); };
  $('#t-inv').onclick = () => { S.inv = !S.inv; $('#t-inv').setAttribute('aria-pressed', S.inv); VPS.forEach((v) => { v.bmpKey = null; drawVP(v); }); };
  const cmp = $('#t-cmp'); if (cmp) cmp.onclick = () => { S.cmp = !S.cmp; renderViewer(); };
  $$('[data-cv]').forEach((b) => (b.onclick = () => { S.series = b.dataset.cv; S.selLm = null; renderViewer(); }));
  const sl = $('#sl'); if (sl) sl.oninput = () => setSlice(+sl.value);
  VPS.forEach(bindVP);
  const ro = new ResizeObserver(() => VPS.forEach(drawVP)); VPS.forEach((v) => ro.observe(v.el)); cleanup.push(() => ro.disconnect());
  renderRight();
  VPS.forEach(drawVP);
}
function setSlice(z) { S.slice = Math.max(0, Math.min(63, z)); const sl = $('#sl'); if (sl) { sl.value = S.slice; sl.setAttribute('aria-valuetext', `슬라이스 ${S.slice + 1} / 64`); } VPS.forEach((v) => { v.bmpKey = null; drawVP(v); }); }
function T(v) { return v.T; }
function drawVP(v) {
  const s = S.series, c = $('canvas', v.el), W = v.el.clientWidth, H = v.el.clientHeight; if (!W || !H) return;
  const dpr = window.devicePixelRatio || 1; if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#0b0d10'; x.fillRect(0, 0, W, H);
  const im = seriesImg(s, v.variant), key = [s, v.variant, S.slice, v.W, v.L, S.inv].join('|');
  if (v.bmpKey !== key) { v.bmp = grayBitmap(im, v.W, v.L, S.inv); v.bmpKey = key; }
  const fit = Math.min(W / im.w, H / im.h) * 0.96, sc = fit * v.k, x0 = (W - im.w * sc) / 2 + v.px, y0 = (H - im.h * sc) / 2 + v.py;
  v.T = { sc, x0, y0 };
  x.imageSmoothingQuality = 'high'; x.drawImage(v.bmp, x0, y0, im.w * sc, im.h * sc);
  const P = (p) => [x0 + p[0] * sc, y0 + p[1] * sc];
  // AI 결과 겹쳐 보기 (파노라마)
  if (s === 'pano' && S.ai[S.pid] === 'done') {
    if (S.toothNo && v.variant === 0 && sc > 0.45) { x.font = '600 11px Pretendard Variable, sans-serif'; x.textAlign = 'center';
      const up = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], lo = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
      for (let i = 0; i < 16; i++) { const t = (i + 0.5) / 16, k = (t - 0.5) * 2, px = 170 + t * 860;
        const a = P([px, 250 - k * k * 34 - 86]), b = P([px, 318 + k * k * 30 + 92]);
        x.fillStyle = 'rgba(127,178,255,.95)'; x.fillText(up[i], a[0], a[1]); if (i !== 15) x.fillText(lo[i], b[0], b[1] + 8); } }
    if (S.aiFindings && v.variant === 0) FINDINGS.filter((f) => f.box).forEach((f) => { const a = P([f.box[0], f.box[1]]); x.strokeStyle = f.col; x.lineWidth = 2; x.setLineDash([6, 4]); x.strokeRect(a[0], a[1], f.box[2] * sc, f.box[3] * sc); x.setLineDash([]);
      x.font = '600 12px Pretendard Variable, sans-serif'; x.textAlign = 'left'; const lbl = f.t.split(' ')[0] + ' ' + Math.round(f.c * 100) + '%'; const tw = x.measureText(lbl).width + 10; x.fillStyle = f.col; x.fillRect(a[0], a[1] - 20, tw, 18); x.fillStyle = '#0b0d10'; x.fillText(lbl, a[0] + 5, a[1] - 7); });
  }
  // 랜드마크
  if (s === 'lat' || s === 'pa') {
    const L = S.lm[s];
    if (s === 'lat') { x.strokeStyle = 'rgba(127,178,255,.55)'; x.lineWidth = 1.2; [['S', 'N'], ['N', 'A'], ['N', 'B'], ['Po', 'Or'], ['Go', 'Me'], ['U1a', 'U1t'], ['L1a', 'L1t'], ['Prn', "Pog'"]].forEach(([a, b]) => { const p = P(L[a]), q = P(L[b]); x.beginPath(); x.moveTo(...p); x.lineTo(...q); x.stroke(); }); }
    else { const m = P([(L.ZaR[0] + L.ZaL[0]) / 2, 100]), m2 = P([(L.ZaR[0] + L.ZaL[0]) / 2, 800]); x.strokeStyle = 'rgba(127,178,255,.55)'; x.setLineDash([5, 5]); x.beginPath(); x.moveTo(...m); x.lineTo(...m2); x.stroke(); x.setLineDash([]); }
    x.font = '600 11px Pretendard Variable, sans-serif'; x.textAlign = 'left';
    Object.entries(L).forEach(([k, p]) => { const q = P(p), sel = S.selLm === k, ed = S.edited.has(s + k);
      x.fillStyle = sel ? '#ffffff' : ed ? '#ffb020' : '#4d8dff'; x.beginPath(); x.arc(q[0], q[1], sel ? 6 : 4, 0, Math.PI * 2); x.fill();
      if (sel) { x.strokeStyle = '#4d8dff'; x.lineWidth = 2; x.beginPath(); x.arc(q[0], q[1], 11, 0, Math.PI * 2); x.stroke(); }
      x.fillStyle = sel ? '#fff' : 'rgba(220,228,240,.9)'; x.fillText(k, q[0] + 7, q[1] - 6); });
  }
  // 측정
  const mm = MMPX[s];
  const drawM = (m, draft) => { x.strokeStyle = draft ? '#ffd166' : '#ffd166'; x.fillStyle = '#ffd166'; x.lineWidth = 2; const ps = m.pts.map(P);
    x.beginPath(); x.moveTo(...ps[0]); ps.slice(1).forEach((p) => x.lineTo(...p)); x.stroke(); ps.forEach((p) => { x.beginPath(); x.arc(p[0], p[1], 3.5, 0, Math.PI * 2); x.fill(); });
    const val = mVal(m, mm); if (val) { const at = ps[m.type === 'ang' ? 1 : ps.length - 1]; x.font = '700 12.5px Pretendard Variable, sans-serif'; x.textAlign = 'left'; const tw = x.measureText(val).width + 10; x.fillStyle = 'rgba(11,13,16,.85)'; x.fillRect(at[0] + 8, at[1] - 10, tw, 20); x.fillStyle = '#ffd166'; x.fillText(val, at[0] + 13, at[1] + 4); } };
  if (v.variant === 0) (S.meas[s] || []).forEach((m) => drawM(m));
  if (v.draft) drawM(v.draft, true);
  $('[data-o="wl"]', v.el).innerHTML = `W ${Math.round(v.W)} · L ${Math.round(v.L)}${s === 'cbct' ? `<br><b>슬라이스 ${S.slice + 1} / 64</b>` : ''}`;
  $('[data-o="z"]', v.el).textContent = `확대 ${Math.round(v.k * 100)}% · ${mm} mm/px (가상 보정)`;
  $('[data-o="tool"]', v.el).textContent = { pan: '드래그: 이동', zoom: '위아래 드래그: 확대', wl: '드래그: 밝기(좌우)·대비(위아래)', len: '드래그: 거리 재기', ang: '세 번 클릭: 각도', lm: '점을 끌어 위치 수정' }[S.tool] + (s === 'cbct' ? ' · 휠: 슬라이스' : ' · 휠: 확대');
}
function mVal(m, mm) {
  if (m.type === 'len') return fmt(dist(m.pts[0], m.pts[1]) * mm) + ' mm';
  if (m.type === 'ang' && m.pts.length === 3) return fmt(ang3(m.pts[0], m.pts[1], m.pts[2])) + '°';
  return '';
}
function bindVP(v) {
  const c = $('canvas', v.el), s = S.series;
  const toImg = (e) => { const r = c.getBoundingClientRect(), t = v.T; return [(e.clientX - r.left - t.x0) / t.sc, (e.clientY - r.top - t.y0) / t.sc]; };
  const others = () => (S.cmpLink ? VPS : [v]);
  let drag = null;
  c.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; c.setPointerCapture(e.pointerId); v.el.focus({ preventScroll: true });
    const p = toImg(e), t = S.tool;
    drag = { sx: e.clientX, sy: e.clientY, k: v.k, px: v.px, py: v.py, W: v.W, L: v.L, t };
    if (t === 'len') v.draft = { type: 'len', pts: [p, p] };
    if (t === 'ang') { if (!v.draft) { v.draft = { type: 'ang', pts: [p, p] }; drag.created = true; } }
    if (t === 'lm') {
      const L = S.lm[s]; let best = null, bd = 16;
      Object.entries(L).forEach(([k, q]) => { const d = dist(q, p) * v.T.sc; if (d < bd) { bd = d; best = k; } });
      S.selLm = best; drag.lm = best; drawVP(v); renderRight();
    }
  });
  c.addEventListener('pointermove', (e) => {
    const p = toImg(e);
    if (v.draft && v.draft.type === 'ang' && !drag) { v.draft.pts[v.draft.pts.length - 1] = p; drawVP(v); return; }
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (drag.t === 'pan') others().forEach((o) => { o.px = drag.px + dx; o.py = drag.py + dy; drawVP(o); });
    if (drag.t === 'zoom') others().forEach((o) => { o.k = Math.max(0.3, Math.min(8, drag.k * Math.exp(-dy / 200))); drawVP(o); });
    if (drag.t === 'wl') { v.W = Math.max(10, Math.min(400, drag.W + dy)); v.L = Math.max(0, Math.min(255, drag.L - dx * 0.6)); drawVP(v); }
    if (drag.t === 'len' && v.draft) { v.draft.pts[1] = p; drawVP(v); }
    if (drag.t === 'ang' && v.draft) { v.draft.pts[v.draft.pts.length - 1] = p; drawVP(v); }
    if (drag.t === 'lm' && drag.lm) { S.lm[s][drag.lm] = [Math.round(p[0]), Math.round(p[1])]; drag.moved = true; drawVP(v); updateMeasTable(); }
  });
  const up = (e) => {
    if (!drag) return; const p = toImg(e);
    if (drag.t === 'len' && v.draft) { if (dist(v.draft.pts[0], v.draft.pts[1]) * v.T.sc > 4) { (S.meas[s] = S.meas[s] || []).push(v.draft); } v.draft = null; renderRight(); }
    if (drag.t === 'ang' && v.draft) { v.draft.pts[v.draft.pts.length - 1] = p; if (!drag.created) { if (v.draft.pts.length === 2) v.draft.pts.push(p); else { (S.meas[s] = S.meas[s] || []).push(v.draft); v.draft = null; renderRight(); } } }
    if (drag.t === 'lm' && drag.lm && drag.moved) { S.edited.add(s + drag.lm); log('랜드마크 수정', `${S.pid} · ${drag.lm}`); renderRight(); }
    drag = null; drawVP(v);
  };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { drag = null; });
  c.addEventListener('wheel', (e) => { e.preventDefault();
    if (s === 'cbct') return setSlice(S.slice + (e.deltaY > 0 ? 1 : -1));
    others().forEach((o) => { o.k = Math.max(0.3, Math.min(8, o.k * (e.deltaY > 0 ? 0.9 : 1.1))); drawVP(o); }); }, { passive: false });
  v.el.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'Escape' && v.draft) { v.draft = null; drawVP(v); return; }
    if (s === 'cbct' && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'PageUp' || k === 'PageDown')) { e.preventDefault(); return setSlice(S.slice + (k === 'ArrowUp' || k === 'PageUp' ? -1 : 1) * (k.startsWith('Page') ? 8 : 1)); }
    if ((s === 'lat' || s === 'pa') && S.selLm && k.startsWith('Arrow')) { e.preventDefault(); const q = S.lm[s][S.selLm], st = e.shiftKey ? 5 : 1;
      if (k === 'ArrowUp') q[1] -= st; if (k === 'ArrowDown') q[1] += st; if (k === 'ArrowLeft') q[0] -= st; if (k === 'ArrowRight') q[0] += st;
      S.edited.add(s + S.selLm); drawVP(v); updateMeasTable(); return; }
    if (k === '+' || k === '=') { others().forEach((o) => { o.k = Math.min(8, o.k * 1.15); drawVP(o); }); }
    if (k === '-') { others().forEach((o) => { o.k = Math.max(0.3, o.k / 1.15); drawVP(o); }); }
  });
}

// 오른쪽 패널
function renderRight() {
  const s = S.series, box = $('#v-right'); if (!box) return;
  const tabs = { pano: [['ai', 'AI 결과'], ['m', '측정']], lat: [['ceph', '랜드마크·계측표'], ['m', '측정']], pa: [['ceph', '계측표'], ['m', '측정']], cbct: [['m', '측정'], ['info', '영상 정보']] }[s];
  const cur = S.tab[s] && tabs.some((t) => t[0] === S.tab[s]) ? S.tab[s] : tabs[0][0];
  box.innerHTML = `<div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${k === cur}" data-tab="${k}" id="tab-${k}" aria-controls="rp">${n}</button>`).join('')}</div><div class="rp" id="rp" role="tabpanel" aria-labelledby="tab-${cur}"></div>`;
  $$('[data-tab]', box).forEach((b) => (b.onclick = () => { S.tab[s] = b.dataset.tab; renderRight(); }));
  const rp = $('#rp');
  if (cur === 'ai') {
    const st = S.ai[S.pid];
    if (st === 'loading') { rp.innerHTML = `<div aria-busy="true" aria-label="AI 분석 중"><h3>AI 분석 중</h3><p class="note">발주처 모델을 서버에서 실행하는 단계를 흉내 냅니다.</p>${[80, 60, 90, 70].map((w) => `<div class="skel" style="width:${w}%;margin:12px 0;height:14px"></div>`).join('')}</div>`; return; }
    if (st === 'error') { rp.innerHTML = `<div class="state err" style="padding:20px 4px"><h3>AI 분석이 끝나지 못했습니다</h3><p>전처리 단계 오류: 영상 크기가 모델 입력 조건과 다릅니다. (가상 오류)</p><button class="btn pri" id="ai-run">다시 실행</button><p class="note" style="margin-top:12px">실제 시스템에서는 오류 단계·원인과 원본 파일이 감사 로그에 남습니다.</p></div>`; $('#ai-run').onclick = runAI; return; }
    rp.innerHTML = `<h3>파노라마 AI 결과 <span class="tag acc" style="margin-left:4px">가상</span></h3>
      ${FINDINGS.map((f) => `<div class="find"><span class="sw" style="border-color:${f.col}"></span><span class="ft">${f.t}</span><span class="fc num">${f.c ? Math.round(f.c * 100) + '%' : ''}</span><span class="fs">${f.s}</span></div>`).join('')}
      <label class="chk"><input type="checkbox" id="ai-box" ${S.aiFindings ? 'checked' : ''}>영상에 결과 상자 표시</label>
      <label class="chk"><input type="checkbox" id="ai-no" ${S.toothNo ? 'checked' : ''}>치아 번호 표시</label>
      <div class="callout" style="margin-top:8px">결과는 진단이 아니라 의료진 판독을 돕는 표시입니다. 실제 모델·문구는 발주처 정의에 맞춥니다.</div>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="ai-run">AI 다시 실행</button><a class="btn" href="#/report">리포트에 넣기</a></div>
      <p class="note" style="margin-top:10px">모델 v0.0(가상) · 실행 2026-09-02 10:14 · 처리 38초</p>`;
    $('#ai-box').onchange = (e) => { S.aiFindings = e.target.checked; VPS.forEach(drawVP); };
    $('#ai-no').onchange = (e) => { S.toothNo = e.target.checked; VPS.forEach(drawVP); };
    $('#ai-run').onclick = runAI;
  } else if (cur === 'ceph') {
    const L = S.lm[s], names = s === 'lat' ? LM_NAME : LMN_PA;
    rp.innerHTML = `<h3>계측표 <span class="note" style="font-weight:500">기준값은 예시 · 계측 정의서로 교체</span></h3><div class="tw" id="mt"></div>
      <h3 style="display:flex;align-items:center">랜드마크 ${Object.keys(L).length}개 <span class="note" style="font-weight:500;margin-left:6px">AI 검출(가상) 후 수정</span></h3>
      <div class="lm-list">${Object.keys(L).map((k) => `<button class="lm" data-lm="${k}" aria-pressed="${S.selLm === k}" aria-label="${names[k]} (${k})${S.edited.has(s + k) ? ', 수정됨' : ''}"><span class="k">${k}</span><span style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${names[k]}</span>${S.edited.has(s + k) ? '<span class="e">수정</span>' : ''}</button>`).join('')}</div>
      <p class="note">점을 고른 뒤 영상에서 끌거나 방향키(Shift: 5px)로 옮깁니다.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="lm-reset">AI 위치로 되돌리기</button></div>`;
    $$('[data-lm]', rp).forEach((b) => (b.onclick = () => { S.selLm = b.dataset.lm; S.tool = 'lm'; $$('.tool[data-t]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.t === 'lm')); VPS.forEach(drawVP); renderRight(); const vp = VPS[0] && VPS[0].el; vp && vp.focus({ preventScroll: true }); }));
    $('#lm-reset').onclick = () => { S.lm[s] = clone(s === 'lat' ? LM_LAT : LM_PA); [...S.edited].filter((k) => k.startsWith(s)).forEach((k) => S.edited.delete(k)); log('랜드마크 AI 위치 복원', S.pid); VPS.forEach(drawVP); renderRight(); };
    updateMeasTable();
  } else if (cur === 'm') {
    const list = S.meas[s] || [];
    rp.innerHTML = `<h3>측정 ${list.length}개</h3>${list.length ? `<ul class="meas">${list.map((m, i) => `<li><span>${m.type === 'len' ? '거리' : '각도'} ${i + 1}</span><span class="v num">${mVal(m, MMPX[s])}</span><button class="btn sm ghost" data-del="${i}" aria-label="측정 ${i + 1} 지우기">지우기</button></li>`).join('')}</ul>` :
      `<div class="state" style="padding:20px 4px"><h3>아직 측정이 없습니다</h3><p>도구에서 '거리'나 '각도'를 고르고 영상 위에서 재 보세요.</p><button class="btn" id="m-len">거리 도구 고르기</button></div>`}
      <p class="note">거리는 가상 보정값(${MMPX[s]} mm/px)으로 계산합니다. 실제로는 DICOM 픽셀 간격 태그를 씁니다.</p>`;
    $$('[data-del]', rp).forEach((b) => (b.onclick = () => { list.splice(+b.dataset.del, 1); VPS.forEach(drawVP); renderRight(); }));
    const ml = $('#m-len'); if (ml) ml.onclick = () => { S.tool = 'len'; $$('.tool[data-t]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.t === 'len')); VPS.forEach(drawVP); };
  } else if (cur === 'info') {
    rp.innerHTML = `<h3>영상 정보 (가상)</h3><div class="pd"><dl><dt>모달리티</dt><dd>CT (CBCT)</dd><dt>슬라이스</dt><dd>64장 · 두께 0.25 mm</dd><dt>행렬</dt><dd>512 × 512</dd><dt>촬영일</dt><dd>2026-09-02</dd><dt>환자 정보</dt><dd>업로드 때 제거됨</dd></dl></div>
      <p class="note" style="margin-top:12px">휠·방향키·오른쪽 막대로 슬라이스를 넘깁니다. 공고 범위는 2D 슬라이스 조회까지로 보고, 3D 재구성(MPR)은 범위를 확인한 뒤 정합니다.</p>`;
  }
}
function updateMeasTable() {
  const s = S.series, box = $('#mt'); if (!box) return; const L = S.lm[s], defs = s === 'lat' ? MEAS_LAT : MEAS_PA;
  box.innerHTML = `<table class="t mt"><thead><tr><th>항목 · 계산 유형</th><th class="r">값</th><th class="r">기준(예시)</th></tr></thead><tbody>${defs.map(([n, ty, u, f, m, sd]) => { const val = f(L), out = Math.abs(val - m) > sd;
    return `<tr><td class="wrap"><span style="display:block">${n}</span><span class="note">${TYPES[ty]}</span></td><td class="r num ${out ? 'out' : ''}">${fmt(val)}${u}${out ? `<span class="note out-l">${val > m ? '기준보다 높음' : '기준보다 낮음'}</span>` : ''}</td><td class="r num" style="color:var(--text2)">${m}±${sd}</td></tr>`; }).join('')}</tbody></table>`;
}
function runAI() { S.ai[S.pid] = 'loading'; renderRight(); VPS.forEach(drawVP); const pid = S.pid; setTimeout(() => { S.ai[pid] = 'done'; const p = PATIENTS.find((x) => x.id === pid); if (p && p.st === 'err') p.st = 'done'; log('AI 분석 실행', pid + ' · 파노라마'); if (route() === 'viewer') { renderRight(); VPS.forEach(drawVP); } toast('AI 분석이 끝났습니다 (가상 결과)'); }, 1400); }

// 임상 사진
function renderPhotos() {
  const intra = ['정면 교합', '우측 교합', '좌측 교합', '상악 교합면', '하악 교합면', '전치부 수평피개', '전치부 수직피개'], face = ['정면', '정면 미소', '측면', '45도'];
  const empty = S.photoEmpty || (S.photoEmpty = new Set(['하악 교합면', '45도']));
  const extra = S.extra || (S.extra = [['모형 사진 1', '모형'], ['치근단 #36', '치근단'], ['교익 우측', '교익']]);
  const types = ['모형', '장치', '치근단', '교익', 'CBCT 캡처', 'TMJ'];
  const slot = (n, kind, i) => empty.has(n) ? `<div class="slot empty"><button data-fill="${n}" aria-label="${n} 칸에 사진 넣기">+ 사진 넣기</button><div class="cap"><span>${n}</span></div></div>` : `<div class="slot full"><canvas data-ph="${kind}" data-seed="${i}" data-view="${n}" aria-hidden="true"></canvas><div class="cap"><span>${n}</span><span>가상</span></div></div>`;
  $('#v-center').innerHTML = `<div class="photos"><div class="ph" style="margin-bottom:10px"><div><h1 style="font-size:16px">임상 사진 · 2026-09-02</h1><div class="sub">고정 칸 11개 · 추가 영상 ${extra.length}/20</div></div></div>
    <h3 style="font-size:13px;margin:0 0 8px">구내 7장</h3><div class="slots">${intra.map((n, i) => slot(n, 'mouth', i)).join('')}</div>
    <h3 style="font-size:13px;margin:16px 0 8px">안모 4장</h3><div class="slots">${face.map((n, i) => slot(n, 'face', i + 10)).join('')}</div>
    <p class="note">사진은 도형으로 그린 가상 이미지입니다.</p></div>`;
  $$('canvas[data-ph]').forEach((c) => { const r = c.getBoundingClientRect(); c.width = Math.max(100, r.width); c.height = Math.max(75, r.height); IMG.photo(c.getContext('2d'), c.width, c.height, c.dataset.ph, +c.dataset.seed + 1, c.dataset.view); });
  $$('[data-fill]').forEach((b) => (b.onclick = () => { empty.delete(b.dataset.fill); log('임상 사진 추가', `${S.pid} · ${b.dataset.fill}`); toast(`${b.dataset.fill} 칸에 넣었습니다 (화면 모형)`); renderPhotos(); }));
  $('#v-right').innerHTML = `<div class="tabs" role="tablist"><button role="tab" aria-selected="true">추가 영상 분류</button></div><div class="rp">
    <h3>추가 영상 ${extra.length}/20</h3><ul class="meas" id="ex">${extra.map(([n, t], i) => `<li><span style="flex:1">${esc(n)}</span><label class="sr" for="ex${i}">${esc(n)} 유형</label><select class="select" id="ex${i}" data-ex="${i}" style="min-height:36px">${types.map((x) => `<option ${x === t ? 'selected' : ''}>${x}</option>`).join('')}</select></li>`).join('')}</ul>
    <button class="btn" id="ex-add" style="margin-top:10px" ${extra.length >= 20 ? 'disabled' : ''}>추가 영상 넣기</button>
    <p class="note">유형: 모형·장치·치근단·교익·CBCT 캡처·TMJ. 20장을 넘으면 버튼이 꺼집니다.</p></div>`;
  $$('[data-ex]').forEach((s) => (s.onchange = () => { extra[+s.dataset.ex][1] = s.value; log('추가 영상 유형 변경', `${S.pid} · ${s.value}`); }));
  $('#ex-add').onclick = () => { if (extra.length >= 20) return; extra.push([`추가 영상 ${extra.length + 1}`, '장치']); renderPhotos(); };
}

// 3D 스캔
function render3D() {
  $('#v-center').innerHTML = `<div class="tools" role="toolbar" aria-label="3D 도구"><button class="tool" aria-pressed="true">${svg('pan')}<span>회전</span></button><button class="tool" id="r-reset">${svg('reset')}<span>초기화</span></button><span class="div"></span>
    <div class="seg" role="group" aria-label="보는 방향" style="border-color:#3a414b"><button data-vw="front">정면</button><button data-vw="top">교합면</button><button data-vw="side">측면</button></div></div>
    <div class="vps"><div class="vp" tabindex="0" role="img" aria-label="하악 3D 스캔 모형. 끌어서 회전, 휠로 확대, 방향키로 회전" id="v3"><canvas></canvas><div class="ov tl"><b>${S.pid}</b><br>3D 스캔 · 하악<br>2026-09-02</div><div class="ov br" id="v3z"></div><div class="ov bl">드래그: 회전 · 휠: 확대</div></div></div>`;
  $('#v-right').innerHTML = `<div class="tabs" role="tablist"><button role="tab" aria-selected="true">파일</button></div><div class="rp">
    <h3>3D 파일 (가상)</h3><ul class="meas"><li><span>lower_arch_0902.stl</span><span class="v">12.4 MB</span></li><li><span>upper_arch_0902.stl</span><span class="v">13.1 MB</span></li></ul>
    <h3>보관만 하는 형식</h3><ul class="meas"><li><span>bite_scan_0902.dcm3</span><button class="btn sm" id="dl3">내려받기</button></li></ul>
    <p class="note">STL·PLY·OBJ는 뷰어로 열고, 그 밖의 형식은 보관과 내려받기만 합니다. 실제 뷰어는 three.js로 만들고, 이 화면은 캔버스로 그린 단순 모형입니다.</p></div>`;
  $('#dl3').onclick = () => toast('화면 모형이라 파일을 내려받지 않습니다');
  const el = $('#v3'), c = $('canvas', el), mesh = buildArch();
  const draw = () => drawMesh(c, el, mesh);
  let d = null;
  c.addEventListener('pointerdown', (e) => { c.setPointerCapture(e.pointerId); d = { x: e.clientX, y: e.clientY, yaw: S.rot.yaw, pitch: S.rot.pitch }; });
  c.addEventListener('pointermove', (e) => { if (!d) return; S.rot.yaw = d.yaw + (e.clientX - d.x) / 120; S.rot.pitch = Math.max(-1.5, Math.min(1.5, d.pitch + (e.clientY - d.y) / 120)); draw(); });
  c.addEventListener('pointerup', () => (d = null));
  c.addEventListener('wheel', (e) => { e.preventDefault(); S.rot.zoom = Math.max(0.5, Math.min(3, S.rot.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); draw(); }, { passive: false });
  el.addEventListener('keydown', (e) => { const m = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key]; if (m) { e.preventDefault(); S.rot.yaw += m[0]; S.rot.pitch += m[1]; draw(); } });
  $('#r-reset').onclick = () => { S.rot = { yaw: 0, pitch: 0.9, zoom: 1 }; draw(); };
  $$('[data-vw]').forEach((b) => (b.onclick = () => { S.rot = { ...S.rot, ...{ front: { yaw: 0, pitch: 0.1 }, top: { yaw: 0, pitch: 1.5 }, side: { yaw: 1.4, pitch: 0.2 } }[b.dataset.vw] }; draw(); }));
  const ro = new ResizeObserver(draw); ro.observe(el); cleanup.push(() => ro.disconnect());
  draw();
}
function buildArch() {
  const quads = [], box = (cx, cy, cz, w, h, dp, a, col) => {
    const ca = Math.cos(a), sa = Math.sin(a), P = (x, y, z) => [cx + x * ca - z * sa, cy + y, cz + x * sa + z * ca];
    const v = [P(-w, 0, -dp), P(w, 0, -dp), P(w, 0, dp), P(-w, 0, dp), P(-w * 0.8, h, -dp * 0.8), P(w * 0.8, h, -dp * 0.8), P(w * 0.8, h, dp * 0.8), P(-w * 0.8, h, dp * 0.8)];
    [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].forEach((f) => quads.push({ v: f.map((i) => v[i]), col }));
  };
  const N = 28, R = (t) => [Math.sin(t) * 34, -Math.cos(t) * 30 + 12];
  for (let i = 0; i < N; i++) { // 잇몸 띠
    const t0 = -1.45 + (i / N) * 2.9, t1 = -1.45 + ((i + 1) / N) * 2.9, a = R(t0), b = R(t1), n0 = [Math.sin(t0), -Math.cos(t0)], n1 = [Math.sin(t1), -Math.cos(t1)], o = 6, inn = 5, y = 4;
    const O0 = [a[0] + n0[0] * o, a[1] + n0[1] * o], O1 = [b[0] + n1[0] * o, b[1] + n1[1] * o], I0 = [a[0] - n0[0] * inn, a[1] - n0[1] * inn], I1 = [b[0] - n1[0] * inn, b[1] - n1[1] * inn];
    const col = [176, 166, 154];
    quads.push({ v: [[O0[0], y, O0[1]], [O1[0], y, O1[1]], [I1[0], y, I1[1]], [I0[0], y, I0[1]]], col });
    quads.push({ v: [[O0[0], -2, O0[1]], [O1[0], -2, O1[1]], [O1[0], y, O1[1]], [O0[0], y, O0[1]]], col });
    quads.push({ v: [[I1[0], -2, I1[1]], [I0[0], -2, I0[1]], [I0[0], y, I0[1]], [I1[0], y, I1[1]]], col });
  }
  for (let i = 0; i < 14; i++) { const t = -1.38 + (i / 13) * 2.76, p = R(t), mid = Math.abs(i - 6.5), w = mid < 2 ? 2.6 : mid < 4 ? 3.2 : 4.6, h = mid < 2 ? 13 : mid < 4 ? 12 : 9.5, dp = mid < 2 ? 2.4 : mid < 4 ? 3.4 : 4.4; box(p[0], 4, p[1], w, h, dp, -t, [246, 243, 236]); }
  return quads;
}
function drawMesh(c, el, quads) {
  const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return; const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1e24'); bg.addColorStop(1, '#0b0d10'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const { yaw, pitch, zoom } = S.rot, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), sc = (Math.min(W, H) / 105) * zoom;
  const rot = ([px, py, pz]) => { py -= 4; const x1 = px * cy + pz * sy, z1 = -px * sy + pz * cy; const y2 = py * cp + z1 * sp, z2 = -py * sp + z1 * cp; return [x1, y2, z2]; };
  const L = [0.35, 0.75, -0.55], ll = Math.hypot(...L);
  const faces = quads.map((q) => { const v = q.v.map(rot); const a = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]], b = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
    let n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; const nl = Math.hypot(...n) || 1; n = n.map((k) => k / nl);
    return { v, z: v.reduce((s, p) => s + p[2], 0) / v.length, n, col: q.col }; });
  faces.sort((a, b) => b.z - a.z);
  faces.forEach((f) => { const lit = Math.abs((f.n[0] * L[0] + f.n[1] * L[1] + f.n[2] * L[2]) / ll), k = 0.32 + 0.68 * lit;
    x.fillStyle = `rgb(${f.col.map((cc) => Math.round(cc * k)).join(',')})`; x.strokeStyle = x.fillStyle; x.lineWidth = 0.6;
    x.beginPath(); f.v.forEach((p, i) => { const X = W / 2 + p[0] * sc, Y = H / 2 - p[1] * sc; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.fill(); x.stroke(); });
  const z = $('#v3z'); if (z) z.textContent = `확대 ${Math.round(zoom * 100)}% · 면 ${quads.length}개(모형)`;
}

// ---------------- 성장 분석 ----------------
function pct(age, z) { const m = 114 + 62 / (1 + Math.exp(-(age - 10.8) / 2.4)), sd = 4.5 + 0.25 * (age - 6); return m + z * sd; } // 예시 곡선(실제 성장도표 아님)
const ZS = [[-1.88, 'P3'], [-1.28, 'P10'], [-0.67, 'P25'], [0, 'P50'], [0.67, 'P75'], [1.28, 'P90'], [1.88, 'P97']];
function zOf(age, h) { const m = pct(age, 0), sd = pct(age, 1) - m; return (h - m) / sd; }
// 예상 성인키: 발주처 산식 자리. 지금은 '현재 백분위 유지 - 골연령이 앞선 만큼 보정'이라는 예시 계산
function predicted() { const last = GROWTH[GROWTH.length - 1], z = zOf(last.age, last.h) - (S.boneAge.v - last.age) * 0.35, mid = pct(18, z); return [mid - 3.2, mid + 3.2]; }
function chartSVG(small) {
  const W = 640, H = small ? 260 : 360, l = 44, r = 30, t = 16, b = 30, ax = (a) => l + ((a - 6) / 12) * (W - l - r), ay = (h) => t + (1 - (h - 100) / 95) * (H - t - b);
  let g = '';
  for (let h = 100; h <= 195; h += 10) g += `<line x1="${l}" x2="${W - r}" y1="${ay(h)}" y2="${ay(h)}" stroke="#eef0f3"/><text x="${l - 8}" y="${ay(h) + 4}" text-anchor="end">${h}</text>`;
  for (let a = 6; a <= 18; a += 2) g += `<text x="${ax(a)}" y="${H - 10}" text-anchor="middle">${a}세</text>`;
  ZS.forEach(([z, n]) => { let d = ''; for (let a = 6; a <= 18.001; a += 0.25) d += (d ? 'L' : 'M') + ax(a).toFixed(1) + ' ' + ay(pct(a, z)).toFixed(1); g += `<path d="${d}" fill="none" stroke="${z === 0 ? '#8a94a3' : '#cfd4db'}" stroke-width="${z === 0 ? 1.6 : 1}"/><text x="${W - r + 4}" y="${ay(pct(18, z)) + 4}" style="font-size:10px">${n}</text>`; });
  const pr = predicted(); g += `<rect x="${ax(17.6)}" y="${ay(pr[1])}" width="${ax(18) - ax(17.6)}" height="${ay(pr[0]) - ay(pr[1])}" fill="#0f62fe" opacity=".18"/>`;
  g += `<path d="${GROWTH.map((p, i) => (i ? 'L' : 'M') + ax(p.age) + ' ' + ay(p.h)).join('')}" fill="none" stroke="#0f62fe" stroke-width="2"/>`;
  g += GROWTH.map((p) => `<circle cx="${ax(p.age)}" cy="${ay(p.h)}" r="4.5" fill="#fff" stroke="#0f62fe" stroke-width="2"><title>${p.d} · ${p.h}cm</title></circle>`).join('');
  const ba = GROWTH[GROWTH.length - 1]; g += `<line x1="${ax(S.boneAge.v)}" x2="${ax(S.boneAge.v)}" y1="${ay(ba.h) - 14}" y2="${ay(ba.h) + 14}" stroke="#14171c" stroke-dasharray="3 3"/><text x="${ax(S.boneAge.v) + 4}" y="${ay(ba.h) - 16}" style="fill:#14171c;font-weight:600">골연령</text>`;
  return `<svg class="gchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="키 성장 곡선: 측정 ${GROWTH.length}회, 최근 ${ba.h}cm, 예시 백분위 곡선 위에 표시">${g}</svg>`;
}
function renderGrowth() {
  setTitle('성장 분석');
  const last = GROWTH[GROWTH.length - 1], pr = predicted(), z = zOf(last.age, last.h);
  const nearest = ZS.reduce((a, b) => (Math.abs(b[0] - z) < Math.abs(a[0] - z) ? b : a));
  $('#main').innerHTML = `<div class="page"><div class="ph"><div><h1>성장 분석 · <span class="mono">${S.pid}</span></h1><div class="sub">수완부 AI 골연령 + 키·몸무게 이력 · 모든 값 가상</div></div><div class="act"><a class="btn" href="#/report">리포트 만들기</a></div></div>
  <div class="grid2"><div class="stack">
    <section class="panel"><div class="panel-h"><h2>키 성장 곡선</h2><span class="meta">곡선은 예시 모양이며 실제 성장도표가 아닙니다</span></div><div class="panel-b">${chartSVG()}
      <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>측정일</th><th class="r">나이</th><th class="r">키(cm)</th><th class="r">몸무게(kg)</th></tr></thead><tbody>${GROWTH.slice().reverse().map((p) => `<tr><td class="num">${p.d}</td><td class="r num">${fmt(p.age, 2)}세</td><td class="r num">${fmt(p.h)}</td><td class="r num">${fmt(p.w)}</td></tr>`).join('')}</tbody></table></div></div></section>
    <section class="panel"><div class="panel-h"><h2>키·몸무게 입력</h2></div><div class="panel-b"><div class="form-row">
      <div class="field"><label for="g-d">측정일</label><input class="input" type="date" id="g-d" value="2026-10-30"><span class="err"></span></div>
      <div class="field"><label for="g-h">키 (cm)</label><input class="input" id="g-h" inputmode="decimal" placeholder="예: 144.0" aria-describedby="g-h-e"><span class="err" id="g-h-e" role="alert"></span></div>
      <div class="field"><label for="g-w">몸무게 (kg)</label><input class="input" id="g-w" inputmode="decimal" placeholder="예: 35.5" aria-describedby="g-w-e"><span class="err" id="g-w-e" role="alert"></span></div>
      <div class="field"><label>&nbsp;</label><button class="btn pri" id="g-add">추가</button></div></div></div></section>
  </div><div class="stack">
    <section class="panel"><div class="panel-h"><h2>AI 골연령</h2><span class="tag acc">가상</span></div><div class="panel-b" id="g-ba"></div></section>
    <section class="panel"><div class="panel-h"><h2>예상 성인키 범위</h2></div><div class="panel-b"><div class="big num">${fmt(pr[0])} ~ ${fmt(pr[1])} cm</div>
      <p class="note" style="margin:6px 0 0">현재 ${nearest[1]} 부근 · 발주처 산식이 들어갈 자리입니다. 지금 숫자는 예시 계산이며 의학적 예측이 아닙니다.</p></div></section>
  </div></div></div>`;
  const ba = () => { const b = $('#g-ba'); if (!b) return;
    if (S.boneAge.state === 'loading') { b.innerHTML = `<div aria-busy="true" aria-label="골연령 분석 중">${[70, 50, 85].map((w) => `<div class="skel" style="width:${w}%;margin:10px 0;height:14px"></div>`).join('')}</div>`; return; }
    b.innerHTML = `<div style="display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center"><canvas id="g-hand" width="420" height="520" style="width:120px;height:auto;border-radius:4px;background:#0b0d10" aria-label="수완부 영상 모형" role="img"></canvas>
      <div><div class="note">골연령</div><div class="big num">${fmt(S.boneAge.v, 2)}세</div><div class="note" style="margin-top:6px">역연령 ${fmt(last.age, 2)}세 · 차이 ${S.boneAge.v - last.age > 0 ? '+' : ''}${fmt(S.boneAge.v - last.age, 2)}년</div>
      <button class="btn sm" id="g-run" style="margin-top:10px">AI 다시 실행</button></div></div>`;
    const im = IMG.hand(), c = $('#g-hand'); c.getContext('2d').drawImage(grayBitmap(im, 255, 128), 0, 0);
    $('#g-run').onclick = () => { S.boneAge.state = 'loading'; ba(); setTimeout(() => { S.boneAge.state = 'done'; log('골연령 AI 실행', S.pid); if (route() === 'growth') ba(); toast('골연령 분석이 끝났습니다 (가상 결과)'); }, 1200); };
  };
  ba();
  $('#g-add').onclick = () => {
    const h = parseFloat($('#g-h').value), w = parseFloat($('#g-w').value), d = $('#g-d').value; let ok = true;
    const bad = (id, msg) => { $('#' + id).setAttribute('aria-invalid', 'true'); $('#' + id + '-e').textContent = msg; ok = false; };
    ['g-h', 'g-w'].forEach((id) => { $('#' + id).removeAttribute('aria-invalid'); $('#' + id + '-e').textContent = ''; });
    if (!(h >= 50 && h <= 230)) bad('g-h', '키는 50~230 사이 숫자로 입력해 주세요.');
    if (!(w >= 5 && w <= 200)) bad('g-w', '몸무게는 5~200 사이 숫자로 입력해 주세요.');
    if (!ok) { $('[aria-invalid="true"]').focus(); return; }
    const age = (new Date(d) - BIRTH) / (365.25 * 864e5);
    if (age <= GROWTH[GROWTH.length - 1].age) { bad('g-h', '마지막 측정일보다 뒤 날짜여야 합니다.'); return; }
    GROWTH.push({ d, age, h, w }); log('키·몸무게 입력', S.pid); toast('측정값을 추가했습니다 (화면 모형 · 저장되지 않음)'); renderGrowth();
  };
}

// ---------------- 리포트 ----------------
function renderReport() {
  setTitle('리포트');
  const p = PATIENTS.find((x) => x.id === S.pid) || PATIENTS[0], last = GROWTH[GROWTH.length - 1], pr = predicted(), L = S.lm.lat;
  const rows = MEAS_LAT.map(([n, ty, u, f, m, sd]) => { const v = f(L), out = Math.abs(v - m) > sd; return [n, fmt(v) + u, `${m}±${sd}`, out ? (v > m ? '높음' : '낮음') : '범위 안']; });
  const doctor = `<div class="paper" id="paper"><div class="hdr"><div><h2>영상 분석 리포트 · 의사용</h2><div class="note" style="margin-top:4px">모노덴트(가상) · 출력 ${now()}</div></div><div style="text-align:right"><div class="mono" style="font-weight:700">${p.id}</div><div class="note">${p.sex} · 만 ${ageOf(p.by)}세 · 촬영 2026-09-02</div><div class="wm">시제품 화면 모형 · 가상 데이터 · 진단용 아님</div></div></div>
    <h3>1. 파노라마 AI 결과</h3><table class="t"><thead><tr><th>항목</th><th>내용</th><th class="r">신뢰도</th></tr></thead><tbody>${FINDINGS.map((f) => `<tr><td>${f.t}</td><td>${f.s}</td><td class="r num">${f.c ? Math.round(f.c * 100) + '%' : '-'}</td></tr>`).join('')}</tbody></table>
    <h3>2. 세팔로 계측 (측모 · 랜드마크 ${Object.keys(L).length}개${S.edited.size ? ` · 수정 ${S.edited.size}개` : ''})</h3><table class="t"><thead><tr><th>항목</th><th class="r">값</th><th class="r">기준(예시)</th><th>판정</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="r num">${r[1]}</td><td class="r num">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>
    <h3>3. 성장 분석</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;font-size:13px"><div><div class="note">골연령(AI)</div><b class="num">${fmt(S.boneAge.v, 2)}세</b></div><div><div class="note">역연령</div><b class="num">${fmt(last.age, 2)}세</b></div><div><div class="note">예상 성인키(예시 산식)</div><b class="num">${fmt(pr[0])}~${fmt(pr[1])} cm</b></div></div>${chartSVG(true)}
    <h3>4. 판독 의견</h3><div style="border:1px solid var(--line);min-height:70px;border-radius:4px"></div><div style="display:flex;justify-content:flex-end;margin-top:20px;font-size:13px">판독 의사 ____________ (서명)</div></div>`;
  const guard = `<div class="paper guard" id="paper"><div class="hdr"><div><h2>우리 아이 치아·성장 설명서</h2><div class="note" style="margin-top:4px">보호자용 · ${now().slice(0, 10)}</div></div><div style="text-align:right"><div class="mono" style="font-weight:700">${p.id}</div><div class="wm">시제품 화면 모형 · 가상 데이터</div></div></div>
    <h3>이번 사진에서 본 것</h3><p>치아 사진(파노라마)에서 아래쪽 맨 안쪽 어금니 하나가 잇몸 속에 누워 있는 모습이 보였어요. 아래 작은 어금니 뿌리 쪽에도 한 번 더 살펴볼 곳이 있어요. 자세한 내용은 담당 선생님이 설명해 드려요.</p>
    <h3>얼굴뼈와 턱의 관계</h3><p>위턱과 아래턱의 앞뒤 관계는 대체로 평균 범위예요. 턱 모서리 각도가 평균보다 조금 커서, 다음 촬영 때 같이 비교해 볼 예정이에요.</p>
    <h3>키 성장</h3><p>지금 키는 ${fmt(last.h)}cm이고, 손 사진으로 본 뼈 나이는 ${fmt(S.boneAge.v, 1)}세예요. 실제 나이(${fmt(last.age, 1)}세)보다 뼈 나이가 조금 앞서 있어요.</p>${chartSVG(true)}
    <p class="note">이 설명서는 이해를 돕기 위한 자료이며 진단서가 아닙니다. 궁금한 점은 담당 선생님께 물어봐 주세요.</p></div>`;
  $('#main').innerHTML = `<div class="page"><div class="ph"><div><h1>리포트</h1><div class="sub">분석 결과로 PDF를 만듭니다. 계측표는 뷰어에서 고친 랜드마크를 그대로 반영합니다.</div></div>
    <div class="act"><div class="seg" role="group" aria-label="리포트 종류"><button data-rt="doctor" aria-pressed="${S.reportType === 'doctor'}">의사용</button><button data-rt="guard" aria-pressed="${S.reportType === 'guard'}">보호자용</button></div><button class="btn pri" id="r-pdf">PDF로 저장</button></div></div>
    <div class="report-wrap">${S.reportType === 'doctor' ? doctor : guard}</div></div>`;
  $$('[data-rt]').forEach((b) => (b.onclick = () => { S.reportType = b.dataset.rt; renderReport(); }));
  $('#r-pdf').onclick = () => { log(`리포트 출력(${S.reportType === 'doctor' ? '의사용' : '보호자용'})`, p.id); toast('화면 모형이라 PDF 파일은 만들지 않습니다. 계약 후 서버에서 PDF로 만듭니다.'); };
}

// ---------------- 설정 ----------------
function renderSettings() {
  setTitle('설정');
  const users = [['kim.dr', '김연구', '의사', '2026-10-30 09:12', '사용'], ['lee.res', '이연구', '연구원', '2026-10-29 17:38', '사용'], ['park.admin', '박관리', '관리자', '2026-10-29 16:00', '사용'], ['choi.res', '최연구', '연구원', '2026-08-11 10:02', '잠김']];
  const perms = S.perms || (S.perms = { 영상조회: [1, 1, 1], 영상업로드: [1, 1, 1], AI실행: [1, 1, 0], 랜드마크수정: [1, 1, 0], 리포트출력: [1, 1, 1], 계정관리: [1, 0, 0] });
  const roles = ['관리자', '의사', '연구원'];
  $('#main').innerHTML = `<div class="page"><div class="ph"><div><h1>설정</h1><div class="sub">계정·권한과 감사 로그 · 가상 계정</div></div></div>
  <div class="grid2"><div class="stack">
    <section class="panel"><div class="panel-h"><h2>계정</h2><span class="meta">비밀번호는 암호화해 저장(계약 후 구현)</span></div><div class="tw"><table class="t"><thead><tr><th>아이디</th><th>이름(가상)</th><th>역할</th><th>마지막 로그인</th><th>상태</th></tr></thead><tbody>${users.map((u) => `<tr><td class="mono">${u[0]}</td><td>${u[1]}</td><td>${u[2]}</td><td class="num">${u[3]}</td><td><span class="tag ${u[4] === '사용' ? 'ok' : 'warn'}">${u[4]}</span></td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-h"><h2>역할별 권한</h2></div><div class="tw"><table class="t perm"><thead><tr><th>기능</th>${roles.map((r) => `<th>${r}</th>`).join('')}</tr></thead><tbody>${Object.entries(perms).map(([k, v]) => `<tr><td>${{ 영상조회: '영상 조회', 영상업로드: '영상 업로드', AI실행: 'AI 실행', 랜드마크수정: '랜드마크 수정', 리포트출력: '리포트 출력', 계정관리: '계정 관리' }[k]}</td>${v.map((on, i) => `<td><input type="checkbox" data-pk="${k}" data-pi="${i}" ${on ? 'checked' : ''} ${i === 0 && k === '계정관리' ? 'disabled' : ''} aria-label="${roles[i]} ${k}"></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
  </div>
  <section class="panel"><div class="panel-h"><h2>감사 로그</h2><span class="meta" id="audit-n">최근 ${AUDIT.length}건 · 이 화면에서 한 일도 쌓입니다</span></div><div class="tw"><table class="t" id="audit"><thead><tr><th>시각</th><th>계정</th><th>동작</th><th>대상</th></tr></thead><tbody>${auditRows()}</tbody></table></div></section>
  </div></div>`;
  $$('[data-pk]').forEach((cb) => (cb.onchange = () => { perms[cb.dataset.pk][+cb.dataset.pi] = cb.checked ? 1 : 0; log('권한 변경', `${roles[+cb.dataset.pi]}: ${cb.dataset.pk} ${cb.checked ? '허용' : '해제'}`); }));
}

if (!location.hash) history.replaceState(null, '', '#/patients');
render();
})();
