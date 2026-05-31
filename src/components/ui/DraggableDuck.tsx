'use client';
import { useEffect, useRef, useState, RefObject } from 'react';
import Image from 'next/image';

const DUCK_SIZE = 62;

interface Props {
  anchorRef: RefObject<HTMLElement | null>;
}

export function DraggableDuck({ anchorRef }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const duckRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/quack.mp3');
    audio.volume = 0.4;
    audio.preload = 'auto';
    audio.load();
    audioRef.current = audio;
  }, []);

  const playQuack = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!anchorRef.current) return;
    const rects = anchorRef.current.getClientRects();
    const lastLine = rects[rects.length - 1];
    setPos({
      x: lastLine.right + 8,
      y: lastLine.top + (lastLine.height - DUCK_SIZE) / 2,
    });
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!duckRef.current) return;
    const rect = duckRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y });
    };
    const onUp = (e: MouseEvent) => {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      // Treat as click if mouse barely moved
      if (Math.sqrt(dx * dx + dy * dy) < 5) playQuack();
      setDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  if (!ready) return null;

  return (
    <div
      ref={duckRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: 9999,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <Image
        src="/duck.png"
        alt="Duck mascot"
        width={DUCK_SIZE}
        height={DUCK_SIZE}
        draggable={false}
        priority
      />
    </div>
  );
}
