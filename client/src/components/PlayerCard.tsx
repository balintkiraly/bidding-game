import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { coinFormat } from "../App";

type Player = {
  name: string;
  avatar: string;
  coins: number;
  trophies: number;
  online: boolean;
};

interface PlayerCardProps {
  player: Player;
  lost?: boolean;
  won?: boolean;
}

const popAnimation = {
  initial: { scale: 1, color: "#000" },
  animate: { scale: [1, 1.4, 1], color: ["#000", "#16a34a", "#000"] },
  transition: { duration: 0.5 },
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player, lost = false, won = false}) => {
  const [coinsChanged, setCoinsChanged] = useState(false);
  const [trophiesChanged, setTrophiesChanged] = useState(false);

  const [prevCoins, setPrevCoins] = useState(player.coins);
  const [prevTrophies, setPrevTrophies] = useState(player.trophies);

  useEffect(() => {
    if (player.coins !== prevCoins) {
      setCoinsChanged(true);
      setPrevCoins(player.coins);
      const timer = setTimeout(() => setCoinsChanged(false), 600);
      return () => clearTimeout(timer);
    }
  }, [player.coins, prevCoins]);

  useEffect(() => {
    if (player.trophies !== prevTrophies) {
      setTrophiesChanged(true);
      setPrevTrophies(player.trophies);
      const timer = setTimeout(() => setTrophiesChanged(false), 600);
      return () => clearTimeout(timer);
    }
  }, [player.trophies, prevTrophies]);

  return (
    <div className="p-4 border rounded shadow bg-white flex flex-col items-center relative">
      <img
        src={player.avatar}
        alt={player.name}
        className={`w-20 h-20 rounded-full mb-3 ${player.online ? "ring-4 ring-green-400" : "opacity-50"}`}
      />
      {lost && <img src="/images/lose.png" className="w-8 absolute top-13"/>}
      {lost && <img src="/images/teardrop.png" className="w-1 absolute top-12 left-26"/>}
      {lost && <img src="/images/teardrop.png" className="w-1 absolute top-12 left-22"/>}
      {won && <img src="/images/win.png" className="w-8 absolute top-13"/>}
      <h3 className="font-bold text-lg mb-1">{player.name}</h3>

      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <span>Coins</span>
          <motion.span
            key={player.coins} // animate on coins change
            initial="initial"
            animate={coinsChanged ? "animate" : "initial"}
            variants={popAnimation}
            className="text-xl font-mono text-yellow-600"
          >
            {coinFormat(player.coins)}
          </motion.span>
        </div>

        <div className="flex flex-col items-center">
          <span>Trophies</span>
          <motion.span
            key={player.trophies} // animate on trophies change
            initial="initial"
            animate={trophiesChanged ? "animate" : "initial"}
            variants={popAnimation}
            className="text-xl font-mono text-purple-600"
          >
            {player.trophies}
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;