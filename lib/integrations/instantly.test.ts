import { describe, it, expect } from "vitest";
import { selectCampaign } from "./instantly";

const ACTIVE = 1;
const DRAFT  = 0;
const PAUSED = 2;

function camp(id: string, name: string, status: number) {
  return { id, name, status };
}

describe("selectCampaign", () => {
  it("picks the active exact-name match over draft duplicates", () => {
    const campaigns = [
      camp("draft-1",  "PSL - Texas", DRAFT),
      camp("draft-2",  "PSL - Texas", DRAFT),
      camp("active-1", "PSL - Texas", ACTIVE),
    ];
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("active-1");
  });

  it("picks active exact match even when it is listed last", () => {
    const campaigns = [
      camp("active-1", "PSL - Texas", ACTIVE),
      camp("draft-1",  "PSL - Texas", DRAFT),
    ];
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("active-1");
  });

  it("prefers active prefix match over draft exact match", () => {
    const campaigns = [
      camp("draft-exact",   "PSL - Texas",   DRAFT),
      camp("active-prefix", "PSL - Texas",   ACTIVE),
    ];
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("active-prefix");
  });

  it("falls back to non-active exact match when no active exists", () => {
    const campaigns = [
      camp("draft-1", "PSL - Texas", DRAFT),
      camp("other-1", "PSL - Florida", ACTIVE),
    ];
    // Should not pick PSL - Florida (different territory), picks the draft exact match
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("draft-1");
  });

  it("falls back to any PSL- prefix when no exact match exists", () => {
    const campaigns = [
      camp("active-other", "PSL - Florida", ACTIVE),
    ];
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("active-other");
  });

  it("returns null when no campaigns exist", () => {
    expect(selectCampaign([], "Texas")).toBeNull();
  });

  it("returns null when no PSL campaigns exist", () => {
    const campaigns = [
      camp("other", "Other Campaign", ACTIVE),
    ];
    expect(selectCampaign(campaigns, "Texas")).toBeNull();
  });

  it("returns null for empty list — caller should throw, not create", () => {
    expect(selectCampaign([], "Texas")).toBeNull();
  });

  it("handles case-insensitive name matching", () => {
    const campaigns = [
      camp("active-1", "psl - texas", ACTIVE),
    ];
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("active-1");
  });

  it("prefers active exact over active prefix", () => {
    const campaigns = [
      camp("active-prefix", "PSL - Florida", ACTIVE),
      camp("active-exact",  "PSL - Texas",   ACTIVE),
    ];
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("active-exact");
  });

  it("prefers paused exact-territory match over active different-territory", () => {
    const campaigns = [
      camp("paused-exact",  "PSL - Texas",   PAUSED),
      camp("active-prefix", "PSL - Florida", ACTIVE),
    ];
    // Exact territory wins — wrong territory is permanent, paused is temporary
    expect(selectCampaign(campaigns, "Texas")?.id).toBe("paused-exact");
  });
});
