'use client';
import { useEffect, useRef } from 'react';
import { Activity } from '@/types/itinerary';

interface MapPanelProps {
  activities: Activity[];
  area: string;
}

export function MapPanel({ activities, area }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const geoActs = activities.filter((a) => a.lat != null && a.lng != null);

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

      geoActs.forEach((act, i) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:#FFD74E;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:system-ui,sans-serif">${i + 1}</div>`,
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
    <div className="relative rounded-2xl overflow-hidden border border-line" style={{ height: 220 }}>
      {!geoActs.length && (
        <div className="absolute inset-0 bg-surface-2 flex flex-col items-center justify-center gap-2 text-ink-3">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="opacity-30">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm font-semibold">No map data</span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
      {geoActs.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#1C1410]/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          📍 {geoActs.length} stops · {area}
        </div>
      )}
    </div>
  );
}
