'use client';
import { useEffect, useRef, useState } from 'react';
import { Activity } from '@/types/itinerary';

interface MapPanelProps {
  activities: Activity[];
  area: string;
}

export function MapPanel({ activities, area }: MapPanelProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const geoActs = activities.filter((a) => a.lat != null && a.lng != null);

  // Track native fullscreen state changes (Esc key, etc.)
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      outerRef.current?.requestFullscreen();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || !geoActs.length) return;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const center: [number, number] = [
        geoActs.reduce((s, a) => s + a.lat!, 0) / geoActs.length,
        geoActs.reduce((s, a) => s + a.lng!, 0) / geoActs.length,
      ];

      const map = L.map(containerRef.current!, { zoomControl: true, attributionControl: false }).setView(center, 14);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      if (geoActs.length > 1) {
        const latlngs = geoActs.map((a) => [a.lat!, a.lng!] as [number, number]);
        L.polyline(latlngs, {
          color: '#e53935',
          weight: 2,
          dashArray: '6 6',
          opacity: 0.85,
        }).addTo(map);

        // Travel-time labels at the midpoint of each segment
        for (let i = 0; i < geoActs.length - 1; i++) {
          const a = geoActs[i];
          const b = geoActs[i + 1];
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

          const timeIcon = L.divIcon({
            className: '',
            html: `<div style="display:inline-block;background:white;border:1px solid #ccc;border-radius:999px;padding:2px 6px;font-size:9px;font-weight:700;color:#111;font-family:system-ui,sans-serif;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);line-height:1.4;transform:translate(-50%,-130%)">${label}</div>`,
            iconSize: undefined,
            iconAnchor: [0, 0],
          });
          L.marker([midLat, midLng], { icon: timeIcon, interactive: false }).addTo(map);
        }
      }

      geoActs.forEach((act, i) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:#E6C146;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:system-ui,sans-serif">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker([act.lat!, act.lng!], { icon })
          .bindPopup(`<b style="font-family:system-ui">${act.name}</b>`)
          .addTo(map);
      });

      if (geoActs.length > 1) {
        map.fitBounds(
          L.latLngBounds(geoActs.map((a) => [a.lat!, a.lng!] as [number, number])),
          { padding: [24, 24] }
        );
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.map((a) => `${a._k}`).join(',')]);

  return (
    <div
      ref={outerRef}
      className="relative rounded-2xl overflow-hidden border border-line bg-surface-2"
      style={{ height: 220 }}
    >
      {!geoActs.length && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-3">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="opacity-30">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm font-semibold">No map data</span>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" />

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        className="absolute top-2 right-2 z-[1000] w-8 h-8 rounded-lg bg-white/90 hover:bg-white border border-line shadow-card-sm flex items-center justify-center transition"
      >
        {isFullscreen ? (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>

      {geoActs.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#1C1410]/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          📍 {geoActs.length} stops · {area}
        </div>
      )}
    </div>
  );
}
