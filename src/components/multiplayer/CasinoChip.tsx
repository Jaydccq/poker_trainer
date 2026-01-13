"use client";

interface CasinoChipProps {
  value: number;
  count?: number;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const CHIP_COLORS: Record<number, { bg: string; border: string; accent: string }> = {
  5: { bg: "bg-red-600", border: "border-red-800", accent: "bg-red-400" },
  10: { bg: "bg-blue-600", border: "border-blue-800", accent: "bg-blue-400" },
  25: { bg: "bg-green-600", border: "border-green-800", accent: "bg-green-400" },
  50: { bg: "bg-orange-600", border: "border-orange-800", accent: "bg-orange-400" },
  100: { bg: "bg-gray-900", border: "border-gray-700", accent: "bg-gray-600" },
  500: { bg: "bg-purple-600", border: "border-purple-800", accent: "bg-purple-400" },
};

export function CasinoChip({ value, count, onClick, selected = false, className = "" }: CasinoChipProps) {
  const colors = CHIP_COLORS[value] || CHIP_COLORS[100];

  return (
    <button
      onClick={onClick}
      className={`
        relative w-16 h-16 rounded-full cursor-pointer
        transition-all duration-200
        ${onClick ? "hover:opacity-90" : ""}
        ${selected ? "ring-4 ring-yellow-400/60" : ""}
        ${!onClick ? "opacity-50 grayscale cursor-not-allowed" : ""}
        ${className}
      `}
      disabled={!onClick}
    >
      {/* Chip Stack Effect */}
      {count && count > 1 && (
        <>
          <div className={`absolute inset-0 rounded-full ${colors.bg} ${colors.border} border-4 -top-0.5 opacity-60`} />
          <div className={`absolute inset-0 rounded-full ${colors.bg} ${colors.border} border-4 -top-1 opacity-40`} />
        </>
      )}

      {/* Main Chip */}
      <div className={`absolute inset-0 rounded-full ${colors.bg} ${colors.border} border-4 shadow-2xl`}>
        {/* Inner ring */}
        <div className="absolute inset-2 rounded-full border-2 border-white/30" />

        {/* Edge spots */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${colors.accent}`}
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 45}deg) translateY(-24px) translateX(-4px)`,
              }}
            />
          ))}
        </div>

        {/* Value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white font-bold text-lg drop-shadow-lg">
            ${value}
          </div>
        </div>

        {/* Count badge */}
        {count && count > 1 && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-gray-900 font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-yellow-600 shadow-lg">
            {count}
          </div>
        )}
      </div>
    </button>
  );
}
