/**
 * Public MCP server — entry point.
 *
 * Mount like:
 *
 *     import { createPublicMcpRouter } from "./mcp/public";
 *     app.use("/api/mcp/public", createPublicMcpRouter());
 *
 * No authentication required. Rate-limited to 60 req/min/IP. Designed so
 * Claude Desktop, Cursor, Continue, LangGraph or any other MCP client can
 * connect us as an HTTP MCP server with zero configuration.
 *
 * Tools exposed (read-mostly):
 *   - search_boats(query?, capacity?, license_required?, max_price?)
 *   - check_availability(boatId, date)
 *   - get_pricing_calendar(boatId, from, to, duration)
 *   - list_routes()
 *   - get_faq(query?, lang?)
 *   - search_knowledge(query, lang?)
 *   - get_business_info(lang?)
 *   - request_booking_hold(boatId, startTime, endTime, numberOfPeople, extras?)
 */

export { createPublicMcpRouter } from "./router.js";
export { registerPublicTools } from "./tools.js";
