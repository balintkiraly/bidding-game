import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./server";

// You can define more test cases here
const SAMPLE_STANDINGS = [
  // Initial case
  {
    coins: { own: 100, teamA: 100, teamB: 100 },
    trophies: { own: 0, teamA: 0, teamB: 0 },
  },
  // 1 coin left
  {
    coins: { own: 1, teamA: 34, teamB: 67 },
    trophies: { own: 1, teamA: 1, teamB: 1 },
  },
  // No coins left
  {
    coins: { own: 0, teamA: 23, teamB: 54 },
    trophies: { own: 4, teamA: 2, teamB: 4 },
  },
];

describe("Server Endpoints", () => {
  it("should return valid bids", async () => {
    await Promise.all(
      SAMPLE_STANDINGS.map(async (standings, index) => {
        const res = await request(app).post("/bid").send({ standings });
        expect(res.status).toBe(200);
        // Correct properties sent back
        expect(res.body).toHaveProperty("amountToA");
        expect(res.body).toHaveProperty("amountToB");

        // Properties types are correct
        expect(typeof res.body.amountToA).toBe("number");
        expect(typeof res.body.amountToB).toBe("number");

        // Spend max the on coins
        expect(
          res.body.amountToA + res.body.amountToB <= standings.coins.own
        ).toBeTruthy;
      })
    );
  });
});
