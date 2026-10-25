import { useRef, useEffect, useCallback, useState } from 'react';

// === MAP GEOMETRY (traced from Hervanta campus) ===
const MW = 1215, MH = 862;
const GEO_B: number[][][] = [[[967,567],[963,593],[975,596],[980,569]],[[301,535],[298,533],[190,534],[188,536],[188,574],[301,574]],[[966,507],[964,512],[965,528],[968,530],[986,530],[986,507]],[[871,487],[870,510],[900,510],[900,487]],[[487,458],[470,458],[467,460],[429,460],[428,458],[425,460],[359,460],[354,468],[342,469],[338,478],[349,485],[457,521],[463,521],[481,464]],[[669,349],[649,350],[647,352],[646,399],[632,398],[633,352],[631,350],[615,351],[615,391],[613,399],[606,398],[605,378],[593,379],[591,399],[581,398],[581,351],[559,350],[557,353],[539,350],[536,357],[529,357],[527,349],[514,351],[512,446],[516,448],[516,456],[506,458],[507,531],[516,532],[516,595],[523,598],[522,605],[460,604],[461,597],[479,597],[479,571],[467,568],[466,546],[422,547],[423,566],[421,569],[415,570],[415,584],[422,586],[422,596],[420,598],[370,598],[367,588],[361,586],[360,575],[325,575],[325,608],[360,609],[360,694],[377,696],[377,705],[375,707],[340,708],[339,747],[465,747],[467,744],[466,710],[451,708],[451,696],[453,694],[453,616],[450,614],[451,607],[517,608],[515,622],[525,627],[525,633],[517,634],[516,646],[518,648],[538,648],[540,663],[538,667],[517,667],[516,679],[518,681],[539,681],[540,697],[538,700],[519,700],[516,702],[516,719],[518,721],[536,721],[539,723],[537,733],[518,733],[516,735],[516,745],[581,745],[579,733],[558,732],[558,715],[581,712],[581,701],[544,700],[542,698],[543,681],[578,681],[581,678],[580,667],[543,667],[542,649],[581,647],[581,635],[543,634],[542,616],[579,615],[582,608],[670,607],[669,578],[641,577],[641,549],[635,546],[634,542],[609,542],[606,547],[599,550],[598,603],[581,602],[580,569],[542,569],[536,576],[519,579],[519,531],[523,531],[524,528],[580,527],[580,467],[524,467],[522,461],[518,459],[518,448],[543,446],[544,420],[556,421],[556,446],[558,447],[561,446],[562,420],[587,421],[587,432],[581,435],[581,447],[670,446],[670,422],[659,421],[659,399],[671,396],[671,351]],[[382,621],[432,622],[431,675],[381,674]],[[181,327],[180,374],[182,384],[178,397],[275,429],[278,435],[296,441],[301,441],[305,434],[316,434],[319,446],[336,446],[337,376],[324,375],[324,394],[322,397],[302,397],[301,363],[289,362],[288,387],[286,389],[267,389],[265,387],[265,353],[263,351],[252,352],[252,375],[250,377],[231,377],[230,340],[217,339],[215,365],[195,365],[193,359],[193,328]],[[364,244],[362,246],[362,287],[370,289],[370,296],[362,298],[361,340],[371,341],[372,349],[361,352],[361,393],[370,396],[370,415],[367,418],[361,418],[362,446],[395,446],[396,420],[423,420],[426,422],[426,447],[483,447],[483,400],[442,400],[440,398],[441,379],[463,379],[464,358],[472,356],[473,324],[464,321],[462,308],[429,308],[427,306],[427,295],[429,293],[479,293],[482,291],[482,246],[465,244],[400,245],[401,266],[414,267],[414,288],[386,289],[385,246],[383,244]],[[386,293],[425,294],[425,301],[421,307],[403,307],[401,309],[402,376],[410,379],[412,385],[412,396],[408,400],[385,399],[385,352],[380,348],[380,342],[385,339],[384,308]],[[678,139],[675,139],[672,143],[661,144],[661,146],[674,147],[676,150],[676,158],[670,160],[671,166],[685,162]]];
const GEO_G: number[][][] = [[[173,613],[145,614],[147,639],[170,639],[173,636]],[[670,537],[646,538],[646,569],[649,572],[670,570]],[[286,526],[286,531],[385,532],[389,536],[405,536],[408,533],[408,526],[403,524],[401,516],[394,516],[385,524],[301,524],[300,512],[296,507],[290,507],[290,523]],[[136,151],[135,264],[126,320],[116,358],[97,407],[65,406],[65,417],[88,418],[89,428],[64,483],[52,522],[24,523],[24,530],[49,531],[48,648],[62,831],[96,828],[96,805],[203,805],[206,823],[227,823],[229,805],[525,805],[527,824],[549,824],[551,805],[1124,805],[1128,807],[1127,828],[1150,830],[1192,381],[1168,381],[1160,458],[869,458],[709,402],[709,394],[716,392],[716,365],[699,364],[699,216],[749,215],[749,199],[173,199],[170,150]],[[333,770],[455,769],[456,788],[334,789]],[[171,217],[345,215],[345,240],[325,242],[325,342],[344,342],[347,345],[347,361],[354,361],[358,356],[358,331],[352,287],[358,282],[358,241],[364,240],[364,224],[368,221],[386,222],[387,215],[690,215],[691,291],[667,292],[665,313],[637,313],[636,332],[669,332],[670,313],[690,315],[691,346],[681,347],[681,352],[691,359],[693,404],[817,448],[818,457],[532,458],[532,465],[593,466],[593,532],[629,529],[629,523],[601,522],[602,465],[750,465],[748,520],[752,524],[795,526],[795,579],[799,582],[852,582],[855,577],[855,535],[852,531],[855,517],[853,465],[1159,465],[1151,572],[1149,576],[1139,576],[1139,582],[1149,583],[1147,596],[1136,596],[1133,604],[1135,636],[1144,637],[1143,655],[1125,655],[1126,662],[1141,663],[1130,788],[692,789],[692,619],[689,616],[601,617],[600,760],[681,762],[682,788],[551,789],[549,771],[528,771],[525,789],[465,789],[464,770],[468,766],[467,752],[335,750],[335,706],[353,703],[353,631],[345,629],[345,614],[339,614],[338,640],[341,643],[341,656],[334,660],[318,660],[318,768],[325,771],[324,789],[304,789],[302,771],[281,771],[278,789],[93,789],[81,628],[81,553],[84,533],[153,532],[154,545],[145,549],[145,575],[150,575],[151,572],[173,572],[173,550],[169,546],[160,545],[161,532],[236,531],[236,507],[221,507],[219,526],[202,526],[200,513],[195,513],[194,524],[176,524],[175,513],[163,513],[162,524],[118,524],[117,509],[94,508],[94,500],[137,402],[148,369],[176,366],[176,356],[154,354],[168,275]]];
const LABELS = [
  {t:"Tietotalo",x:228,y:372},{t:"Noodi",x:437,y:345},{t:"Sähkötalo",x:433,y:424},
  {t:"Rakennustalo",x:592,y:410},{t:"Konetalo",x:406,y:690},
  {t:"Parking",x:245,y:555},{t:"Research",x:930,y:548}
];
const STREETS = [
  {t:"Tekniikankatu",x:460,y:190,a:0},
  {t:"Korkeakoulunkatu",x:960,y:448,a:0},
  {t:"Korkeakoulunkatu",x:110,y:507,a:0},
  {t:"Hermiankatu",x:240,y:780,a:0},
  {t:"Hervannan valtaväylä",x:36,y:650,a:-1.48},
  {t:"Hervannantie",x:1126,y:600,a:-1.53}
];
const ZONES: Record<string, {name:string, x:number, y:number}> = {
  hack:    {name:"Hacking hall", x:425, y:488},
  mentors: {name:"Mentor corner", x:543, y:505},
  food:    {name:"Food", x:550, y:598},
  stage:   {name:"Main stage", x:635, y:585},
  lab:     {name:"Hardware lab", x:400, y:735},
  quiet:   {name:"Quiet room", x:262, y:400},
  entrance:{name:"Entrance", x:398, y:548}
};
const MAP_COLORS = {bg:"#161210",grid:"#1c1813",road:"#221d17",roadLabel:"#5a4c3a",fill:"#2a241c",stroke:"#8a7a5a",label:"#c8b890",shadow:"#0a0908"};

