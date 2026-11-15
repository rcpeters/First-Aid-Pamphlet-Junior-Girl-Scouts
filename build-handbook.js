// ============================================================================
//  Girl Scout Junior First Aid Handbook - MASTER SOURCE FILE
//  Edit the text in this file, then rebuild the PDF by running:
//      node build-handbook.js
//  Output: Junior-First-Aid-Handbook.pdf (16 half-letter pages, 5.5" x 8.5")
//  Print with your PDF viewer's "Booklet" setting on 8.5" x 11" paper.
//
//  Text markup inside strings:
//    **bold**     {{red bold warning}}     @@green bold@@     *italic*
//    \n starts a new line inside a paragraph
// ============================================================================
const fs = require('fs');
const path = require('path');

const PW = 396, PH = 612, M = 24;          // page size in points, side margin
const CONTENT_BOTTOM = PH - 34;             // nothing may go below this line
const OUT = path.join(__dirname, 'Junior-First-Aid-Handbook.pdf');

const FS = 10, LH = 12.8;                   // body font size / line height

const GREEN = [0.0, 0.478, 0.20], DKGREEN = [0.0, 0.38, 0.16];
const RED = [0.776, 0.157, 0.157], DKRED = [0.72, 0.11, 0.11];
const AMBER = [0.70, 0.42, 0.0], DKAMBER = [0.55, 0.32, 0.0];
const INK = [0.1, 0.1, 0.1], GRAY = [0.35, 0.35, 0.35], WHITE = [1, 1, 1];
const SKIN = [0.96, 0.84, 0.72];
const TINT = {
  white: { bg: WHITE, border: [0.18, 0.24, 0.21], title: INK, marker: GREEN, lw: 1.3 },
  green: { bg: [0.953, 0.976, 0.961], border: GREEN, title: DKGREEN, marker: GREEN, lw: 1.3 },
  red:   { bg: [1.0, 0.961, 0.961], border: RED, title: DKRED, marker: RED, lw: 1.8 },
  amber: { bg: [1.0, 0.99, 0.94], border: AMBER, title: DKAMBER, marker: AMBER, lw: 1.3 },
};

const warnings = [];

// ---------- Helvetica metrics (1/1000 em) ----------
const W_REG = {' ':278,'!':278,'"':355,'#':556,'$':556,'%':889,'&':667,'\'':191,'(':333,')':333,'*':389,'+':584,',':278,'-':333,'.':278,'/':278,'0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,'8':556,'9':556,':':278,';':278,'<':584,'=':584,'>':584,'?':556,'@':1015,'A':667,'B':667,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,'I':278,'J':500,'K':667,'L':556,'M':833,'N':722,'O':778,'P':667,'Q':778,'R':722,'S':667,'T':611,'U':722,'V':667,'W':944,'X':667,'Y':667,'Z':611,'[':278,']':278,'_':556,'a':556,'b':556,'c':500,'d':556,'e':556,'f':278,'g':556,'h':556,'i':222,'j':222,'k':500,'l':222,'m':833,'n':556,'o':556,'p':556,'q':556,'r':333,'s':500,'t':278,'u':556,'v':500,'w':722,'x':500,'y':500,'z':500,'—':1000,'–':556,'•':350,'\x95':350,'’':222,'‘':222,'“':333,'”':333,'»':556};
const W_BOLD = {' ':278,'!':333,'"':474,'#':556,'$':556,'%':889,'&':722,'\'':238,'(':333,')':333,'*':389,'+':584,',':278,'-':333,'.':278,'/':278,'0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,'8':556,'9':556,':':333,';':333,'<':584,'=':584,'>':584,'?':611,'@':975,'A':722,'B':722,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,'I':278,'J':556,'K':722,'L':611,'M':833,'N':722,'O':778,'P':667,'Q':778,'R':722,'S':667,'T':611,'U':722,'V':667,'W':944,'X':667,'Y':667,'Z':611,'[':333,']':333,'_':556,'a':556,'b':611,'c':556,'d':611,'e':556,'f':333,'g':611,'h':611,'i':278,'j':278,'k':556,'l':278,'m':889,'n':611,'o':611,'p':611,'q':611,'r':389,'s':556,'t':333,'u':611,'v':556,'w':778,'x':556,'y':556,'z':500,'—':1000,'–':556,'•':350,'\x95':350,'’':278,'‘':278,'“':500,'”':500,'»':556};
function measure(str, size, bold) {
  const t = bold ? W_BOLD : W_REG; let w = 0;
  for (const ch of str) w += (t[ch] !== undefined ? t[ch] : 600) * size / 1000;
  return w;
}
function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    .replace(/—/g, '\x97').replace(/–/g, '\x96').replace(/•/g, '\x95')
    .replace(/’/g, '\x92').replace(/‘/g, '\x91').replace(/“/g, '\x93').replace(/”/g, '\x94');
}

// ---------- rich text ----------
function tokenize(text) {
  const out = [], re = /(\*\*[^*]+\*\*|\{\{[^}]+\}\}|@@[^@]+@@|\*[^*]+\*)/g;
  let last = 0, m;
  const push = (s, font, color, bold) => {
    for (const p of s.split(/(\s+)/)) if (p) out.push({ text: p, font, color, bold, space: /^\s+$/.test(p) });
  };
  while ((m = re.exec(text))) {
    if (m.index > last) push(text.slice(last, m.index), 'F1', INK, false);
    const s = m[0];
    if (s.startsWith('**')) push(s.slice(2, -2), 'F2', [0.05, 0.05, 0.05], true);
    else if (s.startsWith('{{')) push(s.slice(2, -2), 'F2', DKRED, true);
    else if (s.startsWith('@@')) push(s.slice(2, -2), 'F2', DKGREEN, true);
    else push(s.slice(1, -1), 'F3', [0.15, 0.15, 0.15], false);
    last = re.lastIndex;
  }
  if (last < text.length) push(text.slice(last), 'F1', INK, false);
  return out;
}
function wrap(text, maxW, size) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = [], w = 0;
    for (const t of tokenize(para)) {
      if (t.space) { if (line.length) { const sw = measure(' ', size, t.bold); line.push({ ...t, text: ' ', w: sw }); w += sw; } continue; }
      const tw = measure(t.text, size, t.bold);
      if (w + tw > maxW && line.length) {
        while (line.length && line[line.length - 1].space) line.pop();
        lines.push(line); line = []; w = 0;
      }
      line.push({ ...t, w: tw }); w += tw;
      if (tw > maxW) warnings.push(`Word too wide: "${t.text}"`);
    }
    while (line.length && line[line.length - 1].space) line.pop();
    lines.push(line);
  }
  return lines;
}

