// src/components/AnimatedScore.tsx
import { useState, useEffect } from 'react';

interface AnimatedScoreProps {
  score: number;
  playerName: string;
  isCurrentPlayer?: boolean;
}

export default function AnimatedScore({
  score,
  playerName,
  isCurrentPlayer = false
}: AnimatedScoreProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          {playerName}
        </h3>
        <div className="text-lg mb-2 font-bold text-gray-800">
          Score: {score}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-2 text-gray-800">
        {playerName}
      </h3>
      <div className="text-lg mb-2 font-bold text-gray-800">
        Score: {score}
      </div>
    </div>
  );
}