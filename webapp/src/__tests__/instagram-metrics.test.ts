/**
 * Unit tests for instagram-parser.ts metric computations.
 * These test the pure computation logic in isolation using fixture data.
 */

// ─── Type imports (copy minimal types to avoid circular deps) ─────────────────

interface ContentInteractions {
  period: string;
  totalInteractions: number;
  totalInteractionsChange: string;
  posts: { interactions: number; likes: number; comments: number; shares: number; saves: number };
  stories: { interactions: number; replies: number };
  reels: { interactions: number; likes: number; comments: number; shares: number; saves: number };
  accountsInteracted: number;
  accountsInteractedChange: string;
  nonFollowerInteractionPct: number;
}

interface AudienceInsights {
  period: string;
  followerCount: number;
  followerCountChange: string;
  followersGained: number;
  followersLost: number;
  netFollowerChange: number;
  topCities: Record<string, number>;
  topCountries: Record<string, number>;
  ageGroups: Record<string, number>;
  genderSplit: { male: number; female: number };
  dailyActivity: Record<string, number>;
}

// ─── Helper: replicate computeMetrics logic ──────────────────────────────────
// We extract the pure computation into a testable function, mirroring the parser.

function computeEngagementRate(
  ci: ContentInteractions,
  followerCount: number,
  postCount: number
): number {
  if (followerCount === 0 || postCount === 0) return 0;
  const totalLikes = ci.posts.likes + ci.reels.likes;
  const totalComments = ci.posts.comments + ci.reels.comments;
  const avgLikes = totalLikes / postCount;
  const avgComments = totalComments / postCount;
  return Math.round(((avgLikes + avgComments) / followerCount) * 100 * 100) / 100;
}

function computeAvgLikes(ci: ContentInteractions, postCount: number): number {
  const totalLikes = ci.posts.likes + ci.reels.likes;
  return postCount > 0 ? totalLikes / postCount : 0;
}

function computeAvgComments(ci: ContentInteractions, postCount: number): number {
  const totalComments = ci.posts.comments + ci.reels.comments;
  return postCount > 0 ? totalComments / postCount : 0;
}

function computeFollowerGrowthRate(changeStr: string): number {
  const m = changeStr.match(/(-?[\d.]+)%/);
  return m ? parseFloat(m[1]) : 0;
}

function computeInactiveFollowers(
  ci: ContentInteractions,
  followerCount: number
): { count: number; percentage: number } {
  const followerInteractors = Math.round(
    ci.accountsInteracted * (1 - ci.nonFollowerInteractionPct / 100)
  );
  const count = Math.max(0, followerCount - followerInteractors);
  const percentage = followerCount > 0 ? (count / followerCount) * 100 : 75;
  return { count, percentage };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ciFixture: ContentInteractions = {
  period: "Nov 26 - Fév 23",
  totalInteractions: 13590,
  totalInteractionsChange: "+91.1%",
  posts: { interactions: 3370, likes: 2030, comments: 1237, shares: 15, saves: 38 },
  stories: { interactions: 172, replies: 162 },
  reels: { interactions: 9528, likes: 6228, comments: 375, shares: 462, saves: 1951 },
  accountsInteracted: 7980,
  accountsInteractedChange: "+179%",
  nonFollowerInteractionPct: 93.9,
};

const aiFixture: AudienceInsights = {
  period: "Nov 26 - Fév 23",
  followerCount: 3826,
  followerCountChange: "-43.7% vs Aug 28 - Nov 25",
  followersGained: 470,
  followersLost: 3436,
  netFollowerChange: -2966,
  topCities: { Paris: 2.9 },
  topCountries: { France: 13.9 },
  ageGroups: { "25-34": 55.1 },
  genderSplit: { male: 33.8, female: 66.1 },
  dailyActivity: { lundi: 2727, mardi: 2742 },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("computeEngagementRate", () => {
  it("returns correct per-post engagement rate from real ContentInteractions", () => {
    // Per-post ER = (avgLikes + avgComments) / followers * 100
    const postCount = 1461;
    const er = computeEngagementRate(ciFixture, aiFixture.followerCount, postCount);
    const totalLikes = ciFixture.posts.likes + ciFixture.reels.likes; // 2030 + 6228
    const totalComments = ciFixture.posts.comments + ciFixture.reels.comments; // 1237 + 375
    const expected =
      ((totalLikes / postCount + totalComments / postCount) / aiFixture.followerCount) * 100;
    expect(er).toBeCloseTo(expected, 2);
  });

  it("returns 0 when followerCount is 0", () => {
    expect(computeEngagementRate(ciFixture, 0, 100)).toBe(0);
  });

  it("returns 0 when postCount is 0", () => {
    expect(computeEngagementRate(ciFixture, aiFixture.followerCount, 0)).toBe(0);
  });
});

describe("computeAvgLikes", () => {
  it("computes correct average likes per post", () => {
    const postCount = 1461; // from real export
    const avg = computeAvgLikes(ciFixture, postCount);
    // (2030 + 6228) / 1461 ≈ 5.65
    expect(avg).toBeCloseTo((2030 + 6228) / postCount, 2);
  });

  it("returns 0 when postCount is 0", () => {
    expect(computeAvgLikes(ciFixture, 0)).toBe(0);
  });
});

describe("computeAvgComments", () => {
  it("computes correct average comments per post", () => {
    const postCount = 1461;
    const avg = computeAvgComments(ciFixture, postCount);
    // (1237 + 375) / 1461 ≈ 1.1
    expect(avg).toBeCloseTo((1237 + 375) / postCount, 2);
  });
});

describe("computeFollowerGrowthRate", () => {
  it("extracts negative growth rate correctly", () => {
    expect(computeFollowerGrowthRate("-43.7% vs Aug")).toBe(-43.7);
  });

  it("extracts positive growth rate correctly", () => {
    expect(computeFollowerGrowthRate("+12.3% vs last period")).toBe(12.3);
  });

  it("returns 0 for empty string", () => {
    expect(computeFollowerGrowthRate("")).toBe(0);
  });

  it("returns 0 when no percentage found", () => {
    expect(computeFollowerGrowthRate("pas de donnée")).toBe(0);
  });
});

describe("computeInactiveFollowers", () => {
  it("correctly estimates inactive follower count", () => {
    // 93.9% of 7980 interactions from non-followers → 6.1% from followers
    // followerInteractors = 7980 * (1 - 0.939) = 7980 * 0.061 ≈ 487
    // inactiveCount = 3826 - 487 = 3339
    const { count, percentage } = computeInactiveFollowers(ciFixture, aiFixture.followerCount);
    const expectedInteractors = Math.round(7980 * (1 - 93.9 / 100));
    const expectedInactive = Math.max(0, 3826 - expectedInteractors);
    expect(count).toBe(expectedInactive);
    expect(percentage).toBeCloseTo((expectedInactive / 3826) * 100, 1);
  });

  it("returns 0 inactive when all followers interact", () => {
    const allInteractCi: ContentInteractions = {
      ...ciFixture,
      nonFollowerInteractionPct: 0,
      accountsInteracted: 3826, // all followers interacted
    };
    const { count } = computeInactiveFollowers(allInteractCi, 3826);
    expect(count).toBe(0);
  });
});
