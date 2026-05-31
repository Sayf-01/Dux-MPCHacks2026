'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity } from '@/types/itinerary';

interface MapPanelProps {
  activities: Activity[];
  area: string;
}

export function MapPanel({ activities, area }: MapPanelProps) {
  const normalContainerRef = useRef<HTMLDivElement>(null);
  const fsContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsAnimated, setFsAnimated] = useState(false); // drives enter/exit CSS transition
  const [mounted, setMounted] = useState(false);
  const geoActs = activities.filter((a) => a.lat != null && a.lng != null);
  const actKey = activities.map((a) => a._k).join(',');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFsAnimated(false);
        setTimeout(() => setIsFullscreen(false), 220);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isFullscreen]);

  // Trigger enter animation one frame after portal mounts
  useEffect(() => {
    if (isFullscreen) {
      requestAnimationFrame(() => requestAnimationFrame(() => setFsAnimated(true)));
    }
  }, [isFullscreen]);

  const handleClose = () => {
    setFsAnimated(false);
    setTimeout(() => setIsFullscreen(false), 220);
  };

  const buildMap = useCallback(async (container: HTMLDivElement) => {
    if (!container || !geoActs.length) return;
    const L = (await import('leaflet')).default;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const center: [number, number] = [
      geoActs.reduce((s, a) => s + a.lat!, 0) / geoActs.length,
      geoActs.reduce((s, a) => s + a.lng!, 0) / geoActs.length,
    ];

    const map = L.map(container, { zoomControl: true, attributionControl: false }).setView(center, 14);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    if (geoActs.length > 1) {
      L.polyline(geoActs.map((a) => [a.lat!, a.lng!] as [number, number]), {
        color: '#e53935', weight: 2, dashArray: '6 6', opacity: 0.85,
      }).addTo(map);

      for (let i = 0; i < geoActs.length - 1; i++) {
        const a = geoActs[i], b = geoActs[i + 1];
        const midLat = (a.lat! + b.lat!) / 2;
        const midLng = (a.lng! + b.lng!) / 2;
        const R = 6371;
        const dLat = (b.lat! - a.lat!) * Math.PI / 180;
        const dLng = (b.lng! - a.lng!) * Math.PI / 180;
        const hav = Math.sin(dLat / 2) ** 2 +
          Math.cos(a.lat! * Math.PI / 180) * Math.cos(b.lat! * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
        const mins = Math.max(1, Math.round(km / 5 * 60));
        const label = mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h ${mins % 60}m`;
        L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="display:inline-block;background:white;border:1px solid #ccc;border-radius:999px;padding:2px 6px;font-size:9px;font-weight:700;color:#111;font-family:system-ui,sans-serif;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);line-height:1.4;transform:translate(-50%,-130%)">${label}</div>`,
            iconSize: undefined, iconAnchor: [0, 0],
          }),
          interactive: false,
        }).addTo(map);
      }
    }

    geoActs.forEach((act, i) => {
      L.marker([act.lat!, act.lng!], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:#E6C146;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:system-ui,sans-serif">${i + 1}</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        }),
      }).bindPopup(`<b style="font-family:system-ui">${act.name}</b>`).addTo(map);
    });

    if (geoActs.length > 1) {
      map.fitBounds(L.latLngBounds(geoActs.map((a) => [a.lat!, a.lng!] as [number, number])), { padding: [24, 24] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actKey]);

  // Init map in normal container
  useEffect(() => {
    if (!normalContainerRef.current || isFullscreen) return;
    buildMap(normalContainerRef.current);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actKey]);

  // Re-init whenever fullscreen container becomes available or fullscreen closes
  useEffect(() => {
    if (!isFullscreen && normalContainerRef.current) {
      buildMap(normalContainerRef.current);
    }
    if (isFullscreen) {
      // fsContainerRef is set by the portal — wait one tick for the DOM to commit
      setTimeout(() => { if (fsContainerRef.current) buildMap(fsContainerRef.current); }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  const expandBtn = (
    <button
      onClick={() => setIsFullscreen(true)}
      title="Expand map"
      className="absolute top-2 right-2 z-[1000] w-8 h-8 rounded-lg bg-white/90 hover:bg-white border border-line shadow-card-sm flex items-center justify-center transition"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    </button>
  );

  const collapseBtn = (
    <button
      onClick={handleClose}
      title="Collapse map"
      className="absolute top-3 right-3 z-[1000] w-9 h-9 rounded-lg bg-white/90 hover:bg-white border border-line shadow-card-sm flex items-center justify-center transition"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
      </svg>
    </button>
  );

  const stopsBadge = (geoActs.length > 0) && (
    <div className="absolute bottom-3 left-3 z-[1000] bg-[#1C1410]/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
      📍 {geoActs.length} stops · {area}
    </div>
  );

  return (
    <>
      {/* Normal (small) map */}
      <div className="relative rounded-2xl overflow-hidden border border-line bg-surface-2" style={{ height: 220 }}>
        {!geoActs.length && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-3">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="opacity-30">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span className="text-sm font-semibold">No map data</span>
          </div>
        )}
        <div ref={normalContainerRef} className={`h-full w-full ${isFullscreen ? 'invisible' : ''}`} />
        {!isFullscreen && expandBtn}
        {!isFullscreen && stopsBadge}
      </div>

      {/* Fullscreen portal — rendered at document.body to escape any stacking context */}
      {mounted && isFullscreen && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          style={{
            opacity: fsAnimated ? 1 : 0,
            transform: fsAnimated ? 'scale(1)' : 'scale(0.97)',
            transition: 'opacity 200ms ease, transform 200ms ease',
          }}
        >
          <div ref={fsContainerRef} className="h-full w-full" />
          {collapseBtn}
          {stopsBadge}
        </div>,
        document.body,
      )}
    </>
  );
}
