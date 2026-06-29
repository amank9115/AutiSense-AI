"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Child-friendly screening activities
type GameModule = "balloon" | "star" | "butterfly" | "rainbow";

interface GameActivityProps {
  module: GameModule;
  onComplete: (score: number) => void;
  onInteraction: (metrics: { attention: number; responseTime: number }) => void;
}

interface StarProps {
  x: number;
  y: number;
  delay: number;
  onClick: () => void;
}

const Star: React.FC<StarProps> = ({ x, y, delay, onClick }) => (
  <motion.div
    className="absolute cursor-pointer"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
  >
    <span className="text-5xl">⭐</span>
  </motion.div>
);

const Balloon: React.FC<{ color: string; x: number; onClick: () => void }> = ({
  color,
  x,
  onClick,
}) => (
  <motion.div
    className="absolute bottom-0 cursor-pointer"
    style={{ left: `${x}%` }}
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: -400, opacity: 1 }}
    transition={{ duration: 4, ease: "linear" }}
    onClick={onClick}
  >
    <span className="text-6xl">{color === "red" ? "🎈" : color === "blue" ? "🟢" : "🎈"}</span>
  </motion.div>
);

const Butterfly: React.FC<{ startX: number; onClick: () => void }> = ({
  startX,
  onClick,
}) => (
  <motion.div
    className="absolute cursor-pointer"
    style={{ top: "30%", left: `${startX}%` }}
    animate={{
      x: [0, 100, -50, 150, 0],
      y: [0, -30, 20, -10, 0],
    }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    onClick={onClick}
  >
    <motion.span
      className="text-5xl inline-block"
      animate={{ rotateY: [0, 180, 0] }}
      transition={{ duration: 0.5, repeat: Infinity }}
    >
      🦋
    </motion.span>
  </motion.div>
);

/**
 * Child-friendly screening game component
 * Uses interactive activities to engage children during screening
 */
const ScreeningGame: React.FC<GameActivityProps> = ({
  module,
  onComplete,
  onInteraction,
}) => {
  const [score, setScore] = useState(0);
  const [interactions, setInteractions] = useState(0);
  const [startTime] = useState(Date.now());
  const [items, setItems] = useState<Array<{ id: number; x: number; y?: number; delay: number }>>([]);
  const [completed, setCompleted] = useState(false);

  // Generate items based on module
  useEffect(() => {
    const generateItems = () => {
      const newItems = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 60,
        delay: i * 0.3,
      }));
      setItems(newItems);
    };

    generateItems();
  }, [module]);

  const handleInteraction = useCallback(() => {
    const responseTime = Date.now() - startTime;
    const newScore = score + 10;
    const newInteractions = interactions + 1;

    setScore(newScore);
    setInteractions(newInteractions);

    onInteraction({
      attention: Math.min(100, 50 + newInteractions * 5),
      responseTime: responseTime / newInteractions,
    });

    // Check completion
    if (newInteractions >= 5 && !completed) {
      setCompleted(true);
      onComplete(newScore);
    }
  }, [score, interactions, startTime, completed, onComplete, onInteraction]);

  const renderModule = () => {
    switch (module) {
      case "star":
        return (
          <div className="relative w-full h-64 bg-gradient-to-b from-indigo-900 to-purple-900 rounded-2xl overflow-hidden">
            <p className="text-white text-center pt-4 font-bold">Tap the stars! ⭐</p>
            {items.map((item) => (
              <Star
                key={item.id}
                x={item.x}
                y={item.y ?? 0}
                delay={item.delay}
                onClick={handleInteraction}
              />
            ))}
          </div>
        );

      case "balloon":
        return (
          <div className="relative w-full h-64 bg-gradient-to-b from-sky-400 to-sky-600 rounded-2xl overflow-hidden">
            <p className="text-white text-center pt-4 font-bold">Pop the balloons! 🎈</p>
            {[0, 25, 50, 75].map((x, i) => (
              <Balloon
                key={i}
                color={i % 2 === 0 ? "red" : "blue"}
                x={x + 10}
                onClick={handleInteraction}
              />
            ))}
          </div>
        );

      case "butterfly":
        return (
          <div className="relative w-full h-64 bg-gradient-to-b from-green-300 to-emerald-500 rounded-2xl overflow-hidden">
            <p className="text-white text-center pt-4 font-bold">Catch the butterfly! 🦋</p>
            <Butterfly startX={20} onClick={handleInteraction} />
            <Butterfly startX={60} onClick={handleInteraction} />
          </div>
        );

      case "rainbow":
        return (
          <div className="relative w-full h-64 bg-gradient-to-b from-violet-400 to-pink-400 rounded-2xl overflow-hidden">
            <p className="text-white text-center pt-4 font-bold">
              Touch the rainbow colors! 🌈
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              {["red", "orange", "yellow", "green", "blue"].map((color, i) => (
                <motion.div
                  key={color}
                  className={`w-16 h-16 rounded-full cursor-pointer mx-1`}
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={handleInteraction}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!completed ? (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderModule()}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-lg font-bold text-primary">
                Score: <span className="text-2xl">{score}</span> ⭐
              </div>
              <div className="text-sm text-on-surface-muted">
                {interactions}/5 interactions
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <span className="text-6xl">🎉</span>
            <h3 className="text-2xl font-bold text-primary mt-4">
              Great Job!
            </h3>
            <p className="text-on-surface-variant mt-2">
              You earned {score} stars!
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.min(5, Math.floor(score / 10)) }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-3xl"
                >
                  ⭐
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScreeningGame;

// Available game modules with descriptions
export const GAME_MODULES = [
  {
    id: "star",
    name: "Star Catch",
    description: "Tap the stars as they appear",
    icon: "⭐",
    duration: 30,
  },
  {
    id: "balloon",
    name: "Balloon Pop",
    description: "Pop the floating balloons",
    icon: "🎈",
    duration: 30,
  },
  {
    id: "butterfly",
    name: "Butterfly Chase",
    description: "Catch the flying butterflies",
    icon: "🦋",
    duration: 30,
  },
  {
    id: "rainbow",
    name: "Rainbow Colors",
    description: "Touch all the rainbow colors",
    icon: "🌈",
    duration: 25,
  },
];