// === PIXEL SPRITE ===
const SPRITE = [
  "..CCCC..",".CCCCCC.",".cccccc.",".HSSSSH.",".SESSES.",
  "..SSSS..","..TTTT..",".TTTTTT.",".STTTTS.","..TTTT..",
  "..PPPP..","..P..P..","..P..P..",".BB..BB."
];
const SW = 8, SH = 14;

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round((n >> 16) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

type SpritePalette = Record<string, string>;

function drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number, px: number, pal: SpritePalette) {
  for (let r = 0; r < SH; r++) {
    const row = SPRITE[r];
    for (let c = 0; c < SW; c++) {
      const k = row[c];
      if (k === "." || !pal[k]) continue;
      ctx.fillStyle = pal[k];
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  }
}

function pathPoly(ctx: CanvasRenderingContext2D, pts: number[][]) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// === ROLE COLORS ===
const ROLE_COLORS: Record<string, string> = {
  'Frontend Dev': '#3d8bfd', 'Backend Dev': '#3d8bfd', 'Developer': '#3d8bfd',
  'ML Engineer': '#7bc67e', 'Data Scientist': '#7bc67e', 'Data / AI': '#7bc67e',
  'UX Designer': '#e07a5f', 'Designer': '#e07a5f',
  'Product Manager': '#c084fc', 'Business': '#c084fc',
  'Mobile Dev': '#3d8bfd', 'DevOps': '#3d8bfd',
  'Mentor': '#e6b84a',
};
const SHIRT_COLORS = ["#e94b4b","#3d7be0","#3fb36b","#f0a43a","#8a5ad6","#ececec","#2b2b33","#e86fb0"];
const PANTS_COLORS = ["#2b4c8c","#3a3a44","#6b4a2e","#2f6a4a","#7a2f3a","#c9b48a"];
const SKIN_COLORS = ["#f6d2b4","#e8b48f","#c98d63","#9c6440","#6b4129"];

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  role?: string;
  type: 'team' | 'participant' | 'mentor';
  status?: string;
}