// ---------- page canvas ----------
class Page {
  constructor(num) { this.num = num; this.ops = []; this.bottom = 0; this.inFooter = false; }
  y(t) { return (PH - t).toFixed(2); }
  track(b) { if (!this.inFooter) this.bottom = Math.max(this.bottom, b); }
  fill(c) { this.ops.push(`${c.map(v => v.toFixed(3)).join(' ')} rg`); }
  stroke(c, lw) { this.ops.push(`${c.map(v => v.toFixed(3)).join(' ')} RG ${lw.toFixed(2)} w`); }
  paint(f, s) { return f && s ? 'B' : f ? 'f' : 'S'; }
  rect(x, t, w, h, f, s, lw = 1) {
    this.track(t + h);
    this.ops.push('q'); if (f) this.fill(f); if (s) this.stroke(s, lw);
    this.ops.push(`${x.toFixed(2)} ${this.y(t + h)} ${w.toFixed(2)} ${h.toFixed(2)} re ${this.paint(f, s)} Q`);
  }
  rrect(x, t, w, h, r, f, s, lw = 1.2) {
    this.track(t + h);
    const x0 = x, x1 = x + w, y0 = PH - t - h, y1 = PH - t, k = 0.5523 * r, F = v => v.toFixed(2);
    this.ops.push('q'); if (f) this.fill(f); if (s) this.stroke(s, lw);
    this.ops.push([`${F(x0 + r)} ${F(y0)} m`, `${F(x1 - r)} ${F(y0)} l`,
      `${F(x1 - r + k)} ${F(y0)} ${F(x1)} ${F(y0 + r - k)} ${F(x1)} ${F(y0 + r)} c`, `${F(x1)} ${F(y1 - r)} l`,
      `${F(x1)} ${F(y1 - r + k)} ${F(x1 - r + k)} ${F(y1)} ${F(x1 - r)} ${F(y1)} c`, `${F(x0 + r)} ${F(y1)} l`,
      `${F(x0 + r - k)} ${F(y1)} ${F(x0)} ${F(y1 - r + k)} ${F(x0)} ${F(y1 - r)} c`, `${F(x0)} ${F(y0 + r)} l`,
      `${F(x0)} ${F(y0 + r - k)} ${F(x0 + r - k)} ${F(y0)} ${F(x0 + r)} ${F(y0)} c h ${this.paint(f, s)} Q`].join(' '));
  }
  ellipse(cx, cy, rx, ry, f, s, lw = 1.2) {
    this.track(cy + ry);
    const k = 0.5523, X = cx, Y = PH - cy, F = v => v.toFixed(2);
    this.ops.push('q'); if (f) this.fill(f); if (s) this.stroke(s, lw);
    this.ops.push([`${F(X + rx)} ${F(Y)} m`,
      `${F(X + rx)} ${F(Y + ry * k)} ${F(X + rx * k)} ${F(Y + ry)} ${F(X)} ${F(Y + ry)} c`,
      `${F(X - rx * k)} ${F(Y + ry)} ${F(X - rx)} ${F(Y + ry * k)} ${F(X - rx)} ${F(Y)} c`,
      `${F(X - rx)} ${F(Y - ry * k)} ${F(X - rx * k)} ${F(Y - ry)} ${F(X)} ${F(Y - ry)} c`,
      `${F(X + rx * k)} ${F(Y - ry)} ${F(X + rx)} ${F(Y - ry * k)} ${F(X + rx)} ${F(Y)} c h ${this.paint(f, s)} Q`].join(' '));
  }
  circle(cx, cy, r, f, s, lw) { this.ellipse(cx, cy, r, r, f, s, lw); }
  poly(pts, f, s, lw = 1.5, close = true) {
    pts.forEach(p => this.track(p[1]));
    this.ops.push('q 1 J 1 j'); if (f) this.fill(f); if (s) this.stroke(s, lw);
    const d = pts.map((p, i) => `${p[0].toFixed(2)} ${this.y(p[1])} ${i ? 'l' : 'm'}`).join(' ');
    this.ops.push(`${d} ${close ? 'h ' : ''}${close ? this.paint(f, s) : 'S'} Q`);
  }
  limb(pts, c = INK, lw = 3.5) { this.poly(pts, null, c, lw, false); }
  line(x1, t1, x2, t2, c = GRAY, lw = 1) { this.limb([[x1, t1], [x2, t2]], c, lw); }
  text(s, x, t, size = FS, font = 'F1', color = INK, align = 'left', maxW = null) {
    const w = measure(s, size, font === 'F2');
    let tx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    if (maxW && w > maxW) warnings.push(`p${this.num}: text too wide (${w.toFixed(0)} > ${maxW.toFixed(0)}): "${s}"`);
    if (!this.inFooter && (tx < M - 6 || tx + w > PW - M + 6)) warnings.push(`p${this.num}: text off page: "${s}"`);
    this.track(t + 3);
    this.ops.push(`q ${color.map(v => v.toFixed(3)).join(' ')} rg BT /${font} ${size.toFixed(2)} Tf ${tx.toFixed(2)} ${this.y(t)} Td (${esc(s)}) Tj ET Q`);
  }
  para(str, x, t, maxW, size = FS, lh = LH) {
    let cy = t;
    for (const line of wrap(str, maxW, size)) {
      const runs = [];
      for (const tk of line) {
        const r = runs[runs.length - 1];
        if (r && (tk.space || (r.font === tk.font && r.color === tk.color))) r.text += tk.text;
        else runs.push({ text: tk.text, font: tk.font, color: tk.color, bold: tk.bold });
      }
      let cx = x;
      for (const r of runs) { this.text(r.text, cx, cy, size, r.font, r.color); cx += measure(r.text, size, r.bold); }
      cy += lh;
    }
    return cy;
  }
  paraH(str, maxW, size = FS, lh = LH) { return wrap(str, maxW, size).length * lh; }

  header(title, opts = {}) {
    if (typeof opts === 'boolean') opts = { red: opts };
    const { y = 16, red = false, tag = null } = opts;
    const c = red ? RED : GREEN;
    const titleCol = red ? DKRED : DKGREEN;
    this.rrect(M, y, 7, 17, 2, c, null);
    let tagW = 0;
    if (tag) {
      tagW = measure(tag, 7.6, true) + 10;
      this.rrect(PW - M - tagW, y + 2, tagW, 13, 3, WHITE, c, 0.9);
      this.text(tag, PW - M - tagW / 2, y + 11.2, 7.6, 'F2', titleCol, 'center');
    }
    this.text(title, M + 13, y + 13.5, 14, 'F2', INK, 'left', PW - 2 * M - 13 - (tag ? tagW + 8 : 0));
    this.line(M, y + 21, PW - M, y + 21, c, 2.0);
    return y + 28;
  }
  footer(section) {
    this.inFooter = true;
    this.line(M, PH - 28, PW - M, PH - 28, [0.78, 0.82, 0.79], 1);
    this.text(section, M, PH - 15, 8, 'F2', GRAY);
    this.rrect(PW - 70, PH - 24, 46, 14, 6, [0.94, 0.97, 0.95], GREEN, 1.2);
    this.text(`Page ${this.num}`, PW - 47, PH - 14, 8, 'F2', DKGREEN, 'center');
    this.inFooter = false;
  }
  // Card with optional title bar and numbered/bulleted items. Returns bottom y.
  card(o) {
    const { x = M, y, w = PW - 2 * M, title = null, tag, tint = 'white', items = [], numbered = true,
      intro = null, rightSpace = 0, fs = FS, lh = LH, minH = 0, dry = false } = o;
    const T = TINT[tint], textW = w - 18 - rightSpace, itemW = textW - 14;
    let h = title ? 26 : 11;
    if (intro) h += this.paraH(intro, textW, fs, lh) + 3;
    for (const it of items) h += this.paraH(it, itemW, fs, lh) + 3;
    h = Math.max(h + 4, minH);
    if (dry) return h;
    this.rrect(x, y, w, h, 6, T.bg, T.border, T.lw);
    let cy = y + 16;
    if (title) {
      let tagW = 0;
      if (tag) {
        tagW = measure(tag, 7.6, true) + 10;
        this.rrect(x + w - tagW - 8, y + 5, tagW, 13, 3, WHITE, T.border, 0.9);
        this.text(tag, x + w - tagW / 2 - 8, y + 14.2, 7.6, 'F2', T.title, 'center');
      }
      this.text(title, x + 9, y + 15.5, 10.8, 'F2', T.title, 'left', w - 18 - (tag ? tagW + 8 : 0));
      this.line(x + 8, y + 21, x + w - 8, y + 21, [0.80, 0.84, 0.81], 0.8);
      cy = y + 34;
    }
    if (intro) cy = this.para(intro, x + 9, cy, textW, fs, lh) + 3;
    items.forEach((it, i) => {
      if (numbered) this.text(`${i + 1}.`, x + 9, cy, fs, 'F2', T.marker);
      else this.text('\x95', x + 11, cy, fs + 1, 'F2', T.marker);
      cy = this.para(it, x + 23, cy, itemW, fs, lh) + 3;
    });
    return y + h;
  }
  // Two cards side by side with equal heights. Returns bottom y.
  cards2(y, a, b, gap = 8) {
    const w = (PW - 2 * M - gap) / 2;
    const A = { ...a, x: M, y, w }, B = { ...b, x: M + w + gap, y, w };
    const h = Math.max(this.card({ ...A, dry: true }), this.card({ ...B, dry: true }));
    this.card({ ...A, minH: h }); this.card({ ...B, minH: h });
    return y + h;
  }
  // Simple shaded note box. Returns bottom y.
  note(y, text, tint = 'green', size = FS, lh = LH) {
    const T = TINT[tint], w = PW - 2 * M;
    const h = this.paraH(text, w - 20, size, lh) + 13;
    this.rrect(M, y, w, h, 6, T.bg, T.border, T.lw);
    this.para(text, M + 10, y + 16, w - 20, size, lh);
    return y + h;
  }
}

