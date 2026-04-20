/**
 * seo-autopilot MCP — public entry point.
 *
 * Mount like:
 *
 *     import { createSeoAutopilotRouter } from "./mcp/seo-autopilot";
 *     app.use("/api/mcp/seo-autopilot", createSeoAutopilotRouter());
 *
 * Requires DATABASE_URL + MCP_TOKEN_SALT in env.
 * Tokens are managed from /api/admin/mcp-tokens (see routes/admin-mcp-tokens.ts).
 */
export { createSeoAutopilotRouter } from "./router.js";
export { registerAutopilotTools } from "./tools.js";