interface CanvasMapProps {
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  selectedId?: string | null;
  demoMode?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

function geoToMap(lat: number, lng: number): { x: number; y: number } {
  const LAT_MIN = 61.4920, LAT_MAX = 61.5020, LNG_MIN = 23.7450, LNG_MAX = 23.7750;
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MW;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MH;
  return { x: Math.max(50, Math.min(MW - 50, x)), y: Math.max(50, Math.min(MH - 50, y)) };
}

function paletteForMarker(m: MapMarker, index: number): SpritePalette {
  const cap = ROLE_COLORS[m.role || ''] || (m.type === 'mentor' ? '#e6b84a' : m.type === 'team' ? '#3d8bfd' : '#7bc67e');
  const shirt = SHIRT_COLORS[(index * 3) % SHIRT_COLORS.length];
  const pants = PANTS_COLORS[(index * 5) % PANTS_COLORS.length];
  const skin = SKIN_COLORS[(index * 2) % SKIN_COLORS.length];
  return { C: cap, c: shade(cap, 0.72), H: "#3a2416", S: skin, E: "#15121a", T: shirt, P: pants, B: "#2a1b12" };
}

const USER_CAP_COLOR = '#00e5ff';

export default function CanvasMap({ markers, onMarkerClick, selectedId, demoMode, userLocation }: CanvasMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ s: 0, x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number; moved: number } | null>(null);
  const animRef = useRef<number>(0);
  const [, forceRender] = useState(0);

  const minScale = useCallback(() => {
    const { w, h } = sizeRef.current;
    return Math.min(w / MW, h / MH) * 0.95;
  }, []);

  const clampView = useCallback(() => {
    const v = viewRef.current;
    const { w, h } = sizeRef.current;
    v.s = Math.max(minScale(), Math.min(5, v.s));
    const mw = MW * v.s, mh = MH * v.s;
    v.x = mw < w ? (w - mw) / 2 : Math.min(w * 0.3, Math.max(w * 0.7 - mw, v.x));
    v.y = mh < h ? (h - mh) / 2 : Math.min(h * 0.3, Math.max(h * 0.7 - mh, v.y));
  }, [minScale]);

