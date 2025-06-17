import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import PlayerCard from "./components/PlayerCard";
import ConfettiExplosion from "react-confetti-explosion";

export type Player = {
  name: string;
  url: string;
  coins: number;
  trophies: number;
  avatar: string;
  online: boolean;
};

type BidResponse = {
  amountToA: number;
  amountToB: number;
};

const WIN_TROPHIES = 5;

const initialPlayers: Player[] = [
  {
    name: "Akos",
    url: "http://localhost:3000",
    coins: 100,
    trophies: 0,
    avatar: "/images/akos.png",
    online: false,
  },
  {
    name: "Razvan",
    url: "http://localhost:3001",
    coins: 100,
    trophies: 0,
    avatar: "/images/razvan.png",
    online: false,
  },
  {
    name: "Kristof",
    url: "http://localhost:3002",
    coins: 100,
    trophies: 0,
    avatar: "/images/kristof.png",
    online: false,
  },
];

// Helpers
export const coinFormat = (coin: number) => {
  return Math.round((coin + Number.EPSILON) * 100) / 100
}

const getOthers = (players: Player[], playerName: string) =>
  players.filter((p) => p.name !== playerName);

const checkServerStatus = async (player: Player): Promise<boolean> => {
  try {
    await axios.get(`${player.url}/ping`, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
};

type RoundStepInfo = {
  type: "bids" | "coinTransfer" | "scoring" | "winnerAnnouncement";
  description: string;
  details?: string[];
};

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [playersStatus, setPlayersStatus] = useState<Player[]>(initialPlayers);
  const [bids, setBids] = useState<Record<string, BidResponse>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [lastWinner, setLastWinner] = useState<string | null>(null);
  const [loadingBids, setLoadingBids] = useState(false);
  const [revealed, setRevealed] = useState(-1);
  const [mood, setMood] = useState([
    { won: false, lost: false },
    { won: false, lost: false },
    { won: false, lost: false },
  ]);
  // Round info for user understanding, animating through these steps
  const [roundStepIndex, setRoundStepIndex] = useState<number>(-1);
  const [roundSteps, setRoundSteps] = useState<RoundStepInfo[]>([]);

  // Update online status once on mount
  useEffect(() => {
    let active = true;

    async function updateStatuses() {
      if (!active) return;
      const updated = await Promise.all(
        players.map(async (p) => {
          const isOnline = await checkServerStatus(p);
          return { ...p, online: isOnline };
        })
      );
      if (active) setPlayers(updated);
    }

    updateStatuses();

    return () => {
      active = false;
    };
  }, []);

  // Animate round steps with delay
  useEffect(() => {
    if (roundStepIndex === -1 || roundStepIndex >= roundSteps.length) return;

    const timer = setTimeout(() => {
      setRoundStepIndex((i) => i + 1);
    }, 10000);

    return () => clearTimeout(timer);
  }, [roundStepIndex, roundSteps]);

  // Play one round of the game
  const playRound = useCallback(async () => {
    if (loadingBids) return;
    setLoadingBids(true);
    setRoundStepIndex(0);

    setRevealed(0);
    try {
      const newBids: Record<string, BidResponse> = {};

      // Step 1: Ask each player for bids
      for (const p of players) {
        const others = getOthers(players, p.name);
        const standings = {
          coins: {
            own: p.coins,
            teamA: others[0].coins,
            teamB: others[1].coins,
          },
          trophies: {
            own: p.trophies,
            teamA: others[0].trophies,
            teamB: others[1].trophies,
          },
        };
        const res = await axios.post<BidResponse>(`${p.url}/bid`, {
          standings,
        });
        newBids[p.name] = res.data;
        if(res.data?.amountToA + res.data?.amountToB > p.coins) {
          alert(`OH NO :( ${p.name} is disqualified, the AI will take over her part after a quick technical break!`)
        }
      }
      setBids(newBids);

      // Step 2: Calculate coin transfers
      const updatedCoins: Record<string, number> = Object.fromEntries(
        players.map((p) => [p.name, p.coins])
      );

      for (const p of players) {
        const others = getOthers(players, p.name);
        updatedCoins[p.name] -=
          newBids[p.name].amountToA + newBids[p.name].amountToB;
        updatedCoins[others[0].name] += newBids[p.name].amountToA;
        updatedCoins[others[1].name] += newBids[p.name].amountToB;
      }

      // Step 3: Calculate points
      const points: Record<string, number> = {};
      for (const p of players) {
        points[p.name] = 0;
        const others = getOthers(players, p.name);
        const getBidFromOtherToP = (
          other: Player,
          targetName: string
        ): number => {
          const otherOpponents = getOthers(players, other.name);
          if (otherOpponents[0].name === targetName)
            return newBids[other.name].amountToA;
          if (otherOpponents[1].name === targetName)
            return newBids[other.name].amountToB;
          return 0;
        };
        if (newBids[p.name].amountToA > getBidFromOtherToP(others[0], p.name))
          points[p.name]++;
        if (newBids[p.name].amountToB > getBidFromOtherToP(others[1], p.name))
          points[p.name]++;
      }

      // Step 4: Find round winners
      const maxPoints = Math.max(...Object.values(points));
      const roundWinners = players
        .filter((p) => points[p.name] === maxPoints)
        .map((p) => p.name);
      // Step 5: Update players with coins and trophies
      const updatedPlayers = players.map((p) => ({
        ...p,
        coins: updatedCoins[p.name],
        trophies: points[p.name] === maxPoints ? p.trophies + 1 : p.trophies,
      }));
      setPlayersStatus(updatedPlayers); // <-- Update UI immediately here

      // Prepare round step info for animation and display
      setRoundSteps([
        {
          type: "bids",
          description: "Players placed their bids:",
          details: [],
        },
        {
          type: "coinTransfer",
          description: "Coins transferred between players:",
          details: [],
        },
        {
          type: "scoring",
          description: "Points scored by players:",
          details: [],
        },
        {
          type: "winnerAnnouncement",
          description: `Round winner(s): ${roundWinners.join(", ")}`,
        },
      ]);
      setLastWinner(roundWinners.join(", "));

      // Step 6: Check final winners
      const finalWinners = updatedPlayers.filter(
        (p) => p.trophies >= WIN_TROPHIES
      );
      if (finalWinners.length)
        setWinner(finalWinners.map((p) => p.name).join(", "));
    } catch (error) {
      console.error("Error during playRound:", error);
    } finally {
      setLoadingBids(false);
    }
  }, [players, loadingBids]);

  const setCoinsAndThropies = () => {
    reveal();
  };

  const reveal = () => {
    const newNumber = (revealed + 1) % 5;
    setRevealed(newNumber);
    setTimeout(() => {
      if (newNumber === 1){
        if(bids["Akos"]?.amountToA > bids["Razvan"]?.amountToA) {

          setMood([
            { won: true, lost: false },
            { won: false, lost: true },
            { won: false, lost: false }])
        }
        if(bids["Akos"]?.amountToA < bids["Razvan"]?.amountToA) {

          setMood([
            { won: false, lost: true },
            { won: true, lost: false },
            { won: false, lost: false }])
        }
      }
      if (newNumber === 2){
        if(bids["Akos"]?.amountToB > bids["Kristof"]?.amountToA) {

          setMood([
            { won: true, lost: false },
            { won: false, lost: false },
            { won: false, lost: true }])
        }
        if(bids["Akos"]?.amountToB < bids["Kristof"]?.amountToA) {

          setMood([
            { won: false, lost: true },
            { won: false, lost: false },
            { won: true, lost: false }])
        }
      }
      if (newNumber === 3){
        if(bids["Razvan"]?.amountToB > bids["Kristof"]?.amountToB) {

          setMood([
            { won: false, lost: false },
            { won: true, lost: false },
            { won: false, lost: true }])
        }
        if(bids["Razvan"]?.amountToB < bids["Kristof"]?.amountToB) {

          setMood([
            { won: false, lost: false },
            { won: false, lost: true },
            { won: true, lost: false }])
        }
      }
    }, 2500)
    if (newNumber == 4) {
      setMood([
        { won: false, lost: false },
        { won: false, lost: false },
        { won: false, lost: false }])
      setPlayers(playersStatus);
    }
  };

  return (
    <div className="relative">
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Multiplayer Coin Bidding Game
        </h1>
        <div className="relative w-[600px] h-[520px] mx-auto">
          {/* Player A - top */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0">
            <PlayerCard player={players[0]} {...mood[0]} />
          </div>

          {/* Player B - bottom left */}
          <div className="absolute left-0 bottom-0">
            <PlayerCard player={players[1]} {...mood[1]} />
          </div>

          {/* Player C - bottom right */}
          <div className="absolute right-0 bottom-0">
            <PlayerCard player={players[2]} {...mood[2]} />
          </div>

          {/* Bid labels */}
          <div className="absolute left-1/6 top-3/8 text-sm font-bold">
            {revealed >= 1 && (
              <>
                <motion.div
                  className="flex justify-center items-center mb-8"
                  key={1}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0 } }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src="/images/arrow2.png"
                    className="h-8 rotate-140 -mr-4 z-1"
                  />
                  <span className="z-10">{coinFormat(bids["Akos"]?.amountToA) ?? "-"}</span>
                  <img src="/images/coin.png" className="w-4 mx-1 z-10" />
                </motion.div>

                <motion.div
                  className="flex justify-center items-center"
                  key={1}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 2 } }}
                  transition={{ duration: 0.5 }}
                >
                  {" "}
                  <span className="z-10">
                    {coinFormat(bids["Razvan"]?.amountToA) ?? "-"}
                  </span>
                  <img src="/images/coin.png" className="w-4 mx-1 z-10" />
                  <img
                    src="/images/arrow2.png"
                    className="h-8 -rotate-40 -ml-6 z-1"
                  />
                </motion.div>
              </>
            )}
          </div>
          <div className="absolute right-1/6 top-3/8 text-sm font-bold">
            {revealed >= 2 && (
              <>
                <motion.div
                  className="flex justify-center items-center mb-8"
                  key={1}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0 } }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="z-10">{coinFormat(bids["Akos"]?.amountToB) ?? "-"}</span>
                  <img src="/images/coin.png" className="w-4 mx-1 z-10" />
                  <img
                    src="/images/arrow2.png"
                    className="h-8 -rotate-140 scale-x-[-1] -ml-4 z-1"
                  />
                </motion.div>
                <motion.div
                  className="flex justify-center items-center z-10"
                  key={1}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 2 } }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src="/images/arrow2.png"
                    className="h-8 rotate-40 scale-x-[-1] -mr-4 z-1"
                  />
                  <span className="z-10">
                    {coinFormat(bids["Kristof"]?.amountToA) ?? "-"}
                  </span>
                  <img src="/images/coin.png" className="w-4 mx-1 z-10" />
                </motion.div>
              </>
            )}
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-12 text-sm font-bold">
            {revealed >= 3 && (
              <>
                <motion.div
                  className="flex flex-col justify-center items-center mb-8"
                  key={1}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0 } }}
                  transition={{ duration: 0.5 }}
                >
                  {" "}
                  <img
                    src="/images/arrow2.png"
                    className="h-8 scale-x-[-1] rotate-180"
                  />
                  <div className="flex">
                    <img src="/images/coin.png" className="w-4 mx-1" />
                    {coinFormat(bids["Razvan"]?.amountToB) ?? "-"}
                  </div>
                </motion.div>
                <motion.div
                  className="flex flex-col justify-center items-center z-10"
                  key={1}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 2 } }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex">
                    <img src="/images/coin.png" className="w-4 mx-1" />
                    {coinFormat(bids["Kristof"]?.amountToB) ?? "-"}
                  </div>
                  <img src="/images/arrow2.png" className="h-8 scale-x-[-1]" />
                </motion.div>
              </>
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <button
            onClick={revealed === -1 ? playRound : setCoinsAndThropies}
            disabled={loadingBids}
            className="bg-stone-600 text-white px-6 py-3 rounded hover:bg-stone-700 disabled:opacity-50"
          >
            {revealed !== -1
              ? "Reveal next"
              : loadingBids
              ? "Calling players API..."
              : "Call APIs"}
          </button>
        </div>
      </div>

      {revealed >= 4 && (
        <div
          className="absolute flex flex-col gap-3 font-bold top-0 text-center text-xl w-full h-screen backdrop-blur-md flex justify-center items-center z-20"
          onClick={() => setRevealed(-1)}
        >
          {winner ? (
            <>
              <h2 className="text-6xl font-extrabold text-black">
                {winner} won the game
              </h2>
              <div className="z-30">
                <ConfettiExplosion
                  zIndex={2000}
                  particleCount={50}
                  duration={1500}
                  colors={["#a5f3fc", "#fef9c3", "#c7d2fe", "#e0f2fe"]}
                />
                <ConfettiExplosion
                  zIndex={2000}
                  particleCount={50}
                  duration={1500}
                  colors={["pink", "orange", "red", "#e0f2fe"]}
                />
              </div>
            </>
          ) : (
            <>
              <p>The winner of the round is</p>
              <p className="text-4xl">{lastWinner}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