// ---------- pictures ----------
function figFrame(p, x, y, w, h, tint) { const T = TINT[tint]; p.rrect(x, y, w, h, 6, T.bg, T.border, 1.2); }

function figRecovery(p, x, y) {       // 112 x 80
  figFrame(p, x, y, 112, 80, 'green');
  p.text('Recovery Position', x + 56, y + 13, 8.2, 'F2', DKGREEN, 'center');
  p.line(x + 8, y + 64, x + 104, y + 64, GRAY, 1.2);
  p.circle(x + 20, y + 47, 7.5, WHITE, INK, 1.8);                       // head
  p.limb([[x + 29, y + 50], [x + 66, y + 52]], GREEN, 7);                // body
  p.limb([[x + 33, y + 50], [x + 27, y + 58], [x + 17, y + 57]], INK, 3); // top hand under cheek
  p.limb([[x + 35, y + 53], [x + 42, y + 61]], INK, 3);                  // lower arm
  p.limb([[x + 66, y + 52], [x + 80, y + 61], [x + 92, y + 58]], INK, 3.5); // bent top knee
  p.limb([[x + 66, y + 53], [x + 100, y + 55]], INK, 3.5);               // straight leg
  p.text('On side, top knee bent', x + 56, y + 75, 7.2, 'F1', INK, 'center');
}
function figBackBlows(p, x, y, w) {   // w x 112
  figFrame(p, x, y, w, 112, 'red');
  const o = x + (w - 120) / 2;
  p.text('1. 5 BACK BLOWS', x + w / 2, y + 13, 8.6, 'F2', DKRED, 'center');
  // rescuer (green)
  p.circle(o + 38, y + 30, 7, WHITE, GREEN, 2);
  p.limb([[o + 38, y + 38], [o + 40, y + 72]], GREEN, 4);
  p.limb([[o + 40, y + 72], [o + 33, y + 98]], GREEN, 3.5);
  p.limb([[o + 40, y + 72], [o + 48, y + 98]], GREEN, 3.5);
  p.limb([[o + 39, y + 46], [o + 60, y + 46], [o + 78, y + 55]], GREEN, 3); // arm to back
  // choking person bent forward (ink)
  p.limb([[o + 72, y + 70], [o + 66, y + 98]], INK, 3.5);
  p.limb([[o + 72, y + 70], [o + 80, y + 98]], INK, 3.5);
  p.limb([[o + 72, y + 70], [o + 100, y + 56]], INK, 4.5);
  p.circle(o + 108, y + 52, 7, WHITE, INK, 2);
  p.circle(o + 80, y + 56, 3.5, RED, null);                              // heel of hand
  p.limb([[o + 76, y + 40], [o + 79, y + 47]], RED, 1.6);
  p.limb([[o + 84, y + 39], [o + 84, y + 47]], RED, 1.6);
  p.text('between the shoulder blades', x + w / 2, y + 107, 7.2, 'F1', INK, 'center');
}
function figThrusts(p, x, y, w) {     // w x 112
  figFrame(p, x, y, w, 112, 'red');
  const o = x + (w - 120) / 2;
  p.text('2. 5 ABDOMINAL THRUSTS', x + w / 2, y + 13, 8.6, 'F2', DKRED, 'center');
  // rescuer behind (green)
  p.circle(o + 50, y + 29, 7, WHITE, GREEN, 2);
  p.limb([[o + 50, y + 37], [o + 50, y + 72]], GREEN, 4);
  p.limb([[o + 50, y + 72], [o + 44, y + 98]], GREEN, 3.5);
  p.limb([[o + 50, y + 72], [o + 57, y + 98]], GREEN, 3.5);
  // person in front (ink)
  p.circle(o + 72, y + 30, 7, WHITE, INK, 2);
  p.limb([[o + 72, y + 38], [o + 72, y + 72]], INK, 4.5);
  p.limb([[o + 72, y + 72], [o + 66, y + 98]], INK, 3.5);
  p.limb([[o + 72, y + 72], [o + 79, y + 98]], INK, 3.5);
  p.limb([[o + 51, y + 45], [o + 62, y + 58], [o + 74, y + 60]], GREEN, 3); // arms around
  p.circle(o + 76, y + 60, 4.2, RED, null);                               // fist
  p.limb([[o + 92, y + 72], [o + 92, y + 52]], RED, 2.2);                 // up arrow
  p.poly([[o + 87.5, y + 54], [o + 96.5, y + 54], [o + 92, y + 46]], RED, null);
  p.text('fist above bellybutton, in & up', x + w / 2, y + 107, 7.2, 'F1', INK, 'center');
}
function figBaby(p, x, y) {           // 112 x 92
  figFrame(p, x, y, 112, 92, 'red');
  p.text('5 BACK BLOWS', x + 56, y + 13, 8.4, 'F2', DKRED, 'center');
  p.limb([[x + 12, y + 46], [x + 92, y + 64]], INK, 11);                  // forearm outline
  p.limb([[x + 12, y + 46], [x + 92, y + 64]], SKIN, 8.5);
  p.ellipse(x + 50, y + 46, 24, 8, WHITE, INK, 1.6);                      // baby body
  p.circle(x + 82, y + 53, 8.5, WHITE, INK, 1.6);                         // baby head (low)
  p.circle(x + 63, y + 35, 3.5, RED, null);                               // hand (between shoulder blades)
  p.limb([[x + 57, y + 25], [x + 60, y + 31]], RED, 1.6);
  p.limb([[x + 67, y + 24], [x + 66, y + 31]], RED, 1.6);
  p.text('face-down, head lower', x + 56, y + 79, 7.2, 'F1', INK, 'center');
  p.text('than chest', x + 56, y + 87, 7.2, 'F1', INK, 'center');
}
function figNose(p, x, y) {           // 64 x 76
  figFrame(p, x, y, 64, 76, 'green');
  p.circle(x + 28, y + 34, 15, WHITE, INK, 1.8);
  p.poly([[x + 42, y + 31], [x + 50, y + 40], [x + 41, y + 41]], WHITE, INK, 1.5);
  p.circle(x + 47, y + 39, 3, RED, null);
  p.limb([[x + 50, y + 18], [x + 55, y + 28]], GREEN, 2);
  p.poly([[x + 51.5, y + 28], [x + 58.5, y + 26], [x + 57, y + 33]], GREEN, null);
  p.text('LEAN FORWARD', x + 32, y + 61, 7, 'F2', DKGREEN, 'center');
  p.text('pinch 10–15 min', x + 32, y + 70, 6.8, 'F1', INK, 'center');
}
function figPhone(p, x, y) {          // 44 x 76
  p.rrect(x, y, 44, 76, 7, WHITE, INK, 2.2);
  p.rect(x + 5, y + 9, 34, 52, [1, 0.96, 0.96], RED, 1.2);
  p.text('9-1-1', x + 22, y + 39, 12, 'F2', RED, 'center');
  p.circle(x + 22, y + 68, 3, null, INK, 1.5);
}
function figBandage(p, x, y) {        // 54 x 38
  p.rrect(x, y + 8, 52, 22, 9, SKIN, INK, 1.6);
  p.rrect(x + 17, y + 10, 18, 18, 2, WHITE, INK, 1.2);
  [[8, 15], [8, 23], [44, 15], [44, 23]].forEach(([a, b]) => p.circle(x + a, y + b, 1.2, INK, null));
}
function figHands(p, x, y) {          // 52 x 56
  p.circle(x + 26, y + 28, 25, WHITE, GREEN, 1.8);
  p.circle(x + 13, y + 14, 3.5, [0.92, 0.98, 0.94], GREEN, 1.2);
  p.circle(x + 39, y + 13, 4.5, [0.92, 0.98, 0.94], GREEN, 1.2);
  p.text('CLEAN', x + 26, y + 29, 8.5, 'F2', GREEN, 'center');
  p.text('HANDS', x + 26, y + 39, 8.5, 'F2', INK, 'center');
}
function figDoughnut(p, x, y) {       // 54 x 60
  p.rrect(x + 4, y, 46, 46, 10, SKIN, INK, 1.5);
  p.circle(x + 27, y + 23, 10, WHITE, RED, 1.6);
  p.circle(x + 27, y + 23, 4, [1, 0.85, 0.85], RED, 1);
  p.text('moleskin', x + 27, y + 57, 7.5, 'F2', INK, 'center');
}
function figInhaler(p, x, y) {        // 44 x 60
  p.rrect(x + 10, y, 18, 40, 4, [0.85, 0.92, 1], INK, 1.6);               // canister
  p.rrect(x + 6, y + 32, 26, 18, 4, WHITE, INK, 1.6);                     // body
  p.rect(x + 30, y + 38, 12, 10, WHITE, INK, 1.4);                        // mouthpiece
  p.text('inhaler', x + 22, y + 60, 7.5, 'F2', INK, 'center');
}
function figKit(p, cx, top) {
  p.circle(cx, top + 70, 66, [0.95, 0.98, 0.96], GREEN, 3);
  p.circle(cx, top + 70, 58, null, [0.65, 0.78, 0.70], 1);
  p.rrect(cx - 18, top + 25, 36, 14, 4, null, INK, 3);
  p.rrect(cx - 44, top + 35, 88, 64, 9, WHITE, INK, 2.5);
  p.rect(cx - 8, top + 45, 16, 44, [0.83, 0.18, 0.18], null);
  p.rect(cx - 22, top + 59, 44, 16, [0.83, 0.18, 0.18], null);
  p.rrect(cx + 18, top + 88, 42, 15, 6, SKIN, INK, 1.5);
  p.rect(cx + 32, top + 90, 14, 11, WHITE, INK, 1);
}