  const draw = useCallback((t: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    const v = viewRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = MAP_COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.s, v.s);

    // Grid
    ctx.strokeStyle = MAP_COLORS.grid;
    ctx.lineWidth = 0.5 / v.s;
    ctx.beginPath();
    for (let gx = 0; gx <= MW; gx += 20) { ctx.moveTo(gx, 0); ctx.lineTo(gx, MH); }
    for (let gy = 0; gy <= MH; gy += 20) { ctx.moveTo(0, gy); ctx.lineTo(MW, gy); }
    ctx.stroke();

    // Roads
    ctx.beginPath();
    for (const p of GEO_G) pathPoly(ctx, p);
    ctx.fillStyle = MAP_COLORS.road;
    ctx.fill("evenodd");

    // Buildings: shadow, fill, outline
    const sh = 3 / v.s;
    ctx.save();
    ctx.translate(sh, sh);
    ctx.beginPath();
    for (const p of GEO_B) pathPoly(ctx, p);
    ctx.fillStyle = MAP_COLORS.shadow;
    ctx.fill("evenodd");
    ctx.restore();
    ctx.beginPath();
    for (const p of GEO_B) pathPoly(ctx, p);
    ctx.fillStyle = MAP_COLORS.fill;
    ctx.fill("evenodd");
    ctx.strokeStyle = MAP_COLORS.stroke;
    ctx.lineWidth = 1.5 / v.s;
    ctx.stroke();
    ctx.restore();

    const S = (x: number, y: number): [number, number] => [x * v.s + v.x, y * v.s + v.y];

    // Street labels
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    if (v.s > 0.55) {
      ctx.font = "10px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = MAP_COLORS.roadLabel;
      for (const s of STREETS) {
        const [x, y] = S(s.x, s.y);
        ctx.save(); ctx.translate(x, y); ctx.rotate(s.a); ctx.fillText(s.t, 0, 0); ctx.restore();
      }
    }

    // Building names
    if (v.s > 1.0) {
      ctx.font = "9px 'Pixelify Sans', monospace";
      ctx.fillStyle = MAP_COLORS.label;
      ctx.globalAlpha = 0.6;
      const drawnLabelRects: { x: number; y: number; w: number; h: number }[] = [];
      for (const l of LABELS) {
        const [lx, ly] = S(l.x, l.y);
        const tw = ctx.measureText(l.t).width;
        const lh = 10;
        const rx = lx - tw / 2;
        const ry = ly - lh / 2;
        const overlaps = drawnLabelRects.some(
          r => rx < r.x + r.w && rx + tw > r.x && ry < r.y + r.h && ry + lh > r.y
        );
        if (overlaps) continue;
        drawnLabelRects.push({ x: rx, y: ry, w: tw, h: lh });
        ctx.fillText(l.t, lx, ly);
      }
      ctx.globalAlpha = 1;
    }

    // Zone tags
    for (const id in ZONES) {
      const z = ZONES[id];
      const [x, zy] = S(z.x, z.y);
      const y = zy + 16;
      ctx.font = "9px 'Pixelify Sans', monospace";
      const tw = ctx.measureText(z.name).width + 12;
      const x0 = Math.round(x - tw / 2), y0 = Math.round(y - 8);
      ctx.fillStyle = MAP_COLORS.shadow;
      ctx.fillRect(x0 + 2, y0 + 2, tw, 16);
      ctx.fillStyle = '#1c1814';
      ctx.fillRect(x0, y0, tw, 16);
      ctx.strokeStyle = '#5a4c3a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 + 1, y0 + 1, tw - 2, 14);
      ctx.fillStyle = '#e6b84a';
      ctx.fillText(z.name, x, y + 1);
    }

    // People sprites
    ctx.imageSmoothingEnabled = false;
    const px = v.s > 2.2 ? 3 : 2;
    const showAll = v.s >= 2.6;
    type LabelEntry = { m: MapMarker; x: number; oy: number; strong: boolean };
    const labels: LabelEntry[] = [];

    const sorted = [...markers].sort((a, b) => {
      const pa = geoToMap(a.lat, a.lng);
      const pb = geoToMap(b.lat, b.lng);
      return pa.y - pb.y;
    });

    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      const mp = geoToMap(m.lat, m.lng);
      const [x, y] = S(mp.x, mp.y);
      if (x < -30 || y < -50 || x > w + 30 || y > h + 30) continue;

      const ox = Math.round(x - SW * px / 2);
      const oy = Math.round(y - SH * px);
      // Shadow under feet
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(ox, Math.round(y) - px / 2, SW * px, px);
      // Draw sprite
      drawSprite(ctx, ox, oy, px, paletteForMarker(m, i));

      const isSelected = m.id === selectedId;
      if (isSelected || showAll) labels.push({ m, x, oy, strong: isSelected });
    }

