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

let BIDDINGROUND = 1;

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

export const postBidHandler = (req, res) => {
  const { standings } = req.body;
  const ownCoins = standings.coins.own;

  let amountToA = 0;
  let amountToB = 0;

  let coinsToGive = Math.random() * 15 + 15;

  if (ownCoins < coinsToGive) {
    coinsToGive = coinsToGive / 2;

    if (ownCoins < 2) {
      coinsToGive = 1;
    }

    if (ownCoins === 0) {
      coinsToGive = 0;
    }
  }

  if (BIDDINGROUND % 2 === 0) {
    amountToA = coinsToGive;
    amountToB = coinsToGive / 2;
  } else {
    amountToA = coinsToGive / 2;
    amountToB = coinsToGive;
  }

  console.log(`Bidding: ${amountToA} to A, ${amountToB} to B`);

  BIDDINGROUND += 1;

  res.json({ amountToA, amountToB });
};
