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

  // Simple bot logic: split one-half of your coins evenly between A and B
  const amountToA = ownCoins / 4;
  const amountToB = ownCoins / 4;

  console.log(`Bidding: ${amountToA} to A, ${amountToB} to B`);
  res.json({ amountToA, amountToB });
};