// ============================================================================
//  PAGES
// ============================================================================
const pages = [];
const page = (fn) => { const p = new Page(pages.length + 1); fn(p); pages.push(p); };

// ---- 1. COVER ----
page(p => {
  p.rrect(20, 18, PW - 40, PH - 54, 10, WHITE, GREEN, 2.8);
  p.rrect(24, 22, PW - 48, PH - 62, 8, null, [0.70, 0.85, 0.75], 1);
  p.rrect(32, 30, PW - 64, 80, 8, GREEN, INK, 1.5);
  p.text('GIRL SCOUT JUNIOR  \x95  BE PREPARED', PW / 2, 48, 9, 'F2', [0.9, 1, 0.92], 'center');
  p.text('FIRST AID', PW / 2, 79, 28, 'F2', WHITE, 'center');
  p.text('HANDBOOK', PW / 2, 100, 14, 'F2', WHITE, 'center');
  figKit(p, PW / 2, 120);
  const bw = (PW - 76) / 3, words = [['1. CHECK', 'Is it safe?', GREEN, [0.95, 0.98, 0.96]],
    ['2. CALL', 'Get an adult or 9-1-1', RED, [1, 0.96, 0.96]], ['3. CARE', 'Help in ways you know', INK, [0.97, 0.98, 0.99]]];
  words.forEach(([a, b, c, bg], i) => {
    const x = 32 + i * (bw + 6);
    p.rrect(x, 276, bw, 50, 6, bg, c, 1.6);
    p.text(a, x + bw / 2, 295, 11, 'F2', c, 'center', bw - 6);
    p.para(b, x + 7, 310, bw - 14, 8.5, 10);
  });
  p.rrect(32, 340, PW - 64, 124, 8, [1, 0.99, 0.94], INK, 1.8);
  p.text('THIS HANDBOOK BELONGS TO:', PW / 2, 360, 10, 'F2', GREEN, 'center');
  const fill = (label, y, x2 = PW - 44) => { p.text(label, 44, y, 10, 'F2'); p.line(44 + measure(label, 10, true) + 6, y + 2, x2, y + 2, INK, 1.2); };
  fill('Name:', 390); fill('Troop #:', 418, 200);
  p.text('Date:', 214, 418, 10, 'F2'); p.line(246, 420, PW - 44, 420, INK, 1.2);
  fill('My Buddy:', 446);
  p.rrect(32, 476, PW - 64, 66, 7, [0.95, 0.98, 0.96], GREEN, 1.2);
  p.para('Accidents happen at home, at school, and on the trail. When you know how to **stay calm, get help, and care for small injuries**, you can help your friends, family, and younger kids!',
    42, 492, PW - 84, 9.3, 12);
  p.footer('Girl Scout Junior First Aid');
});

// ---- 2. CONTENTS & GERM SAFETY ----
page(p => {
  let y = p.header('What’s Inside');
  const toc = [[2, 'Contents & Germ Safety'], [3, 'Your First Aid Kit'], [4, 'What To Do in an Accident'],
    [5, 'Calling 9-1-1 & Poison'], [6, 'Passed Out & Shock'], [7, 'Choking: Kids & Adults'], [8, 'Choking: Babies'],
    [9, 'Cuts & Nosebleeds'], [10, 'Burns & Sunburn'], [11, 'Bruises, Sprains & Bones'], [12, 'Head, Splinters & Eyes'],
    [13, 'Stings, Ticks & Allergies'], [14, 'Asthma, Fainting & Teeth'], [15, 'Outdoor First Aid'], [16, 'Lost? S.T.O.P. & Cheat Sheet']];
  const rows = 8, h = 24 + rows * 16;
  p.rrect(M, y, PW - 2 * M, h, 6, TINT.green.bg, GREEN, 1.3);
  const colW = (PW - 2 * M) / 2;
  toc.forEach(([n, t], i) => {
    const col = i < rows ? 0 : 1, row = i % rows, x = M + 10 + col * colW, yy = y + 18 + row * 16;
    p.text(`${n}`, x + 14, yy, 10, 'F2', GREEN, 'right');
    p.text(t, x + 20, yy, 9.4, 'F1', INK, 'left', colW - 32);
  });
  y = p.header('Germ Safety Rules', { y: y + h + 14 });
  const gy = y;
  y = p.card({ y, tint: 'amber', rightSpace: 62, items: [
    '**Wash your hands** before and after you help. Use **soap and water** if they look dirty, or use **alcohol-based hand sanitizer**.',
    '**Wear gloves** if there is blood. No gloves? Let the hurt person press on their own cut with a cloth.',
    '**Cover your own cuts** first.',
    '**Don’t touch** the part of the bandage that goes on the cut.'] });
  figHands(p, PW - M - 64, gy + 24);
  p.note(y + 10, '@@How to use this booklet:@@ Read it with your troop, practice the skills with an adult, and keep it in your backpack or First Aid kit. **In a real emergency, always get an adult first!**');
  p.footer('Contents & Germ Safety');
});

