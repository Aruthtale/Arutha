import React from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface StatRadarProps {
  chartData: { subject: string; A: number }[];
  dominantColor: string;
}

export const StatRadar = React.memo(({ chartData, dominantColor }: StatRadarProps) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-[280px] max-w-[280px] mx-auto relative mb-4">
      <div className="absolute inset-0 bg-current/5 blur-[40px] rounded-full pointer-events-none" style={{ color: dominantColor }} />
      {isReady ? (
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#333" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: '900' }} />
            <Radar
              name="Player"
              dataKey="A"
              stroke={dominantColor}
              fill={dominantColor}
              fillOpacity={0.3}
              strokeWidth={3}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-dashed border-neutral-800 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});
