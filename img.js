// 가상 영상 생성기 — 실제 환자 영상이 아니라 캔버스 도형 + 노이즈로 만든 모형이다.
// 각 함수는 { w, h, g: Uint8ClampedArray(회색값) } 를 돌려준다.
(function () {
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function toGray(c, seed, noise = 14, blur = 0) {
    const w = c.width, h = c.height;
    let src = c;
    if (blur) { const b = canvas(w, h), bx = b.getContext('2d'); bx.filter = `blur(${blur}px)`; bx.drawImage(c, 0, 0); src = b; }
    const d = src.getContext('2d').getImageData(0, 0, w, h).data, g = new Uint8ClampedArray(w * h), r = rng(seed);
    for (let i = 0; i < w * h; i++) g[i] = d[i * 4] + (r() - 0.5) * noise + (r() - 0.5) * noise * 0.6;
    return { w, h, g };
  }
  const gray = (v) => `rgb(${v},${v},${v})`;

  // 파노라마: 위아래 치열 + 하악 윤곽
  function pano(seed = 7, variant = 0) {
    const w = 1200, h = 560, c = canvas(w, h), x = c.getContext('2d'), r = rng(seed);
    const bgGrad = x.createRadialGradient(600, 300, 60, 600, 300, 620); bgGrad.addColorStop(0, gray(58)); bgGrad.addColorStop(1, gray(14));
    x.fillStyle = bgGrad; x.fillRect(0, 0, w, h);
    // 하악·상악 윤곽
    x.fillStyle = gray(82); x.beginPath(); x.moveTo(90, 120); x.quadraticCurveTo(600, 330, 1110, 120); x.lineTo(1120, 300); x.quadraticCurveTo(1080, 520, 600, 540); x.quadraticCurveTo(120, 520, 80, 300); x.closePath(); x.fill();
    x.strokeStyle = gray(150); x.lineWidth = 10; x.beginPath(); x.moveTo(110, 300); x.quadraticCurveTo(140, 515, 600, 528); x.quadraticCurveTo(1060, 515, 1090, 300); x.stroke();
    x.fillStyle = gray(70); x.beginPath(); x.ellipse(600, 120, 520, 60, 0, 0, Math.PI * 2); x.fill();
    // 치아
    const arc = (t, up) => { const xx = 170 + t * 860, y0 = up ? 250 : 318; const k = (t - 0.5) * 2; return [xx, y0 + (up ? -1 : 1) * 0 + k * k * (up ? -34 : 30)]; };
    for (const up of [true, false]) {
      for (let i = 0; i < 16; i++) {
        if (!up && i === 15 && variant === 0) continue; // 하악 우측 마지막 치아는 아래에 매복처럼 따로 그림
        const t = (i + 0.5) / 16, [cx, cy] = arc(t, up), mid = Math.abs(i - 7.5);
        const tw = mid < 2 ? 34 : mid < 4 ? 38 : 46, crown = mid < 4 ? 62 : 70, root = mid < 4 ? 92 : 78;
        const dir = up ? -1 : 1;
        x.fillStyle = gray(120 + Math.round(r() * 10));
        x.beginPath(); x.moveTo(cx - tw * 0.38, cy); x.quadraticCurveTo(cx, cy + dir * (root + 10), cx + tw * 0.38, cy); x.fill(); // 뿌리
        x.fillStyle = gray(212 + Math.round(r() * 20));
        x.beginPath(); x.roundRect(cx - tw / 2, up ? cy - 6 : cy - crown + 6, tw, crown, 10); x.fill(); // 머리
        x.fillStyle = gray(150); x.fillRect(cx - tw * 0.12, up ? cy - 2 : cy - crown + 18, tw * 0.24, crown * 0.5); // 치수강
      }
    }
    if (variant === 0) { // 매복된 듯한 치아(가상 소견용)
      x.save(); x.translate(1040, 440); x.rotate(-0.9); x.fillStyle = gray(200); x.beginPath(); x.roundRect(-30, -34, 60, 68, 12); x.fill(); x.restore();
      x.fillStyle = gray(40); x.beginPath(); x.ellipse(830, 432, 22, 18, 0, 0, Math.PI * 2); x.fill(); // 치근단 음영처럼
    } else {
      x.fillStyle = gray(52); x.beginPath(); x.ellipse(830, 432, 14, 11, 0, 0, Math.PI * 2); x.fill();
    }
    // 척추 그림자·혀 그림자
    x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(600, 286, 330, 20, 0, 0, Math.PI * 2); x.fill();
    return toGray(c, seed, 22, 1.4);
  }

  // 세팔로 측모: 랜드마크 좌표(L)에 맞춰 두개골 모형을 그림
  function cephLat(L, seed = 11) {
    const w = 1000, h = 820, c = canvas(w, h), x = c.getContext('2d');
    const P = (k) => L[k];
    x.fillStyle = gray(16); x.fillRect(0, 0, w, h);
    // 연조직(옆얼굴)
    x.fillStyle = gray(54); x.beginPath(); x.moveTo(40, 40);
    x.lineTo(700, 30); x.quadraticCurveTo(730, 150, P("N'")[0], P("N'")[1]);
    x.quadraticCurveTo(760, 300, P('Prn')[0], P('Prn')[1]); x.quadraticCurveTo(800, 440, P('Sn')[0], P('Sn')[1]);
    x.quadraticCurveTo(780, 490, P('Ls')[0], P('Ls')[1]); x.quadraticCurveTo(770, 550, 752, 556); x.quadraticCurveTo(772, 570, P('Li')[0], P('Li')[1]);
    x.quadraticCurveTo(745, 625, 728, 640); x.quadraticCurveTo(748, 690, P("Pog'")[0], P("Pog'")[1]); x.quadraticCurveTo(720, 780, 640, 790);
    x.lineTo(540, 820); x.lineTo(40, 820); x.closePath(); x.fill();
    // 두개골
    x.fillStyle = gray(76); x.strokeStyle = gray(178); x.lineWidth = 16;
    x.beginPath(); x.moveTo(P('N')[0], P('N')[1]); x.bezierCurveTo(740, 120, 640, 30, 420, 26); x.bezierCurveTo(200, 26, 70, 140, 74, 280);
    x.bezierCurveTo(78, 380, 150, 450, 260, 470); x.lineTo(P('Ba')[0], P('Ba')[1]); x.quadraticCurveTo(420, 380, P('S')[0] + 40, P('S')[1] + 10); x.lineTo(P('N')[0], P('N')[1]); x.closePath(); x.fill(); x.stroke();
    // 터키안장
    x.strokeStyle = gray(190); x.lineWidth = 6; x.beginPath(); x.arc(P('S')[0], P('S')[1] - 4, 22, 0.1 * Math.PI, 0.95 * Math.PI); x.stroke();
    // 안와·귀
    x.strokeStyle = gray(150); x.lineWidth = 5; x.beginPath(); x.ellipse(P('Or')[0] - 10, P('Or')[1] - 44, 44, 46, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(P('Po')[0] + 6, P('Po')[1] + 8, 16, 12, 0, 0, Math.PI * 2); x.stroke();
    // 상악
    x.fillStyle = gray(118); x.beginPath(); x.moveTo(P('PNS')[0], P('PNS')[1]); x.lineTo(P('ANS')[0], P('ANS')[1]); x.quadraticCurveTo(696, 478, P('A')[0], P('A')[1]);
    x.lineTo(P('U1t')[0] - 8, P('U1t')[1] - 20); x.lineTo(560, 560); x.closePath(); x.fill();
    x.fillStyle = gray(92); x.beginPath(); x.ellipse(600, 420, 70, 40, 0.2, 0, Math.PI * 2); x.fill(); // 상악동
    // 하악
    x.fillStyle = gray(128); x.strokeStyle = gray(196); x.lineWidth = 9;
    x.beginPath(); x.moveTo(P('Co')[0], P('Co')[1]); x.lineTo(P('Ar')[0] + 10, P('Ar')[1]); x.quadraticCurveTo(P('Go')[0] - 22, P('Go')[1] - 10, P('Go')[0] + 6, P('Go')[1] + 6);
    x.quadraticCurveTo(540, 720, P('Me')[0], P('Me')[1]); x.quadraticCurveTo(P('Gn')[0] + 8, P('Gn')[1], P('Pog')[0], P('Pog')[1]); x.quadraticCurveTo(P('B')[0] + 8, P('B')[1] + 20, P('B')[0], P('B')[1]);
    x.lineTo(P('L1t')[0] - 6, P('L1t')[1] + 18); x.lineTo(560, 610); x.quadraticCurveTo(470, 610, 450, 520); x.lineTo(480, 470); x.lineTo(430, 500); x.quadraticCurveTo(400, 440, P('Co')[0] + 14, P('Co')[1] - 4); x.closePath(); x.fill(); x.stroke();
    // 치아
    const tooth = (a, t, wid) => { const dx = t[0] - a[0], dy = t[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
      x.fillStyle = gray(222); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[0] + ux * len * 0.45 + nx * wid, a[1] + uy * len * 0.45 + ny * wid); x.lineTo(t[0] + nx * 3, t[1] + ny * 3); x.lineTo(t[0] - nx * 3, t[1] - ny * 3); x.lineTo(a[0] + ux * len * 0.45 - nx * wid, a[1] + uy * len * 0.45 - ny * wid); x.closePath(); x.fill(); };
    for (let i = 0; i < 4; i++) { x.fillStyle = gray(200 + i * 6); x.beginPath(); x.roundRect(560 + i * 28, 530, 26, 34, 6); x.fill(); x.beginPath(); x.roundRect(556 + i * 28, 570, 26, 34, 6); x.fill(); }
    tooth(P('U1a'), P('U1t'), 11); tooth(P('L1a'), P('L1t'), 9);
    // 경추
    for (let i = 0; i < 5; i++) { x.fillStyle = gray(112); x.beginPath(); x.roundRect(250 + i * 6, 520 + i * 58, 74, 44, 8); x.fill(); }
    return toGray(c, seed, 20, 1.6);
  }

  // 세팔로 정모(PA)
  function cephPA(L, seed = 13) {
    const w = 900, h = 820, c = canvas(w, h), x = c.getContext('2d');
    x.fillStyle = gray(14); x.fillRect(0, 0, w, h);
    x.fillStyle = gray(70); x.strokeStyle = gray(176); x.lineWidth = 16; x.beginPath(); x.ellipse(450, 330, 300, 300, 0, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = gray(40); x.strokeStyle = gray(160); x.lineWidth = 6;
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(450 + s * 115, 360, 70, 62, 0, 0, Math.PI * 2); x.fill(); x.stroke(); }
    x.fillStyle = gray(36); x.beginPath(); x.moveTo(450, 380); x.lineTo(400, 500); x.lineTo(500, 500); x.closePath(); x.fill();
    x.fillStyle = gray(126); x.strokeStyle = gray(196); x.lineWidth = 9;
    x.beginPath(); x.moveTo(L.ZaR[0], L.ZaR[1]); x.lineTo(L.GoR[0], L.GoR[1]); x.quadraticCurveTo(L.GoR[0] + 40, 720, L.Me[0], L.Me[1]); x.quadraticCurveTo(L.GoL[0] - 40, 720, L.GoL[0], L.GoL[1]); x.lineTo(L.ZaL[0], L.ZaL[1]); x.lineTo(600, 520); x.lineTo(300, 520); x.closePath(); x.fill(); x.stroke();
    for (let i = -5; i <= 5; i++) { x.fillStyle = gray(210 - Math.abs(i) * 6); x.beginPath(); x.roundRect(450 + i * 24 - 11, 540, 22, 40, 5); x.fill(); x.beginPath(); x.roundRect(450 + i * 22 - 10, 586, 20, 36, 5); x.fill(); }
    return toGray(c, seed, 20, 1.6);
  }

  // CBCT 축면 슬라이스 z(0~63)
  function axial(z, seed = 21) {
    const w = 512, h = 512, c = canvas(w, h), x = c.getContext('2d'), r = rng(seed + z * 31);
    x.fillStyle = gray(10); x.fillRect(0, 0, w, h);
    const f = z / 63, head = 196 + 30 * Math.sin(f * Math.PI);
    x.fillStyle = gray(52); x.beginPath(); x.ellipse(256, 270, head, head * 1.05, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = gray(150); x.lineWidth = 8; x.beginPath(); x.ellipse(256, 270, head - 14, head * 1.05 - 14, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
    // 치열 말발굽
    const toothR = Math.max(0, Math.sin(Math.min(1, Math.max(0, (f - 0.18) / 0.64)) * Math.PI)) * 17;
    x.strokeStyle = gray(118); x.lineWidth = 34; x.beginPath(); x.ellipse(256, 300, 132, 150, 0, Math.PI * 1.02, Math.PI * 1.98); x.stroke();
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * 1.06 + (i / 13) * Math.PI * 0.88, tx = 256 + Math.cos(a) * 132, ty = 300 + Math.sin(a) * 150;
      if (toothR > 1) { x.fillStyle = gray(205 + Math.round(r() * 30)); x.beginPath(); x.ellipse(tx, ty, toothR * (i > 4 && i < 9 ? 0.75 : 1.05), toothR * 0.9, a, 0, Math.PI * 2); x.fill();
        x.fillStyle = gray(120); x.beginPath(); x.arc(tx, ty, toothR * 0.28, 0, Math.PI * 2); x.fill(); }
    }
    x.fillStyle = gray(24); x.beginPath(); x.ellipse(256, 330, 60 + 20 * f, 40, 0, 0, Math.PI * 2); x.fill(); // 기도·혀 경계
    x.fillStyle = gray(140); x.beginPath(); x.ellipse(256, 420, 34, 26, 0, 0, Math.PI * 2); x.fill(); // 척추
    return toGray(c, seed + z, 26, 1.2);
  }

  // 수완부(손목) 모형
  function hand(seed = 31) {
    const w = 420, h = 520, c = canvas(w, h), x = c.getContext('2d');
    x.fillStyle = gray(12); x.fillRect(0, 0, w, h);
    x.fillStyle = gray(46); x.beginPath(); x.ellipse(210, 330, 130, 170, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = gray(150);
    x.fillRect(150, 440, 46, 90); x.fillRect(214, 446, 40, 84); // 요골·척골
    for (let i = 0; i < 8; i++) { x.beginPath(); x.ellipse(160 + (i % 4) * 30, 400 + Math.floor(i / 4) * 30, 13, 12, 0, 0, Math.PI * 2); x.fill(); }
    for (let f = 0; f < 5; f++) {
      const bx = 112 + f * 48, ang = (f - 2) * 0.12 - (f === 0 ? 0.5 : 0);
      x.save(); x.translate(bx, 370); x.rotate(ang);
      let y = 0; [70, 44, 30, 22].slice(0, f === 0 ? 3 : 4).forEach((len) => { y -= len + 6; x.fillStyle = gray(165); x.beginPath(); x.roundRect(-9, y, 18, len, 6); x.fill(); });
      x.restore();
    }
    return toGray(c, seed, 18, 1.2);
  }

  // 임상 사진 자리 표시(가상): 칸마다 구도가 다른 단순 도형 (view: 칸 이름)
  function photo(ctx, w, h, kind, seed, view = '') {
    const r = rng(seed);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const H = h * 0.78; // 아래 캡션 띠를 피해 위쪽에 그림
    const tooth = (x, y, tw, th, rad = 3) => { ctx.fillStyle = `rgb(${236 - r() * 14},${229 - r() * 14},${214 - r() * 12})`; ctx.beginPath(); ctx.roundRect(x, y, tw, th, rad); ctx.fill(); };
    if (kind === 'face') {
      g.addColorStop(0, '#dfe3e8'); g.addColorStop(1, '#c9cfd6'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = H * 0.5, rx = Math.min(w * 0.17, H * 0.3), ry = H * 0.4;
      ctx.fillStyle = '#9b8d82'; ctx.fillRect(cx - rx * 0.45, cy + ry * 0.7, rx * 0.9, h);
      ctx.fillStyle = '#4a3c35';
      if (view === '측면') {
        ctx.beginPath(); ctx.ellipse(cx - rx * 0.15, cy, rx * 0.95, ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b3a59a'; ctx.beginPath();
        ctx.moveTo(cx - rx * 0.2, cy - ry); ctx.quadraticCurveTo(cx + rx * 0.7, cy - ry * 0.9, cx + rx * 0.75, cy - ry * 0.2);
        ctx.lineTo(cx + rx * 1.05, cy + ry * 0.08); ctx.lineTo(cx + rx * 0.78, cy + ry * 0.2);
        ctx.quadraticCurveTo(cx + rx * 0.85, cy + ry * 0.45, cx + rx * 0.7, cy + ry * 0.55);
        ctx.quadraticCurveTo(cx + rx * 0.72, cy + ry * 0.85, cx + rx * 0.3, cy + ry * 0.95);
        ctx.quadraticCurveTo(cx - rx * 0.4, cy + ry, cx - rx * 0.5, cy + ry * 0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4a3c35'; ctx.beginPath(); ctx.ellipse(cx - rx * 0.55, cy - ry * 0.25, rx * 0.55, ry * 0.75, 0, Math.PI * 0.6, Math.PI * 1.7); ctx.fill();
        ctx.fillStyle = '#5b4d45'; ctx.fillRect(cx + rx * 0.35, cy - ry * 0.25, rx * 0.2, 2);
        return;
      }
      const turn = view === '45도' ? rx * 0.25 : 0;
      ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.12, rx * 1.12, ry * 0.98, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b3a59a'; ctx.beginPath(); ctx.ellipse(cx + turn * 0.3, cy, rx * (turn ? 0.88 : 1), ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a3c35'; ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.72, rx * 1.02, ry * 0.32, 0, Math.PI, Math.PI * 2); ctx.fill();
      const ex = rx * 0.38, ey = cy - ry * 0.12;
      ctx.fillStyle = '#3c302b'; [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.ellipse(cx + turn + sd * ex * (sd < 0 && turn ? 0.75 : 1), ey, rx * 0.11, ry * 0.035, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = '#8f7f74'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx + turn, ey + ry * 0.08); ctx.lineTo(cx + turn * 1.3, cy + ry * 0.28); ctx.stroke();
      if (view === '정면 미소') {
        ctx.fillStyle = '#7a3e3e'; ctx.beginPath(); ctx.ellipse(cx + turn, cy + ry * 0.5, rx * 0.4, ry * 0.11, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#efe9dd'; ctx.fillRect(cx + turn - rx * 0.32, cy + ry * 0.5, rx * 0.64, ry * 0.05);
      } else { ctx.strokeStyle = '#7a5a52'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + turn - rx * 0.28, cy + ry * 0.52); ctx.lineTo(cx + turn + rx * 0.28, cy + ry * 0.52); ctx.stroke(); }
      return;
    }
    // 구내
    g.addColorStop(0, '#5a3a3a'); g.addColorStop(1, '#3a2222'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = H * 0.52;
    if (view === '상악 교합면' || view === '하악 교합면') {
      // 거울 촬영: 아치(U자) 모양
      ctx.fillStyle = '#b86d6d'; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.36, H * 0.46, 0, 0, Math.PI * 2); ctx.fill();
      const up = view === '상악 교합면';
      ctx.fillStyle = up ? '#c98585' : '#a85f5f'; ctx.beginPath(); ctx.ellipse(cx, cy + (up ? 4 : -4), w * 0.16, H * 0.24, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 14; i++) {
        const t = Math.PI * (0.08 + 0.84 * i / 13), sgn = up ? -1 : 1;
        const x = cx - Math.cos(t) * w * 0.25, y = cy + sgn * (Math.sin(t) * H * 0.33 - H * 0.12);
        const sz = (i < 3 || i > 10) ? 1.35 : (i > 4 && i < 9 ? 0.75 : 1);
        tooth(x - w * 0.025 * sz, y - H * 0.04 * sz, w * 0.05 * sz, H * 0.08 * sz, 4);
      }
      return;
    }
    const side = view === '우측 교합' ? -1 : view === '좌측 교합' ? 1 : 0;
    // 입술 견인기 + 잇몸
    ctx.fillStyle = '#c47a78'; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.46, H * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,225,230,.55)'; ctx.fillRect(0, cy - H * 0.44, w * 0.06, H * 0.9); ctx.fillRect(w * 0.94, cy - H * 0.44, w * 0.06, H * 0.9);
    if (view === '전치부 수평피개' || view === '전치부 수직피개') {
      // 확대된 앞니 4개 (상악이 하악을 덮는 정도)
      const over = view === '전치부 수직피개';
      for (let i = 0; i < 4; i++) tooth(cx - w * 0.3 + i * w * 0.15, cy - H * 0.3, w * 0.135, H * (over ? 0.42 : 0.34), 6);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(cx - w * 0.32, cy + H * (over ? 0.1 : 0.04), w * 0.64, 2);
      for (let i = 0; i < 4; i++) tooth(cx - w * 0.27 + i * w * 0.135 + (over ? 0 : w * 0.02), cy + H * (over ? 0.05 : 0.06), w * 0.12, H * 0.26, 5);
      if (!over) { ctx.strokeStyle = '#f3d36b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - w * 0.33, cy + H * 0.04); ctx.lineTo(cx - w * 0.33, cy + H * 0.16); ctx.stroke(); }
      return;
    }
    // 정면/측방 교합: 측방은 원근(한쪽 큰 어금니)
    const n = 8;
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) / ((n - 1) / 2); // -1..1
      const pers = side ? 1 + side * u * 0.45 : 1 - Math.abs(u) * 0.25;
      const tw = w * 0.085 * pers, th = H * (row ? 0.14 : 0.17) * pers;
      const x = cx + u * w * 0.36 - tw / 2 + side * w * 0.04;
      const y = row ? cy + H * 0.02 : cy - th - H * 0.01;
      tooth(x, y, tw, th, 4);
    }
  }

  window.IMG = { pano, cephLat, cephPA, axial, hand, photo, rng };
})();