// ---- 3. FIRST AID KIT ----
page(p => {
  p.header('Your First Aid Kit');
  const kit = ['Bandages (all sizes)', 'Gauze pads & tape', 'Cleaning wipes', 'Antibiotic ointment', 'Elastic (ACE) bandage',
    'Triangle bandage', 'Tweezers', 'Small scissors', 'Medical gloves', 'Instant cold pack', 'Anti-itch cream', 'Moleskin (blisters)',
    'Flashlight & whistle', 'Emergency phone list'];
  const y0 = 50, h = 48 + 7 * 21;
  p.rrect(M, y0, PW - 2 * M, h, 6, WHITE, TINT.white.border, 1.3);
  p.text('Kit Checklist', M + 9, y0 + 15.5, 10.8, 'F2');
  p.line(M + 8, y0 + 21, PW - M - 8, y0 + 21, [0.8, 0.84, 0.81], 0.8);
  p.text('Check off each item as you pack it:', M + 9, y0 + 36, 9.5, 'F3');
  const colW = (PW - 2 * M) / 2;
  kit.forEach((k, i) => {
    const x = M + 10 + (i % 2) * colW, yy = y0 + 56 + Math.floor(i / 2) * 21;
    p.rect(x, yy - 9, 10.5, 10.5, WHITE, INK, 1.3);
    p.text(k, x + 16, yy, 10, 'F1', INK, 'left', colW - 30);
  });
  let y = p.card({ y: y0 + h + 10, title: 'Kit Rules', tint: 'green', numbered: false, items: [
    '{{Only adults give medicine.}} Never give anyone pills or medicine yourself.',
    '**Check your kit** every 6 months and replace anything that is used up.',
    '**Know where the kit is** at home, in the car, and on trips.',
    '**Bring it** on every hike and camping trip.'] });
  p.text('My kit is kept:', M, y + 26, 10, 'F2');
  p.line(M + measure('My kit is kept:', 10, true) + 6, y + 28, PW - M, y + 28, INK, 1.2);
  p.footer('Your First Aid Kit');
});

// ---- 4. CHECK, CALL, CARE ----
page(p => {
  p.header('What To Do in an Accident');
  const steps = [['1. CHECK', 'Is it safe for **you**? Look for cars, fire, or deep water.', GREEN, TINT.green.bg],
    ['2. CALL', 'Yell for an adult. Point to one person: *“You, call 9-1-1!”*', RED, TINT.red.bg],
    ['3. CARE', 'Stay calm and stay with them. Only do what you know.', INK, [0.97, 0.98, 0.99]]];
  const bw = (PW - 2 * M - 12) / 3;
  steps.forEach(([a, b, c, bg], i) => {
    const x = M + i * (bw + 6);
    p.rrect(x, 50, bw, 84, 6, bg, c, 1.6);
    p.text(a, x + bw / 2, 67, 11.5, 'F2', c, 'center', bw - 6);
    p.para(b, x + 7, 83, bw - 14, 9.3, 11.6);
  });
  p.text('WHO SHOULD YOU CALL?', PW / 2, 152, 11, 'F2', INK, 'center');
  let y = p.card({ y: 160, title: 'Call 9-1-1 Right Away', tag: 'Emergency', tint: 'red', numbered: false, items: [
    'Not breathing, choking, or won’t wake up',
    'Bleeding that won’t stop',
    'Bad head, neck, or back injury',
    'Big burn or any fire',
    'Swollen lips or throat (bad allergy)',
    'Swallowed poison and feels sick',
    '**Any situation you do not feel comfortable managing**'] });
  y = p.card({ y: y + 8, title: 'Get an Adult', tint: 'amber', numbered: false, items: [
    'Maybe a sprain or broken bone',
    'Animal bite or tick bite',
    'Nosebleed that lasts over 15 minutes',
    'Eye or tooth injury, fever, or throwing up'] });
  p.card({ y: y + 8, title: 'You Can Handle It (Then Tell an Adult)', tint: 'white', numbered: false, items: [
    'Small cut or scrape, small bruise, small splinter, or a bug bite'] });
  p.footer('Check, Call, Care');
});

// ---- 5. CALLING 9-1-1 & POISON ----
page(p => {
  let y = p.header('Calling 9-1-1', { red: true });
  const cy = y;
  y = p.card({ y, tint: 'red', rightSpace: 56, items: [
    '**Say what happened** in one sentence.',
    '**Say where you are:** the address, or the park or trail name.',
    '**Give your name** and phone number.',
    '**Do what the dispatcher says.**',
    '{{Don’t hang up}} until they tell you it’s OK.'] });
  figPhone(p, PW - M - 54, cy + 16);
  y = p.header('Poison', { y: y + 12, tag: '1-800-222-1222' });
  y = p.card({ y, tint: 'amber',
    intro: 'Cleaners, bleach, laundry pods, someone else’s medicine, or wild berries and mushrooms.', items: [
    '**Sick, very sleepy, or trouble breathing?** {{Call 9-1-1.}}',
    '**Feels OK?** Get an adult and call **Poison Control: 1-800-222-1222**.',
    '**Don’t make them throw up.** Keep the bottle to show the helpers.'] });
  const by = y + 10, bh = CONTENT_BOTTOM - by;
  p.rrect(M, by, PW - 2 * M, bh, 6, TINT.green.bg, GREEN, 1.4);
  p.text('My Emergency Phone List (fill this in!)', M + 9, by + 15.5, 10.8, 'F2', DKGREEN);
  p.line(M + 8, by + 21, PW - M - 8, by + 21, [0.8, 0.86, 0.82], 0.8);
  const f = ['My address:', 'Parent/guardian:', 'Another adult:', 'Neighbor/relative:', 'My allergies:'];
  const step = (bh - 28) / f.length;
  f.forEach((l, i) => {
    const fy = by + 28 + step * (i + 0.6);
    p.text(l, M + 9, fy, 10, 'F2');
    p.line(M + 15 + measure(l, 10, true), fy + 2, PW - M - 10, fy + 2, GRAY, 1);
  });
  p.footer('Calling 9-1-1 & Poison');
});

// ---- 6. PASSED OUT & SHOCK ----
page(p => {
  let y = p.header('Someone Won’t Wake Up', { red: true, tag: 'Call 9-1-1' });
  const ry = y;
  y = p.card({ y, tint: 'white', rightSpace: 118,
    intro: 'Tap their shoulder and shout, *“Are you OK?”*', items: [
    '**No answer? Call 9-1-1** and get an adult.',
    '**Breathing, and no neck or back injury?** Roll them onto their **side**.',
    '**Bend the top knee** so they stay on their side.',
    '**Tip the head back a little** so they can breathe.',
    '**Stay with them** until help comes.'] });
  figRecovery(p, PW - M - 120, ry + 16);
  y = p.header('Shock', { y: y + 12, red: true, tag: 'Call 9-1-1' });
  y = p.note(y, '**Shock** can happen after a bad injury, burn, lots of bleeding, or a bad allergy. The body isn’t getting enough blood. {{It is an emergency.}}', 'red');
  y = p.cards2(y + 7,
    { title: 'Signs of Shock', tint: 'red', numbered: false, items: [
      'Pale, cold, sweaty skin', 'Fast breathing', 'Dizzy, weak, or confused', 'Feels sick to the stomach'] },
    { title: 'What To Do', tint: 'green', items: [
      '{{Call 9-1-1.}}', '**Lie them down.**', '**Raise the feet** about 12 inches, unless it hurts or they may have an injury.',
      '**Keep them warm.**', '**No food or drink.**'] });
  p.note(y + 7, '**Throwing up, or passed out but breathing?** Roll them onto their side instead.', 'amber');
  p.footer('Passed Out & Shock');
});

