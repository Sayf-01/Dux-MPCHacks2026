'use client';
import { useState, useRef } from 'react';
import { TripItinerary } from '@/types/itinerary';

interface ExportButtonProps {
  trip: TripItinerary;
}

const CAT_EMOJI: Record<string, string> = {
  food: '🍽', art: '🎨', nature: '🌿', nightlife: '🌙',
  views: '🏙', shopping: '🛍', hidden: '💎', attraction: '📍',
};

function buildPrintHTML(trip: TripItinerary): string {
  const dayPages = trip.days.map((day) => {
    const bySlot = (slot: string) => day.activities.filter((a) => a.time === slot);
    const slots = ['Morning', 'Afternoon', 'Evening'];

    const slotsHTML = slots.map((slot) => {
      const acts = bySlot(slot);
      if (!acts.length) return '';
      const actsHTML = acts.map((a) => `
        <div class="activity">
          <span class="act-icon">${CAT_EMOJI[a.category] || '📍'}</span>
          <div class="act-body">
            <div class="act-name">${a.name}</div>
            <div class="act-meta">${a.dur}${a.cost > 0 ? ` · $${a.cost}/person` : ''} · ${a.blurb}</div>
          </div>
        </div>`).join('');
      return `<div class="slot"><div class="slot-label">${slot}</div>${actsHTML}</div>`;
    }).join('');

    const totalCost = day.activities.reduce((s, a) => s + a.cost, 0);

    return `
      <div class="page">
        <div class="page-header">
          <div class="brand">DUX Travel Guide</div>
          <div class="day-label">Day ${day.day} · ${day.area}</div>
          <div class="theme">${day.theme}</div>
          ${totalCost > 0 ? `<div class="cost-badge">💳 $${totalCost} estimated / day</div>` : ''}
        </div>
        <div class="slots">${slotsHTML}</div>
        <div class="page-footer">${trip.destination} · ${trip.days.length}-day itinerary</div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>DUX — ${trip.destination} Trip</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #fff; color: #1C1410; }
  .page {
    width: 100%; min-height: 100vh; padding: 52px 64px 44px;
    display: flex; flex-direction: column;
    break-after: page; page-break-after: always;
  }
  .page:last-child { break-after: avoid; page-break-after: avoid; }
  .brand { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .18em; color: #bbb; margin-bottom: 20px; }
  .day-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: #B8860B; margin-bottom: 6px; }
  .theme { font-size: 38px; font-weight: 800; line-height: 1.1; margin-bottom: 12px; }
  .cost-badge { display: inline-block; font-size: 12px; font-weight: 700; background: #FFF7E0; border: 1px solid #F0DFA0; border-radius: 999px; padding: 4px 14px; color: #7A5C00; }
  .page-header { margin-bottom: 40px; }
  .slots { flex: 1; display: flex; flex-direction: column; gap: 32px; }
  .slot-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; color: #999; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
  .activity { display: flex; gap: 14px; margin-bottom: 14px; }
  .act-icon { font-size: 20px; flex-shrink: 0; width: 30px; text-align: center; }
  .act-body { flex: 1; }
  .act-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .act-meta { font-size: 12px; color: #777; line-height: 1.6; }
  .page-footer { margin-top: auto; padding-top: 24px; font-size: 10px; font-weight: 600; color: #ccc; text-align: center; border-top: 1px solid #f0f0f0; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>${dayPages}</body>
</html>`;
}

export function ExportButton({ trip }: ExportButtonProps) {
  const [showAlert, setShowAlert] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const buildBlob = () => {
    const html = buildPrintHTML(trip);
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = new Blob([html], { type: 'text/html' });
    blobUrlRef.current = URL.createObjectURL(blob);
  };

  const handleShare = () => {
    buildBlob();
    setShowAlert(true);
  };

  const handleSaveAsPDF = () => {
    const html = buildPrintHTML(trip);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

  const handleDownload = () => {
    if (!blobUrlRef.current) buildBlob();
    const a = document.createElement('a');
    a.href = blobUrlRef.current!;
    a.download = `dux-${trip.destination.toLowerCase().replace(/\s+/g, '-')}-itinerary.html`;
    a.click();
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="px-4 py-2.5 rounded-full border border-line-2 text-sm font-bold text-ink bg-surface hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm"
      >
        Share
      </button>

      {showAlert && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAlert(false)} />
          <div className="relative bg-surface border border-line rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-accent-soft rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl">
              🎉
            </div>
            <h3 className="font-display text-xl font-bold text-ink mb-2">Ready to share!</h3>
            <p className="text-sm font-semibold text-ink-2 leading-relaxed mb-6">
              You can now share the file with your friends!<br />
              Each day is a separate page — save as PDF or download the file.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAsPDF}
                className="w-full h-11 rounded-full bg-accent text-white font-bold text-sm hover:-translate-y-0.5 transition shadow-btn"
              >
                Save as PDF
              </button>
              <button
                onClick={handleDownload}
                className="w-full h-11 rounded-full border border-line-2 text-ink font-bold text-sm hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm"
              >
                Download file
              </button>
              <button
                onClick={() => setShowAlert(false)}
                className="w-full h-11 rounded-full text-ink-3 font-semibold text-sm hover:text-ink transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
