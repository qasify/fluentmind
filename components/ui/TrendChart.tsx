"use client";

import { motion } from "framer-motion";

interface ChartDataPoint {
  label: string | number;
  value: number;
  color?: string;
  tooltip?: string;
}

interface TrendChartProps {
  data: ChartDataPoint[];
  maxValue?: number;
  height?: string;
  showLabels?: boolean;
  showValues?: boolean;
}

export function TrendChart({
  data,
  maxValue,
  height = "h-48",
  showLabels = true,
  showValues = true,
}: TrendChartProps) {
  // If no maxValue provided, find the max in data (min 1 to avoid division by zero)
  const effectiveMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex items-end gap-1.5 ${height} w-full px-2`}>
      {data.map((item, i) => {
        // Calculate height percentage relative to maxValue
        const heightPct = (item.value / effectiveMax) * 100;

        // Default color logic if not provided
        const colorClass = item.color || (
          item.value >= 80 ? "bg-success-400" :
            item.value >= 60 ? "bg-warning-400" :
              "bg-danger-400"
        );

        return (
          <div key={i} className="flex-1 h-full flex flex-col group min-w-0">
            {/* Value Label */}
            <div className="h-5 flex items-center justify-center mb-1">
              {showValues && (
                <span className="text-[10px] font-bold text-[#f0f0f5] opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.value}
                </span>
              )}
            </div>

            {/* Bar Container */}
            <div className="flex-1 w-full flex items-end justify-center relative bg-white/[0.02] rounded-t-lg overflow-hidden border-x border-t border-transparent group-hover:border-white/5 transition-colors">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 4)}%` }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1] // easeOutQuart
                }}
                className={`w-full max-w-[24px] rounded-t-md ${colorClass} relative`}
                title={item.tooltip || `${item.label}: ${item.value}`}
              >
                {/* Visual Polish: Flare at the top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 rounded-t-md" />

                {/* Glow Effect */}
                <div className={`absolute inset-0 blur-sm opacity-20 ${colorClass} rounded-t-md pointer-events-none`} />
              </motion.div>
            </div>

            {/* Bottom Label */}
            <div className="h-7 flex items-center justify-center overflow-hidden">
              {showLabels && (
                <span className="text-[9px] text-[#6b6b80] font-bold uppercase tracking-tight truncate px-1">
                  {item.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
