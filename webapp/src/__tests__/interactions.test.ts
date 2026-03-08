/**
 * Unit tests for the interaction analyser logic.
 * Tests the business rules for classifying accounts by mocking fs and testing the actual module.
 */

import { analyseInteractions, analyseInteractionsFromAPI } from "@/lib/interaction-analyser";
import fs from "fs";
import path from "path";

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("interaction-analyser", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.INSTAGRAM_DATA_PATH = "/mock/data";

    // Default mocks for non-existent things to avoid errors
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readdirSync.mockReturnValue([] as any);
  });

  describe("analyseInteractionsFromAPI", () => {
    it("returns empty arrays since API does not support interaction analysis", async () => {
      const result = await analyseInteractionsFromAPI("token", "123");
      expect(result).toEqual({
        neverInteracted: [],
        dmSuggestionsNoFollowBack: [],
        dmSuggestionsMutual: [],
        unfollowCandidates: [],
        dataSource: "api",
      });
    });
  });

  describe("analyseInteractions HTML Export", () => {
    it("returns null if no export folder", async () => {
      mockFs.existsSync.mockImplementation((p) => {
        if (p === "/mock/data") return false;
        return false;
      });
      const result = await analyseInteractions();
      expect(result).toBeNull();
    });

    it("parses HTML export correctly", async () => {
      // Mock finding the export folder
      mockFs.existsSync.mockImplementation((p: any) => {
        if (typeof p !== "string") return false;
        if (p === "/mock/data") return true;
        if (p === "/mock/data/instagram-test") return true;
        if (p === path.join("/mock/data/instagram-test", "connections", "followers_and_following"))
          return true;

        // Mock specific directories
        if (p.includes("your_instagram_activity/comments")) return true;
        if (p.includes("your_instagram_activity/likes")) return true;
        if (p.includes("your_instagram_activity/direct")) return true;

        if (p.endsWith("followers_1.html")) return true;
        if (p.endsWith("following.html")) return true;
        if (p.endsWith("post_comments.html")) return true;
        if (p.endsWith("liked_posts.html")) return true;
        if (p.endsWith("userA.html")) return true;
        if (p.endsWith("userB.html")) return true;

        return false;
      });

      mockFs.readdirSync.mockImplementation((p: any): any => {
        if (typeof p !== "string") return [];
        if (p === "/mock/data") return ["instagram-test"];
        if (p.includes("followers_and_following")) return ["followers_1.html", "following.html"];
        if (p.includes("comments")) return ["post_comments.html"];
        if (p.includes("likes")) return ["liked_posts.html"];
        if (p.includes("direct")) return ["userA.html", "userB.html"];
        return [];
      });

      mockFs.statSync.mockImplementation((p: any): any => {
        if (typeof p !== "string") return { isDirectory: () => false };
        if (p === "/mock/data/instagram-test") return { isDirectory: () => true };
        return { isDirectory: () => false };
      });

      mockFs.readFileSync.mockImplementation((p: any): any => {
        if (typeof p !== "string") return "";
        if (p.endsWith("followers_1.html")) {
          return `<div>
            <a href="https://www.instagram.com/alice">alice</a><div>Jan 01, 2025 10:00 AM</div>
            <a href="https://www.instagram.com/bob">bob</a><div>Juin 01, 2025 02:00 PM</div>
            <a href="https://www.instagram.com/frank">frank</a><div>12:00 am</div>
          </div>`;
        }
        if (p.endsWith("following.html")) {
          return `<div>
            <a href="https://www.instagram.com/alice">alice</a><div>Jan 01, 2025 10:00 AM</div>
            <a href="https://www.instagram.com/bob">bob</a><div>Jun 01, 2025 10:00 AM</div>
            <a href="https://www.instagram.com/carol">carol</a><div>Mar 01, 2025 10:00 AM</div>
            <a href="https://www.instagram.com/dave">dave</a><div>May 01, 2025 10:00 AM</div>
          </div>`;
        }
        if (p.endsWith("post_comments.html")) {
          return `<div class="_a706">bob</div>`;
        }
        if (p.endsWith("liked_posts.html")) {
          return `<a href="https://www.instagram.com/bob">bob liked this</a>`;
        }
        if (p.endsWith("userA.html")) {
          // Simulate two dates to trigger the else block "already has username"
          return `<title>dave_123</title>
            <div class="_a706">2023-01-01T10:00:00</div>
            <div class="_a706">2023-01-02T10:00:00</div>
          `; // very old DM -> Unfollow
        }
        if (p.endsWith("userB.html")) {
          // This simulates a recent date. To make it robust, we calculate a date a few days ago based on current run time,
          // but for the sake of HTML parsing test, a hardcoded recent date is fine if we mock Date.now() or just use a future date.
          return `<title>eve_123</title><div class="_a706">2030-01-01T10:00:00</div>`; // very new DM
        }
        return "";
      });

      const result = await analyseInteractions();
      expect(result).not.toBeNull();
      if (!result) return;

      expect(result.dataSource).toBe("export");
      // Mutual, no interaction (alice)
      expect(result.neverInteracted).toHaveLength(1);
      expect(result.neverInteracted[0].username).toBe("alice");

      // Mutual (alice, bob). Bob had interaction, but never reached out through DM? Actually parseSentDMs doesn't see bob
      expect(result.dmSuggestionsMutual.map((s) => s.username)).toContain("alice");
      expect(result.dmSuggestionsMutual.map((s) => s.username)).toContain("bob");

      // Not mutual, no DM (carol)
      expect(result.dmSuggestionsNoFollowBack.map((s) => s.username)).toContain("carol");

      // Not mutual, Old DM (dave) -> Unfollow
      expect(result.unfollowCandidates.map((s) => s.username)).toContain("dave");
    });
  });

  describe("analyseInteractions JSON Export", () => {
    it("parses JSON export correctly", async () => {
      mockFs.existsSync.mockImplementation((p: any) => {
        if (typeof p !== "string") return false;
        if (p === "/mock/data") return true;
        if (p === "/mock/data/instagram-test") return true;
        if (p === path.join("/mock/data/instagram-test", "connections", "followers_and_following"))
          return true;
        // JSON detection
        if (p.endsWith("followers_1.json")) return true;
        if (p.endsWith("following.json")) return true;
        if (p.endsWith("message_1.json")) return true;
        if (p.includes("your_instagram_activity/messages/inbox")) return true;
        return false;
      });

      mockFs.readdirSync.mockImplementation((p: any): any => {
        if (typeof p !== "string") return [];
        if (p === "/mock/data") return ["instagram-test"];
        if (p.includes("followers_and_following")) return ["followers_1.json", "following.json"];
        if (p.includes("inbox")) return ["dave_123", "eve_124"];
        return [];
      });

      mockFs.statSync.mockImplementation((p: any): any => {
        if (typeof p !== "string") return { isDirectory: () => false };
        if (p === "/mock/data/instagram-test") return { isDirectory: () => true };
        if (p.includes("dave_123")) return { isDirectory: () => true };
        if (p.includes("eve_124")) return { isDirectory: () => true };
        return { isDirectory: () => false };
      });

      mockFs.readFileSync.mockImplementation((p: any): any => {
        if (typeof p !== "string") return "";
        if (p.endsWith("followers_1.json")) {
          return JSON.stringify([
            { string_list_data: [{ value: "alice", timestamp: 1700000000 }] },
            { string_list_data: [{ value: "bob" }] }, // missing timestamp
          ]);
        }
        if (p.endsWith("following.json")) {
          return JSON.stringify({
            relationships_following: [
              { title: "alice", string_list_data: [{ value: "alice", timestamp: 1700000000 }] },
              { title: "bob", string_list_data: [{ value: "bob", timestamp: 1700000000 }] },
              { title: "carol", string_list_data: [{ value: "carol", timestamp: 1700000000 }] },
              { title: "dave", string_list_data: [{ value: "dave", timestamp: 1700000000 }] },
            ],
          });
        }
        if (p.includes("dave_123/message_1.json")) {
          // Old timestamp
          return JSON.stringify({
            messages: [{ sender_name: "me", timestamp_ms: new Date("2020-01-01").getTime() }],
          });
        }
        if (p.includes("eve_124/message_1.json")) {
          // Recent timestamp
          return JSON.stringify({ messages: [{ sender_name: "me", timestamp_ms: Date.now() }] });
        }
        return "";
      });

      const result = await analyseInteractions();
      expect(result).not.toBeNull();
      if (!result) return;

      expect(result.dataSource).toBe("export");
      expect(result.neverInteracted.map((s) => s.username)).toContain("alice");
      expect(result.neverInteracted.map((s) => s.username)).toContain("bob");

      expect(result.dmSuggestionsMutual.map((s) => s.username)).toContain("alice");

      expect(result.dmSuggestionsNoFollowBack.map((s) => s.username)).toContain("carol");

      expect(result.unfollowCandidates.map((s) => s.username)).toContain("dave");
    });
  });
});
