import React from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useStore } from '../../store/useStore';

interface StatRadarProps {
  chartData: { subject: string; A: number }[];
  dominantColor: string;
}

export const StatRadar = React.memo(({ chartData, dominantColor }: StatRadarProps) => {
  const [isReady, setIsReady] = React.useState(false);
  const theme = useStore(state => state.theme);
  const isLight = theme === 'DIVINE';

  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-[280px] h-[280px] mx-auto relative mb-4">
      <div className="absolute inset-0 bg-current/5 blur-[40px] rounded-full pointer-events-none" style={{ color: dominantColor }} />
      {isReady && (
        <RadarChart cx="50%" cy="50%" outerRadius="70%" width={280} height={280} data={chartData}>
          <PolarGrid stroke={isLight ? "#cbd5e1" : "var(--rpg-text)"} strokeOpacity={isLight ? 0.8 : 0.15} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: isLight ? '#475569' : 'var(--rpg-text)', 
              opacity: 1, 
              fontSize: 11, 
              fontWeight: '900' 
            }} 
          />
          <Radar
            name="Player"
            dataKey="A"
            stroke={dominantColor}
            fill={dominantColor}
            fillOpacity={isLight ? 0.4 : 0.3}
            strokeWidth={3}
            isAnimationActive={false}
          />
        </RadarChart>
      )}
    </div>
  );
});
