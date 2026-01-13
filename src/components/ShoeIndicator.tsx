'use client';

import { Spade } from 'lucide-react';

interface ShoeIndicatorProps {
  remaining: number;
  total: number;
}

export default function ShoeIndicator({ remaining, total }: ShoeIndicatorProps) {
  const percentage = Math.round((remaining / total) * 100);
  const shouldShuffle = percentage <= 25;

  return (
    <div className="fixed left-4 top-20 bg-[rgba(7,10,20,0.75)] backdrop-blur-xl px-4 py-3 rounded-xl border border-white/15 z-50 flex items-center gap-3">
      <Spade className="w-5 h-5 text-[#7C3AED]" />
      <div className="flex items-center gap-3">
        <div className="text-white font-bold text-lg">{remaining}</div>
        <div className={`text-sm font-semibold ${shouldShuffle ? 'text-[#f59e0b]' : 'text-white/70'}`}>
          {percentage}%
        </div>
      </div>
    </div>
  );
}