// ---- 7. CHOKING: KIDS & ADULTS ----
page(p => {
  p.header('Choking: Kids & Adults', true);
  let y = p.note(50, '@@Coughing hard or talking?@@ Let them keep coughing and stay close. Start the rescue only if they **can’t breathe, talk, or cough**.');
  y = p.card({ y: y + 7, title: 'Choking Danger Signs', tint: 'red', numbered: false, items: [
    '**Hands at the throat** (the choking sign)',
    '**Can’t breathe, talk, or cough**, or lips turning blue'] });
  const fw = (PW - 2 * M - 8) / 2;
  figBackBlows(p, M, y + 6, fw);
  figThrusts(p, M + fw + 8, y + 6, fw);
  y = p.note(y + 125, '{{Alternate between 5 back blows and 5 abdominal thrusts}} until the object comes out or they can breathe.', 'red');
  p.card({ y: y + 6, title: 'How to Give Back Blows & Abdominal Thrusts', tag: 'Age 1 to Adult', tint: 'white', items: [
    '**Ask, “Are you choking?”** If they nod, tell someone to **call 9-1-1**.',
    '**5 Back Blows:** Stand behind and a little to the side. Lean them forward. Hit firmly **between the shoulder blades** with the heel of your hand.',
    '**5 Abdominal Thrusts:** Stand behind. Make a fist just **above the bellybutton**, grab it with your other hand, and pull **in and up** fast.',
    '**Keep alternating** 5 back blows and 5 abdominal thrusts.',
    '**If they pass out,** lower them to the floor and make sure 9-1-1 is coming.'] });
  p.footer('Choking: Kids & Adults');
});

// ---- 8. CHOKING: BABIES ----
page(p => {
  p.header('Choking: Babies', true);
  let y = p.card({ y: 50, title: 'Baby Under 1 Year Old', tag: '5 + 5', tint: 'red', rightSpace: 118,
    intro: 'Babies are too small for abdominal thrusts. Use **back blows and chest thrusts**:', items: [
    '**Sit down.** Lay the baby **face-down on your arm**, holding the jaw. Keep the **head lower** than the chest.',
    '**5 Back Blows** between the shoulder blades with the heel of your hand.',
    '**Turn the baby face-up**, head still low.',
    '**5 Chest Thrusts** in the center of the chest using the **heel of one hand** (instead of two fingers).',
    '**Repeat** 5 and 5. {{Call 9-1-1.}}'] });
  figBaby(p, PW - M - 120, 82);
  p.text('Helping With Little Kids: Stop Choking Before It Starts', PW / 2, y + 22, 10.5, 'F2', DKGREEN, 'center', PW - 2 * M);
  p.cards2(y + 30,
    { title: 'Do This', tint: 'green', numbered: false, items: [
      'Watch them while they eat', 'Have them sit down to eat', 'Cut grapes and hot dogs into tiny pieces', 'Pick up small toys and coins'] },
    { title: 'Never Give Babies', tint: 'red', numbered: false, items: [
      'Nuts, popcorn, or hard candy', 'Whole grapes or marshmallows', 'Balloons', 'Coins, button batteries, or tiny toy parts'] });
  p.footer('Choking: Babies');
});

// ---- 9. CUTS & NOSEBLEEDS ----
page(p => {
  let y = p.header('Cuts & Scrapes');
  const cy = y;
  y = p.card({ y, title: 'Small Cut or Scrape', tint: 'green', rightSpace: 62, items: [
    '**Wash your hands** and put on gloves if you have them.',
    '**Rinse the cut** with clean running water.',
    '**Add antibiotic ointment** if an adult says it’s OK.',
    '**Cover it** with a bandage.'] });
  figBandage(p, PW - M - 62, cy + 32);
  y = p.card({ y: y + 8, title: 'Deep Cut or Lots of Blood', tag: 'Adult / 9-1-1', tint: 'red', items: [
    '**Get help and call 9-1-1!** Have the person sit or lie down.',
    '**Press hard** on the cut with a clean cloth for **at least 10–15 minutes** without stopping.',
    '**Blood soaks through?** {{Don’t take the cloth off.}} Put another cloth on top and keep pressing.',
    '**Arm or leg still bleeding heavily?** If firm pressure doesn’t stop it, a trained adult may need to use a **tourniquet**.',
    '**Something stuck in the cut?** Don’t pull it out. Get help.'] });
  y = p.header('Nosebleed', { y: y + 12 });
  const ny = y;
  p.card({ y, tint: 'white', rightSpace: 72, items: [
    '**Sit up and lean FORWARD.** {{Don’t tip your head back.}}',
    '**Pinch the soft part** of the nose.',
    '**Hold for 10–15 minutes** without letting go. Breathe through your mouth.',
    '**Still bleeding after 15 minutes?** Get an adult.'] });
  figNose(p, PW - M - 72, ny + 12);
  p.footer('Cuts & Nosebleeds');
});

// ---- 10. BURNS & SUNBURN ----
page(p => {
  let y = p.header('Burns');
  y = p.card({ y, title: '1st, 2nd & 3rd Degree Burns', tint: 'amber', numbered: false, fs: 9.3, lh: 11.4, items: [
    '**1st Degree (mild):** Red, sore skin with **no blisters** (like a mild sunburn).',
    '**2nd Degree (medium):** Red, very painful, and **has blisters**.',
    '**3rd Degree (severe):** Deep burn; skin looks **white, brown, or charred**.',
    '@@Rule:@@ Only treat **small 1st- and 2nd-degree burns** yourself. **Large burns or any 3rd-degree burn** need immediate medical care ({{call 9-1-1}}).'] });
  y = p.card({ y: y + 5, title: 'Small Minor Burn (1st or Small 2nd Degree)', tint: 'green', fs: 9.3, lh: 11.4, items: [
    '**Get away from the heat.**',
    '**Cool it under cool running water** for at least 10 minutes.',
    '**Take off rings or tight things** before it swells.',
    '**Cover it loosely** with a clean, non-stick bandage.'] });
  y = p.card({ y: y + 5, title: '3 Burn Rules', tint: 'red', numbered: false, fs: 9.3, lh: 11.4, items: [
    '{{No ice}} — it hurts the skin more.',
    '{{No butter, oil, or toothpaste}} — they hold the heat in.',
    '{{Don’t pop blisters}} — they keep germs out.'] });
  y = p.card({ y: y + 5, title: 'Big or 3rd-Degree Burns & Fire', tag: 'Call 9-1-1', tint: 'red', numbered: false, fs: 9.3, lh: 11.4, items: [
    '**Clothes on fire?** {{Stop, Drop, and Roll!}}',
    '**Call 9-1-1** for any 3rd-degree burn, large burn, burn on the face, hands, or feet, or burn from electricity or chemicals.',
    '**Cover loosely** with a clean, dry cloth.'] });
  y = p.header('Sunburn', { y: y + 7 });
  p.card({ y, tint: 'amber', fs: 9.3, lh: 11.4, items: [
    '**Get into the shade** and cool the skin with a cool, damp cloth.',
    '**Use aloe gel** and drink lots of water.',
    '**Next time:** sunscreen (SPF 30+) and a hat. Reapply every 2 hours.'] });
  p.footer('Burns & Sunburn');
});

