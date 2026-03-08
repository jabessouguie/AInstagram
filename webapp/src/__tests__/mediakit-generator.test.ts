/**
 * Unit tests for the media kit HTML generator.
 */

import { generateMediaKitHTML, defaultMediaKitConfig } from "@/lib/mediakit-generator";
import type { InstagramAnalytics } from "@/types/instagram";

const fakeAnalytics: InstagramAnalytics = {
  profile: {
    username: "testcreator",
    fullName: "Test Creator",
    bio: "Voyageur passionné",
    website: "testcreator.com",
    followerCount: 5000,
    followingCount: 300,
    postCount: 150,
    profilePicUrl: "",
    isVerified: false,
  },
  followers: [],
  following: [],
  posts: [],
  metrics: {
    engagementRate: 4.2,
    avgLikesPerPost: 180,
    avgCommentsPerPost: 12,
    avgReachPerPost: 850,
    followerGrowthRate: -2.3,
    followerGrowthByMonth: [],
    bestPostingDays: [],
    bestPostingHours: [],
    contentTypePerformance: [
      {
        type: "REEL",
        avgEngagement: 340,
        avgLikes: 300,
        avgComments: 40,
        count: 50,
        engagementRate: 5.2,
      },
      {
        type: "IMAGE",
        avgEngagement: 160,
        avgLikes: 140,
        avgComments: 20,
        count: 80,
        engagementRate: 3.0,
      },
    ],
    inactiveFollowersCount: 3500,
    inactiveFollowersPercentage: 70,
    nonReciprocalFollowsCount: 30,
    topPosts: [],
  },
  audienceInsights: {
    period: "Q1 2026",
    followerCount: 5000,
    followerCountChange: "-2.3% vs last period",
    followersGained: 200,
    followersLost: 310,
    netFollowerChange: -110,
    topCities: { Paris: 8.5, Lyon: 4.2 },
    topCountries: { France: 65, Belgique: 12 },
    ageGroups: { "25-34": 52, "35-44": 28 },
    genderSplit: { male: 35, female: 65 },
    dailyActivity: {},
  },
  parsedAt: new Date("2026-02-24"),
  dataSource: "export",
};

describe("generateMediaKitHTML", () => {
  let html: string;

  beforeAll(() => {
    html = generateMediaKitHTML(fakeAnalytics, defaultMediaKitConfig);
  });

  it("produces a non-empty HTML string", () => {
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(1000);
  });

  it("contains the creator username", () => {
    expect(html).toContain("testcreator");
  });

  it("contains the follower count formatted", () => {
    expect(html).toContain("5.0K");
  });

  it("contains the engagement rate", () => {
    expect(html).toContain("4.20%");
  });

  it("includes the top content type", () => {
    // REEL has highest engagementRate
    expect(html).toContain("REEL");
  });

  it("contains audience country data", () => {
    expect(html).toContain("France");
    expect(html).toContain("65%");
  });

  it("contains the CTA email when contactEmail is provided", () => {
    const customConfig = { ...defaultMediaKitConfig, contactEmail: "hello@test.com" };
    const customHtml = generateMediaKitHTML(fakeAnalytics, customConfig);
    expect(customHtml).toContain("hello@test.com");
  });

  it("includes rate per post when provided", () => {
    const customConfig = { ...defaultMediaKitConfig, ratePerPost: "750€" };
    const customHtml = generateMediaKitHTML(fakeAnalytics, customConfig);
    expect(customHtml).toContain("750€");
  });

  it("includes custom services", () => {
    const customConfig = { ...defaultMediaKitConfig, services: ["YouTube", "TikTok"] };
    const customHtml = generateMediaKitHTML(fakeAnalytics, customConfig);
    expect(customHtml).toContain("YouTube");
    expect(customHtml).toContain("TikTok");
  });

  it("produces valid HTML structure", () => {
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("<body");
    expect(html).toContain("</body>");
  });

  it("handles missing reach and audience insights", () => {
    const minimalAnalytics: InstagramAnalytics = {
      ...fakeAnalytics,
      metrics: {
        ...fakeAnalytics.metrics,
        contentTypePerformance: [], // empty content performance
      },
      reachInsights: undefined,
      audienceInsights: undefined,
    };

    // minimal config
    const minimalConfig = {
      ...defaultMediaKitConfig,
      services: [],
      contactEmail: "",
      ratePerPost: undefined,
      profilePicUrl: undefined,
      bannerImageUrl: "http://banner.jpg",
      displayName: "Display Name",
    };

    const minimalHtml = generateMediaKitHTML(minimalAnalytics, minimalConfig);
    expect(minimalHtml).toContain("Données non disponibles");
    expect(minimalHtml).toContain("Display Name");
    expect(minimalHtml).toContain("http://banner.jpg");
    // it will render the profile username initial when no picture
    expect(minimalHtml).toContain("T"); // "Testcreator" first letter
  });

  it("handles low percentage ring logic and SVG edge cases", () => {
    const edgeAnalytics: InstagramAnalytics = {
      ...fakeAnalytics,
      metrics: {
        ...fakeAnalytics.metrics,
        engagementRate: 5, // pct < 10 branch in svgRing
      },
      reachInsights: {
        accountsReached: 1000,
        impressions: 2000,
        nonFollowerReachPct: 5, // pct < 10 for secondary ring
        followerReachPct: 95,
        period: "1 month",
        accountsReachedChange: "N/A",
        impressionsChange: "N/A",
        profileVisits: 0,
        profileVisitsChange: "N/A",
        externalLinkTaps: 0,
      },
      audienceInsights: {
        ...fakeAnalytics.audienceInsights,
        genderSplit: { female: 0, male: 0 }, // edge case: no gender data
      } as any,
    };

    const edgeHtml = generateMediaKitHTML(edgeAnalytics, defaultMediaKitConfig);
    expect(edgeHtml).toContain("5.0%");
    expect(edgeHtml).not.toContain("Hommes");
  });
});
