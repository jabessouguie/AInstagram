/**
 * Unit tests for the interaction analyser logic.
 * Tests the business rules for classifying accounts.
 */
export {};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Follower {
  username: string;
  followedAt: Date;
}

// ─── Business logic ───────────────────────────────────────────────────────────

function classifyInteractions(
  following: Follower[],
  followerSet: Set<string>,
  interactors: Set<string>,
  sentDMs: Map<string, Date>,
  nowMs: number = Date.now()
) {
  const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
  const neverInteracted: string[] = [];
  const unfollowCandidates: string[] = [];

  for (const { username } of following) {
    const theyFollowBack = followerSet.has(username);
    const hasInteracted = interactors.has(username);

    if (theyFollowBack && !hasInteracted) {
      neverInteracted.push(username);
    }

    if (!theyFollowBack) {
      const dmDate = sentDMs.get(username);
      if (dmDate && nowMs - dmDate.getTime() > ONE_MONTH) {
        unfollowCandidates.push(username);
      }
    }
  }

  return { neverInteracted, unfollowCandidates };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date("2026-02-24T18:00:00Z").getTime();
const LONG_AGO = new Date("2025-12-01T00:00:00Z"); // > 1 month ago
const RECENT = new Date("2026-02-10T00:00:00Z"); // < 1 month ago

const following: Follower[] = [
  { username: "alice", followedAt: new Date("2025-01-01") }, // follows back, never interacted
  { username: "bob", followedAt: new Date("2025-06-01") }, // follows back, interacted
  { username: "carol", followedAt: new Date("2025-03-01") }, // doesn't follow back, no DM
  { username: "dave", followedAt: new Date("2025-05-01") }, // doesn't follow back, old DM
  { username: "eve", followedAt: new Date("2025-07-01") }, // doesn't follow back, recent DM
];

const followerSet = new Set(["alice", "bob"]);
const interactors = new Set(["bob"]);
const sentDMs = new Map([
  ["dave", LONG_AGO],
  ["eve", RECENT],
]);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("classifyInteractions", () => {
  let result: ReturnType<typeof classifyInteractions>;

  beforeEach(() => {
    result = classifyInteractions(following, followerSet, interactors, sentDMs, NOW);
  });

  describe("neverInteracted", () => {
    it("includes accounts that follow back but never interacted", () => {
      expect(result.neverInteracted).toContain("alice");
    });

    it("excludes accounts that follow back AND interacted", () => {
      expect(result.neverInteracted).not.toContain("bob");
    });

    it("excludes accounts that don't follow back", () => {
      expect(result.neverInteracted).not.toContain("carol");
      expect(result.neverInteracted).not.toContain("dave");
    });
  });

  describe("unfollowCandidates", () => {
    it("includes accounts with DM sent > 1 month ago and no follow-back", () => {
      expect(result.unfollowCandidates).toContain("dave");
    });

    it("excludes accounts with recent DM (give them more time)", () => {
      expect(result.unfollowCandidates).not.toContain("eve");
    });

    it("excludes accounts that follow back", () => {
      expect(result.unfollowCandidates).not.toContain("alice");
      expect(result.unfollowCandidates).not.toContain("bob");
    });

    it("excludes accounts never DM'd", () => {
      expect(result.unfollowCandidates).not.toContain("carol");
    });
  });

  describe("edge cases", () => {
    it("handles empty following list", () => {
      const r = classifyInteractions([], followerSet, interactors, sentDMs, NOW);
      expect(r.neverInteracted).toHaveLength(0);
      expect(r.unfollowCandidates).toHaveLength(0);
    });

    it("handles account on the boundary of 1 month exactly", () => {
      const exactlyOneMonthAgo = new Date(NOW - 30 * 24 * 60 * 60 * 1000);
      const dms = new Map([["frank", exactlyOneMonthAgo]]);
      const fol = [{ username: "frank", followedAt: new Date("2025-01-01") }];
      const r = classifyInteractions(fol, new Set(), new Set(), dms, NOW);
      // Exactly on boundary: NOT > 1 month, so not an unfollow candidate
      expect(r.unfollowCandidates).not.toContain("frank");
    });
  });
});