// ---- 11. BRUISES, SPRAINS & BROKEN BONES ----
page(p => {
  let y = p.header('Bruises');
  y = p.card({ y, tint: 'white', numbered: false, items: [
    '**Cold pack** wrapped in a cloth for 15–20 minutes. Never put ice right on skin.',
    '**Very big or very painful?** Tell an adult.'] });
  y = p.header('Sprains (Twisted Ankle or Wrist)', { y: y + 10 });
  const ry = y, rh = 14 + 2 * 56 + 26;
  p.rrect(M, ry, PW - 2 * M, rh, 6, TINT.green.bg, GREEN, 1.4);
  const rice = [['R', 'REST', 'Stop. Don’t stand or walk on it.'], ['I', 'ICE', 'Cold pack in a cloth, 15–20 minutes.'],
    ['C', 'COMPRESS', 'Wrap it snugly with an elastic bandage.'], ['E', 'ELEVATE', 'Prop it up higher than the heart.']];
  const cw = (PW - 2 * M - 24) / 2;
  rice.forEach(([l, wd, t], i) => {
    const x = M + 8 + (i % 2) * (cw + 8), yy = ry + 8 + Math.floor(i / 2) * 56;
    p.rrect(x, yy, cw, 50, 4, WHITE, GREEN, 1.1);
    p.circle(x + 13, yy + 13, 9, GREEN, null);
    p.text(l, x + 13, yy + 16.5, 10, 'F2', WHITE, 'center');
    p.text(wd, x + 27, yy + 17, 10, 'F2', DKGREEN);
    p.para(t, x + 7, yy + 32, cw - 14, 9.5, 11.5);
  });
  p.para('**Short-term care:** R.I.C.E. is for **right after** the injury. Have an adult **follow up with a doctor or healthcare provider** for injury-specific care.',
    M + 9, ry + 14 + 112 + 4, PW - 2 * M - 18, 9.1, 11.2);
  y = p.header('Broken Bones', { y: ry + rh + 10, red: true, tag: 'Get an Adult' });
  p.card({ y, tint: 'red',
    intro: '**It might be broken if** it looks bent, swells fast, hurts a lot, or they can’t move it.', items: [
    '{{Don’t move them,}} and don’t try to straighten it.',
    '**Keep it still.** Pad around it with jackets or towels.',
    '**Call 9-1-1** if the bone pokes through the skin, it looks very bent, or the fingers or toes turn blue or cold.',
    '**Watch for shock** (page 6).'] });
  p.footer('Bruises, Sprains & Broken Bones');
});

// ---- 12. HEAD, SPLINTERS & EYES ----
page(p => {
  let y = p.header('Head Injury', { red: true, tag: 'Always Tell an Adult' });
  y = p.card({ y, tint: 'red', items: [
    '**Keep them still.** Fell from high up? {{Don’t move the head or neck.}}',
    '**Small bump?** Hold a cold pack on it.',
    '{{Call 9-1-1}} for any red flag below.'] });
  const fy = y + 6, flags = ['Passed out', 'Throwing up', 'Bad headache', 'Confused or forgetful', 'Very sleepy', 'Blurry vision or stumbling'];
  const fh = 22 + 3 * 16;
  p.rrect(M, fy, PW - 2 * M, fh, 6, WHITE, RED, 1.4);
  p.text('RED FLAGS', PW / 2, fy + 14, 10, 'F2', DKRED, 'center');
  const half = (PW - 2 * M) / 2;
  flags.forEach((f, i) => {
    const x = M + 12 + (i % 2) * half, yy = fy + 30 + Math.floor(i / 2) * 16;
    p.rect(x, yy - 7.5, 7, 7, RED, null);
    p.text(f, x + 12, yy, 9.8, 'F2', INK, 'left', half - 26);
  });
  y = p.header('Splinters', { y: fy + fh + 10 });
  y = p.card({ y, tint: 'green', items: [
    '**Wash** with soap and water.',
    '**Clean the tweezers** with rubbing alcohol.',
    '**Pull it out slowly** the same way it went in.',
    '**Deep or stuck?** Ask an adult.'] });
  y = p.header('Something in the Eye', { y: y + 10 });
  p.card({ y, tint: 'white', items: [
    '{{Don’t rub your eye!}}',
    '**Blink** and let your tears wash it out.',
    '**Rinse** with clean, lukewarm water.',
    '**Chemical in the eye?** Rinse with water for 15 minutes and {{call 9-1-1 or Poison Control.}}'] });
  p.footer('Head Bumps, Splinters & Eyes');
});

// ---- 13. STINGS, TICKS & ALLERGIES ----
page(p => {
  let y = p.header('Bee Stings & Ticks');
  y = p.cards2(y,
    { title: 'Bee Sting', tint: 'green', fs: 9.6, lh: 12.2, items: [
      '**Scrape the stinger out** sideways with a fingernail or card. Do it fast.',
      '**Wash** with soap and water.', '**Cold pack** for 10 minutes.', '**Don’t scratch!**'] },
    { title: 'Tick Bite', tint: 'amber', fs: 9.6, lh: 12.2, items: [
      '**Tell an adult.**', '**Use tweezers** to grab the tick close to the skin.',
      '**Pull straight up.** Don’t twist or squeeze it.', '**Wash** the bite. Tell an adult about a rash or fever later.'] });
  y = p.header('Poison Ivy or Poison Oak', { y: y + 10, tag: '“Leaves of three, let it be!”' });
  y = p.card({ y, tint: 'white', numbered: false, items: [
    '**Touched it?** Wash your skin and clothes with soap and water right away.',
    '**Itchy rash?** Use anti-itch lotion. Don’t scratch.'] });
  y = p.header('Bad Allergic Reaction', { y: y + 10, red: true, tag: 'Call 9-1-1' });
  p.card({ y, tint: 'red',
    intro: 'Some people are very allergic to bee stings, peanuts, or other foods.', items: [
    '**Danger signs:** swollen lips, tongue, or face; trouble breathing; hives all over; throwing up.',
    '{{Call 9-1-1 and get an adult now!}}',
    '**Do they have an EpiPen?** Get it to them or an adult fast.'] });
  p.footer('Stings, Ticks & Allergies');
});

// ---- 14. ASTHMA, FAINTING & TEETH ----
page(p => {
  let y = p.header('Asthma Attack');
  const ay = y;
  y = p.card({ y, tint: 'amber', rightSpace: 52,
    intro: '**Signs:** coughing, wheezing, tight chest, hard to breathe.', items: [
    '**Help them sit up** and stay calm.',
    '**Get their inhaler** and an adult. They use only their own inhaler.',
    '**Breathe slowly** together.',
    '{{Call 9-1-1}} if their lips turn blue, they can’t talk, or the inhaler isn’t helping.'] });
  figInhaler(p, PW - M - 50, ay + 24);
  y = p.header('Fainting', { y: y + 10 });
  y = p.card({ y, tint: 'white',
    intro: 'Fainting is passing out for a short time.', items: [
    '**Lay them on their back.**',
    '**Raise their legs** about 12 inches.',
    '**Loosen anything tight** around the neck.',
    '{{Doesn’t wake up in 1 minute? Call 9-1-1.}}',
    '**Awake?** Sit up slowly. Tell an adult.'] });
  y = p.header('Knocked-Out Tooth', { y: y + 10, tag: 'Get an Adult' });
  p.card({ y, tint: 'green', items: [
    '**Baby tooth?** Bite on clean gauze to stop the bleeding. Tell an adult.',
    '**Adult tooth?** Pick it up by the **top**, not the root.',
    '**Rinse it gently** if it’s dirty. Don’t scrub it.',
    '**Put it in milk** and get to a dentist fast (within 1 hour).'] });
  p.footer('Asthma, Fainting & Teeth');
});

