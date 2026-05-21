/**
 * Temporary helper for rotating the seo-autopilot MCP bearer token.
 * Subcommands:
 *   list                                    – metadata of all tokens (no secret data)
 *   revoke <id>                             – revokes token by id
 *   create-and-save <name> <file> <days>    – creates token, writes raw to file (mode 0600)
 *
 * The raw token is NEVER printed to stdout. Only metadata (id, prefix, length) is.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  listMcpTokens,
  createMcpToken,
  revokeMcpToken,
  toPublic,
} from "../server/storage/mcpTokens";

const [, , cmd, ...rest] = process.argv;

async function main(): Promise<void> {
  if (cmd === "list") {
    const rows = await listMcpTokens();
    const summary = rows.map(toPublic).map((r) => ({
      id: r.id,
      name: r.name,
      tokenPrefix: r.tokenPrefix,
      scopes: r.scopes,
      active: r.active,
      expiresAt: r.expiresAt,
      revokedAt: r.revokedAt,
      lastUsedAt: r.lastUsedAt,
      callCount: r.callCount,
    }));
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (cmd === "revoke") {
    const id = Number(rest[0]);
    if (!Number.isFinite(id)) {
      console.error("Usage: revoke <id>");
      process.exit(2);
    }
    const ok = await revokeMcpToken(id);
    console.log(JSON.stringify({ id, revoked: ok }));
    return;
  }

  if (cmd === "create-and-save") {
    const [name, file, daysStr] = rest;
    if (!name || !file) {
      console.error("Usage: create-and-save <name> <absoluteFilePath> [days]");
      process.exit(2);
    }
    const days = daysStr ? Number(daysStr) : null;
    const expiresAt =
      days && Number.isFinite(days) ? new Date(Date.now() + days * 86_400_000) : null;

    const result = await createMcpToken({
      name,
      scopes: ["autopilot:read", "autopilot:write"],
      createdBy: "mcp-token-helper",
      expiresAt,
    });

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });

    // Write raw token with restrictive perms. flag wx → fail if file already exists
    // to avoid clobbering a previously-stored secret without explicit removal.
    await fs.writeFile(file, result.rawToken, { mode: 0o600, flag: "wx" });

    // Chmod again in case umask altered it
    await fs.chmod(file, 0o600);

    console.log(
      JSON.stringify({
        id: result.record.id,
        name: result.record.name,
        tokenPrefix: result.record.tokenPrefix,
        rawTokenLength: result.rawToken.length,
        expiresAt: result.record.expiresAt,
        savedTo: file,
      }),
    );
    return;
  }

  console.error("Unknown command. Use: list | revoke <id> | create-and-save <name> <file> [days]");
  process.exit(2);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  });