    // Name tags above sprites
    ctx.font = "8px 'Pixelify Sans', monospace";
    for (const L of labels) {
      const first = L.m.name.split(" ")[0];
      const txt = L.strong ? L.m.name : first;
      let ay = L.oy - 6;
      if (L.strong) {
        ay = L.oy - 8 - (Math.floor(t / 300) % 2) * 2;
        ctx.fillStyle = '#f3e6c8';
        ctx.fillRect(Math.round(L.x) - 4, ay, 8, 2);
        ctx.fillRect(Math.round(L.x) - 2, ay + 2, 4, 2);
      }
      const tw = ctx.measureText(txt).width + 10;
      const x0 = Math.round(L.x - tw / 2), y0 = ay - 18;
      if (L.strong) { ctx.fillStyle = MAP_COLORS.shadow; ctx.fillRect(x0 + 2, y0 + 2, tw, 15); }
      ctx.fillStyle = '#1c1814';
      ctx.fillRect(x0, y0, tw, 15);
      const cap = ROLE_COLORS[L.m.role || ''] || '#5a4c3a';
      ctx.strokeStyle = L.strong ? cap : '#5a4c3a';
      ctx.lineWidth = L.strong ? 2 : 1;
      ctx.strokeRect(x0 + 1, y0 + 1, tw - 2, 13);
      ctx.fillStyle = '#f3e6c8';
      ctx.fillText(txt, L.x, y0 + 8);
    }