// ---- 15. OUTDOOR FIRST AID ----
page(p => {
  let y = p.header('Hiking Blisters');
  const by = y;
  y = p.card({ y, tint: 'green', rightSpace: 62, items: [
    '**Feel a sore “hot spot”?** Stop and fix it right away.',
    '{{Don’t pop a blister.}} Put a **moleskin doughnut** around it.',
    '**Popped?** Wash it, add ointment, and cover it.'] });
  figDoughnut(p, PW - M - 62, by + 12);
  y = p.header('Heat Exhaustion & Heat Stroke', { y: y + 10, red: true });
  y = p.cards2(y,
    { title: 'Heat Exhaustion', tint: 'amber', fs: 9.6, lh: 12.2,
      intro: '**Signs:** sweaty, pale, dizzy, headache, tired, **fast heart rate, fast breathing, muscle cramps**.', items: [
      'Move to the **shade**.', '**Sip cool water.**', 'Put **cool, wet cloths** on the neck.'] },
    { title: 'Heat Stroke', tag: '9-1-1', tint: 'red', fs: 9.6, lh: 12.2,
      intro: '**Signs:** very hot skin, **confused or acting strange**, passes out.', items: [
      '{{Call 9-1-1!}}', '**Cool them fast** with wet cloths and fanning.', '**No drinks** if confused.'] });
  y = p.header('Too Cold: Hypothermia', { y: y + 10, tag: 'Get Warm & Dry' });
  p.card({ y, tint: 'white',
    intro: '**Signs:** can’t stop shivering, clumsy, slurred words, very sleepy.', items: [
    '**Get out of the wind and rain.**',
    '**Change into dry clothes** and a hat.',
    '**Wrap them in blankets** or a sleeping bag.',
    '**Awake?** Give a warm, sweet drink.'] });
  p.footer('Outdoor First Aid');
});

// ---- 16. BACK COVER: S.T.O.P. & CHEAT SHEET ----
page(p => {
  let y = p.header('If You Get Lost Outdoors: S.T.O.P.');
  const sy = y, sh = 14 + 2 * 52 + 38;
  p.rrect(M, sy, PW - 2 * M, sh, 6, TINT.green.bg, GREEN, 1.4);
  const stop = [['S', 'STOP', 'Stop walking. Stay where you are.'], ['T', 'THINK', 'Stay calm. People will look for you.'],
    ['O', 'OBSERVE', 'Look for shelter. Stay near the trail.'], ['P', 'PLAN', 'Stay with your buddy and signal.']];
  const cw = (PW - 2 * M - 24) / 2;
  stop.forEach(([l, wd, t], i) => {
    const x = M + 8 + (i % 2) * (cw + 8), yy = sy + 8 + Math.floor(i / 2) * 52;
    p.rrect(x, yy, cw, 47, 4, WHITE, GREEN, 1.1);
    p.circle(x + 13, yy + 13, 9, GREEN, null);
    p.text(l, x + 13, yy + 16.5, 10, 'F2', WHITE, 'center');
    p.text(wd, x + 27, yy + 17, 10, 'F2', DKGREEN);
    p.para(t, x + 7, yy + 31, cw - 14, 9.3, 11.0);
  });
  p.para('**Signal with 3:** blow **3 loud whistle blasts**, wait, and repeat. Always hike with a buddy, a whistle, water, and a jacket.',
    M + 9, sy + 14 + 104 + 6, PW - 2 * M - 18, 9.2, 11.4);

  const ty = p.header('First Aid Cheat Sheet', { y: sy + sh + 10 });
  const rows = [['Bleeding', 'Press hard with a clean cloth for 10–15 min.'], ['Nosebleed', 'Lean forward. Pinch the soft part 10–15 min.'],
    ['Burn', 'Cool water 10+ min. No ice, no butter.'], ['Sprain', 'R.I.C.E.: Rest, Ice, Compress, Elevate.'],
    ['Choking (kid)', '5 back blows + 5 abdominal thrusts. Repeat.'], ['Choking (baby)', '5 back blows + 5 chest thrusts. Repeat.'],
    ['Shock', 'Call 9-1-1. Lie down, raise feet, keep warm.'], ['Lost outdoors', 'S.T.O.P. and blow 3 whistle blasts.']];
  const th = 12 + rows.length * 14.5 + 4;
  p.rrect(M, ty, PW - 2 * M, th, 6, WHITE, INK, 1.4);
  rows.forEach(([a, b], i) => {
    const yy = ty + 18 + i * 14.5;
    if (i % 2) p.rect(M + 2, yy - 10, PW - 2 * M - 4, 14.5, [0.95, 0.98, 0.96], null);
    p.text(a, M + 8, yy, 9, 'F2', DKGREEN, 'left', 80);
    p.text(b, M + 92, yy, 9, 'F1', INK, 'left', PW - 2 * M - 98);
  });
  const ey = ty + th + 6;
  p.rrect(M, ey, PW - 2 * M, 20, 4, [1, 0.95, 0.95], RED, 1.3);
  p.text('EMERGENCY: 9-1-1     |     POISON CONTROL: 1-800-222-1222', PW / 2, ey + 13.5, 9, 'F2', DKRED, 'center', PW - 2 * M - 10);
  p.para('*This booklet helps you remember what to do, but it does not replace a hands-on First Aid or CPR class. Always get an adult. Based on Mayo Clinic, American Red Cross, and American Heart Association (2025) guidance.*',
    M, ey + 32, PW - 2 * M, 7.8, 9.6);
  p.footer('Back Cover');
});

// ============================================================================
//  CHECKS + PDF OUTPUT
// ============================================================================
pages.forEach(p => {
  if (p.bottom > CONTENT_BOTTOM + 0.5) warnings.push(`p${p.num}: content runs too low (${p.bottom.toFixed(0)} > ${CONTENT_BOTTOM})`);
});
if (pages.length % 4) warnings.push(`Page count ${pages.length} is not a multiple of 4 (booklet printing will add blanks).`);

const objs = [];
const add = s => { objs.push(s); return objs.length; };
const cat = add(''), pgs = add('');
const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
const f3 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
const info = add('<< /Title (Girl Scout Junior First Aid Handbook) /Creator (build-handbook.js) >>');
const kids = pages.map(p => {
  const data = p.ops.join('\n');
  const sid = add(`<< /Length ${Buffer.byteLength(data, 'latin1')} >>\nstream\n${data}\nendstream`);
  return add(`<< /Type /Page /Parent ${pgs} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${sid} 0 R >>`);
});
objs[cat - 1] = `<< /Type /Catalog /Pages ${pgs} 0 R >>`;
objs[pgs - 1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
const offs = objs.map((o, i) => { const off = Buffer.byteLength(pdf, 'latin1'); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; return off; });
const xref = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync(OUT, Buffer.from(pdf, 'latin1'));

console.log(`Wrote ${OUT} (${pages.length} pages)`);
pages.forEach(p => console.log(`  page ${String(p.num).padStart(2)}: lowest content at ${p.bottom.toFixed(0)} / ${CONTENT_BOTTOM}`));
if (warnings.length) { console.log('\nWARNINGS:'); warnings.forEach(w => console.log('  - ' + w)); }
else console.log('\nNo layout warnings.');
