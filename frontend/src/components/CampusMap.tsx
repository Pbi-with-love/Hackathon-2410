import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import campusMapUrl from '../assets/campus-map.svg';
import { HACKATHON_ZONES } from '../lib/mapConstants';

const MAP_BASE_WIDTH = 1100;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.5;
const ZOOM_STEP = 0.12;

interface CampusMapProps {
  children?: ReactNode;
}

export default function CampusMap({ children }: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = pan;
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const [imgAspect, setImgAspect] = useState(0.7);

  // Load image to get aspect ratio + center on mount
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspect = img.naturalHeight / img.naturalWidth;
      setImgAspect(aspect);
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const mapH = MAP_BASE_WIDTH * aspect;
      setPan({ x: (cw - MAP_BASE_WIDTH) / 2, y: (ch - mapH) / 2 });
    };
    img.src = campusMapUrl;
  }, []);

  // Non-passive wheel listener for zoom-to-cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dir = e.deltaY > 0 ? -1 : 1;

      setZoom((prev) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + dir * ZOOM_STEP));
        const ratio = next / prev;
        setPan((p) => ({
          x: cx - (cx - p.x) * ratio,
          y: cy - (cy - p.y) * ratio,
        }));
        return next;
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setPan({
        x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
      });
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  const zoomTo = useCallback((dir: 1 | -1) => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + dir * ZOOM_STEP * 2.5));
      const el = containerRef.current;
      if (el) {
        const cx = el.clientWidth / 2;
        const cy = el.clientHeight / 2;
        const ratio = next / prev;
        setPan((p) => ({
          x: cx - (cx - p.x) * ratio,
          y: cy - (cy - p.y) * ratio,
        }));
      }
      return next;
    });
  }, []);

  const recenter = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const mapH = MAP_BASE_WIDTH * imgAspect;
    setZoom(1);
    setPan({ x: (cw - MAP_BASE_WIDTH) / 2, y: (ch - mapH) / 2 });
  }, [imgAspect]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: '#1a1814', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Transformable map layer */}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <div className="relative" style={{ width: `${MAP_BASE_WIDTH}px` }}>
          {/* Dark-filtered campus image */}
          <img
            src={campusMapUrl}
            alt="Tampere University Hervanta Campus"
            draggable={false}
            className="block w-full pointer-events-none"
          />

          {/* Zone labels */}
          {HACKATHON_ZONES.map((zone) => (
            <div
              key={zone.id}
              className="absolute pointer-events-none"
              style={{
                left: `${zone.left}%`,
                top: `${zone.top}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className="block whitespace-nowrap"
                style={{
                  fontFamily: '"Courier New", "Courier", monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#c4b99a',
                  background: 'rgba(30, 25, 20, 0.82)',
                  padding: '2px 7px',
                  border: '1px solid rgba(100, 90, 70, 0.35)',
                  letterSpacing: '0.3px',
                }}
              >
                {zone.name}
              </span>
            </div>
          ))}

          {/* Street labels */}
          <span
            className="absolute pointer-events-none"
            style={{
              left: '32%',
              top: '10%',
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              color: 'rgba(160, 150, 130, 0.5)',
              letterSpacing: '2px',
            }}
          >
            Tekniikankatu
          </span>
          <span
            className="absolute pointer-events-none"
            style={{
              left: '25%',
              top: '88%',
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              color: 'rgba(160, 150, 130, 0.5)',
              letterSpacing: '2px',
            }}
          >
            Hermiankatu
          </span>
          <span
            className="absolute pointer-events-none"
            style={{
              left: '70%',
              top: '43%',
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              color: 'rgba(160, 150, 130, 0.5)',
              letterSpacing: '2px',
            }}
          >
            Korkeakoulunkatu
          </span>

          {/* Map markers from parent */}
          {children}
        </div>
      </div>

      {/* Custom controls — fixed to viewport */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => zoomTo(1)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 36, height: 36,
            background: 'var(--surface)',
            border: '2px solid var(--line)',
            borderRadius: 0,
            fontFamily: 'var(--px)',
            fontSize: 12,
            color: 'var(--fg)',
            boxShadow: '2px 2px 0 var(--ink)',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(1px,1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0 var(--ink)'; }}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => zoomTo(-1)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 36, height: 36,
            background: 'var(--surface)',
            border: '2px solid var(--line)',
            borderRadius: 0,
            fontFamily: 'var(--px)',
            fontSize: 12,
            color: 'var(--fg)',
            boxShadow: '2px 2px 0 var(--ink)',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(1px,1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0 var(--ink)'; }}
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
      <button
        onClick={recenter}
        className="absolute right-4 bottom-6 flex items-center justify-center cursor-pointer z-10"
        style={{
          width: 36, height: 36,
          background: 'var(--surface)',
          border: '2px solid var(--line)',
          borderRadius: 0,
          fontFamily: 'var(--px)',
          fontSize: 12,
          color: 'var(--fg)',
          boxShadow: '2px 2px 0 var(--ink)',
        }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(1px,1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0 var(--ink)'; }}
        aria-label="Center on me"
      >
        ME
      </button>
    </div>
  );
}