    // "You" marker — drawn last so it's always on top
    if (userLocation) {
      const up = geoToMap(userLocation.lat, userLocation.lng);
      const [ux, uy] = S(up.x, up.y);
      if (ux > -30 && uy > -50 && ux < w + 30 && uy < h + 30) {
        const uox = Math.round(ux - SW * px / 2);
        const uoy = Math.round(uy - SH * px);
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(uox, Math.round(uy) - px / 2, SW * px, px);
        // Sprite with unique cyan cap
        const userPal: SpritePalette = {
          C: USER_CAP_COLOR, c: shade(USER_CAP_COLOR, 0.72),
          H: "#3a2416", S: "#f6d2b4", E: "#15121a",
          T: "#ececec", P: "#2b4c8c", B: "#2a1b12",
        };
        drawSprite(ctx, uox, uoy, px, userPal);
        // "You" label — always visible
        ctx.font = "8px 'Pixelify Sans', monospace";
        const youTxt = "You";
        const ytw = ctx.measureText(youTxt).width + 10;
        const bounce = (Math.floor(t / 400) % 2) * 2;
        const yay = uoy - 8 - bounce;
        // Bouncing indicator
        ctx.fillStyle = USER_CAP_COLOR;
        ctx.fillRect(Math.round(ux) - 4, yay, 8, 2);
        ctx.fillRect(Math.round(ux) - 2, yay + 2, 4, 2);
        // Tag box
        const yx0 = Math.round(ux - ytw / 2), yy0 = yay - 18;
        ctx.fillStyle = MAP_COLORS.shadow;
        ctx.fillRect(yx0 + 2, yy0 + 2, ytw, 15);
        ctx.fillStyle = '#1c1814';
        ctx.fillRect(yx0, yy0, ytw, 15);
        ctx.strokeStyle = USER_CAP_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(yx0 + 1, yy0 + 1, ytw - 2, 13);
        ctx.fillStyle = USER_CAP_COLOR;
        ctx.fillText(youTxt, ux, yy0 + 8);
      }
    }
  }, [markers, selectedId, userLocation]);

  // Resize handler
  useEffect(() => {
    const container = containerRef.current;
    const cv = canvasRef.current;
    if (!container || !cv) return;

    const handleResize = () => {
      const r = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w: r.width, h: r.height };
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      const v = viewRef.current;
      if (v.s <= 0.01) {
        if (demoMode) {
          // Demo mode — zoom in on hacking hall
          v.s = Math.min(r.width / MW, r.height / MH) * 1.8;
          v.x = r.width / 2 - 425 * v.s;
          v.y = r.height / 2 - 488 * v.s;
        } else {
          // First render — center on campus
          v.s = Math.min(r.width / MW, r.height / MH) * 1.2;
          v.x = r.width / 2 - (MW / 2) * v.s;
          v.y = r.height / 2 - (MH / 2) * v.s;
        }
      }
      clampView();
    };

    handleResize();
    const obs = new ResizeObserver(handleResize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [clampView, demoMode]);

  // Animation loop
  useEffect(() => {
    let running = true;
    const loop = (t: number) => {
      if (!running) return;
      if (demoMode) {
        const speed = 0.15;
        const v = viewRef.current;
        v.x -= speed * Math.cos(t * 0.0003);
        v.y -= speed * Math.sin(t * 0.0004);
        clampView();
      }
      draw(t);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [draw, demoMode, clampView]);

  // Wheel zoom to center
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (demoMode) return;
      const { w, h } = sizeRef.current;
      const cx = w / 2, cy = h / 2;
      const v = viewRef.current;
      const f = e.deltaY > 0 ? 0.9 : 1.1;
      const ns = Math.max(minScale(), Math.min(5, v.s * f));
      const k = ns / v.s;
      v.x = cx - (cx - v.x) * k;
      v.y = cy - (cy - v.y) * k;
      v.s = ns;
      clampView();
    };
    cv.addEventListener('wheel', handler, { passive: false });
    return () => cv.removeEventListener('wheel', handler);
  }, [clampView, minScale, demoMode]);

  // Drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (demoMode) return;
    const cv = canvasRef.current;
    if (!cv) return;
    cv.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y, moved: 0 };
  }, [demoMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (demoMode) return;
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    if (d.moved > 6) {
      viewRef.current.x = d.vx + dx;
      viewRef.current.y = d.vy + dy;
      clampView();
    }
  }, [clampView, demoMode]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (demoMode) return;
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.moved > 6 || !onMarkerClick) return;
    // Click — find nearest marker
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const v = viewRef.current;
    let best: MapMarker | null = null, bestD = 30;
    for (const m of markers) {
      const mp = geoToMap(m.lat, m.lng);
      const sx = mp.x * v.s + v.x, sy = mp.y * v.s + v.y;
      const dist = Math.hypot(cx - sx, cy - sy);
      if (dist < bestD) { bestD = dist; best = m; }
    }
    if (best) onMarkerClick(best);
  }, [markers, onMarkerClick, demoMode]);

  const zoomBtn = useCallback((dir: 1 | -1) => {
    const v = viewRef.current;
    const { w, h } = sizeRef.current;
    const f = dir === 1 ? 1.3 : 0.77;
    const ns = Math.max(minScale(), Math.min(5, v.s * f));
    const k = ns / v.s;
    const cx = w / 2, cy = h / 2;
    v.x = cx - (cx - v.x) * k;
    v.y = cy - (cy - v.y) * k;
    v.s = ns;
    clampView();
    forceRender(n => n + 1);
  }, [clampView, minScale]);

  const recenter = useCallback(() => {
    const { w, h } = sizeRef.current;
    const v = viewRef.current;
    if (userLocation) {
      const mp = geoToMap(userLocation.lat, userLocation.lng);
      v.s = Math.max(v.s, 2.0);
      v.x = w / 2 - mp.x * v.s;
      v.y = h / 2 - mp.y * v.s;
    } else {
      v.s = Math.min(w / MW, h / MH) * 1.2;
      v.x = w / 2 - (MW / 2) * v.s;
      v.y = h / 2 - (MH / 2) * v.s;
    }
    clampView();
    forceRender(n => n + 1);
  }, [clampView, userLocation]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#161210' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: demoMode ? 'default' : dragRef.current ? 'grabbing' : 'grab', pointerEvents: demoMode ? 'none' : 'auto' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {/* Zoom controls */}
      {!demoMode && (
        <div style={{ position: 'absolute', right: 12, bottom: 60, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 25 }}>
          <button onClick={() => zoomBtn(1)} style={{ width:36,height:36,background:'var(--surface)',border:'2px solid var(--line)',color:'var(--fg)',fontFamily:'var(--px)',fontSize:12,boxShadow:'2px 2px 0 var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }} aria-label="Zoom in">+</button>
          <button onClick={() => zoomBtn(-1)} style={{ width:36,height:36,background:'var(--surface)',border:'2px solid var(--line)',color:'var(--fg)',fontFamily:'var(--px)',fontSize:12,boxShadow:'2px 2px 0 var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }} aria-label="Zoom out">−</button>
          <button onClick={recenter} style={{ width:36,height:36,background:'var(--surface)',border:'2px solid var(--line)',color:'var(--fg)',fontFamily:'var(--px)',fontSize:7,boxShadow:'2px 2px 0 var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }} aria-label="Center">ME</button>
        </div>
      )}
    </div>
  );
}
