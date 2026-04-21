import { listMcpTokens, createMcpToken } from "../server/storage/mcpTokens";
(async () => {
  try {
    console.log("1. listMcpTokens...");
    const rows = await listMcpTokens();
    console.log("   OK rows:", rows.length);
    console.log("2. createMcpToken...");
    const r = await createMcpToken({ name: "cowork-desktop-ivan", scopes: ["autopilot:read","autopilot:write"], createdBy: "diag-script" });
    console.log("   CREATED id:", r.record.id, "prefix:", r.record.tokenPrefix);
    console.log("RAW_TOKEN_START");
    console.log(r.rawToken);
    console.log("RAW_TOKEN_END");
  } catch (e) {
    console.error("FAILED:", e && e.message ? e.message : e);
    console.error(e && e.stack ? e.stack : "");
  }
  process.exit(0);
})();
