/**
 * === EDIT THIS FILE ONLY ===
 *
 * This file contains the handler you need to implement for your bidding bot:
 *
 *   POST /bid — calculates and returns your bid amounts.
 *
 * You can change the logic inside the postBidHandler function.
 * DO NOT modify other parts of the project.
 */

import { raw } from "express";

/**
 * Handler for POST /bid
 *
 * Called by the game client each round.
 * Receives the current standings (coins and trophies for all teams).
 *
 * You must calculate how many coins to send to team A and team B.
 *
 * Example standings payload:
 * {
 *   coins: { own: 17, teamA: 83, teamB: 23 },
 *   trophies: { own: 2, teamA: 4, teamB: 1 }
 * }
 *
 * You must respond with:
 * {
 *   amountToA: number,
 *   amountToB: number
 * }
 *
 * Notes:
 * - You cannot spend more coins than you have.
 */

let round = 1;

export const postBidHandler = (req, res) => {
  console.log("called");
  const { standings } = req.body;
  const ownCoins = standings.coins.own;

  const ACoins = standings.coins.teamA;
  const BCoins = standings.coins.teamB;

  // Simple bot logic: split one-half of your coins evenly between A and B
  // const rawA = ownCoins >= ACoins ? ACoins + 1 : ownCoins;
  // const rawB = ownCoins >= BCoins ? BCoins + 1 : ownCoins;
  // let  amountToA = 0
  // let amountToB = 0

  round++;

  // if (round <3) {
  //  amountToA =0;
  //   amountToB = 0;
  // } else if (round ===3) {
  //   // After 2 rounds, bid 1 coin to each team
  //   amountToA = ACoins + 1;
  //   amountToB = BCoins + 1;
  // }
  // else if (round >3) {
  //   const rawA = ACoins>30?ACoins+1:30;
  //   const rawB = BCoins>30?BCoins+1:30;

  //   amountToA = rawA+rawB > ownCoins ? (ownCoins/2)-1 : rawA;
  //   amountToB = rawA+rawB > ownCoins ? (ownCoins/2)-1 : rawB;
  // }

  let amountToA = 0;
  let amountToB = 0;

  if (round === 1) {
    amountToA = 50;
    amountToB = 50;
  } else if (round === 2) {
    amountToA = 0;
    amountToB = 0;
  } else if (round === 3) {
    amountToA = 0;
    amountToB = 0;
  } else if (round === 4) {
    amountToA = 0;
    amountToB = 0;
  } else if (round > 4) {
    // rawA = ACoins +BCoins > ownCoins ?
   
    if (ACoins + BCoins +3 > ownCoins) {
      const half = ownCoins / 2;
      amountToA = half - 1;
      amountToB = half - 1;
    } else {
      amountToA = ACoins + 1;
      amountToB = BCoins + 1;
    }
  }

  console.log(`Bidding: ${amountToA} to A, ${amountToB} to B`);
  res.json({ amountToA, amountToB });
};
