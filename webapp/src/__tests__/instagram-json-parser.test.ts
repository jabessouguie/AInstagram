/**
 * Unit tests for instagram-json-parser.ts
 * Focuses on format detection (isJsonExport) and pure helper logic.
 */

import { isJsonExport } from "@/lib/instagram-json-parser";
import fs from "fs";
import path from "path";

jest.mock("fs");
const mockFs = fs as jest.Mocked<typeof fs>;

beforeEach(() => {
  jest.resetAllMocks();
  mockFs.existsSync.mockReturnValue(false);
});

// ─── isJsonExport ─────────────────────────────────────────────────────────────

describe("isJsonExport", () => {
  const folder = "/mock/instagram-test";

  it("returns true when personal_information.json is present", () => {
    mockFs.existsSync.mockImplementation((p) => String(p).endsWith("personal_information.json"));
    expect(isJsonExport(folder)).toBe(true);
  });

  it("returns true when audience_insights.json is present (no personal_information.json)", () => {
    mockFs.existsSync.mockImplementation((p) => String(p).endsWith("audience_insights.json"));
    expect(isJsonExport(folder)).toBe(true);
  });

  it("returns false when neither JSON indicator file is present (HTML export)", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(isJsonExport(folder)).toBe(false);
  });

  it("checks the correct paths inside the export folder", () => {
    const piPath = path.join(
      folder,
      "personal_information",
      "personal_information",
      "personal_information.json"
    );
    const insightPath = path.join(
      folder,
      "logged_information",
      "past_instagram_insights",
      "audience_insights.json"
    );

    mockFs.existsSync.mockReturnValue(false);
    isJsonExport(folder);

    expect(mockFs.existsSync).toHaveBeenCalledWith(piPath);
    // If pi check returns false, the insight path should also be checked
    expect(mockFs.existsSync).toHaveBeenCalledWith(insightPath);
  });
});

// ─── upload route — HTML format rejection (integration-level unit test) ───────

describe("upload route rejects HTML exports", () => {
  it("isJsonExport returns false for a folder with only .html files", () => {
    // Simulate an HTML export: no .json indicator files at the expected paths
    mockFs.existsSync.mockImplementation((p) => {
      const s = String(p);
      // Only .html files exist
      return s.endsWith("followers_1.html") || s.endsWith("following.html");
    });
    expect(isJsonExport("/mock/instagram-html-export")).toBe(false);
  });
});
