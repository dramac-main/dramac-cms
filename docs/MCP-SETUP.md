# MCP Server Setup (Context7 + Supabase)

This project is configured to use two MCP (Model Context Protocol) servers in Cursor:

1. **Context7** – Up-to-date library documentation (Next.js, Supabase, React, etc.)
2. **Supabase** – Query and manage your Supabase project from Cursor

Config file: [`.cursor/mcp.json`](../.cursor/mcp.json)

---

## 1. Apply the config in Cursor

The file `.cursor/mcp.json` is already in the repo. Cursor should pick it up automatically.

- If it doesn’t: open **Cursor → Settings → Cursor Settings → Tools & MCP** (or **Features → MCP**).
- Click the edit icon to open the MCP config, or confirm it’s using the project config from `.cursor/mcp.json`.

Restart Cursor once so it loads both servers.

---

## 2. Context7 (optional: API key)

- **Without API key:** The config uses the public URL. You can use Context7 with possible rate limits.
- **With API key (recommended):** Get a key from [context7.com](https://context7.com), then add it to `.cursor/mcp.json`:

```json
"context7": {
  "url": "https://mcp.context7.com/mcp",
  "headers": {
    "CONTEXT7_API_KEY": "YOUR_API_KEY_HERE"
  }
}
```

**Usage in Cursor:** In the chat, you can say things like:

- “Use context7 to show me how to set up middleware in Next.js 15”
- “Use context7 for Supabase RLS examples”

---

## 3. Supabase (login in browser)

Supabase MCP uses Cursor’s OAuth flow. No manual token is required.

1. Restart Cursor after the config is in place.
2. When you first use a Supabase MCP tool (e.g. “List tables using Supabase MCP”), Cursor will open a browser window.
3. Log in to your Supabase account and grant access for the MCP client.
4. Choose the organization that contains the project you want to use.

After that, you can ask Cursor to run Supabase MCP tools, e.g.:

- “What tables are in my database? Use MCP tools.”
- “Use Supabase MCP to list migrations.”

**Optional – limit to one project:**  
Edit `.cursor/mcp.json` and add query parameters to the Supabase URL. Replace `YOUR_PROJECT_REF` with your project reference (from Supabase dashboard URL or project settings):

```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true"
}
```

- `project_ref` – Restricts the server to that project.
- `read_only=true` – Uses a read-only Postgres user (safer for production-like DBs).

---

## 4. Check that both servers are running

1. **Cursor → Settings → Cursor Settings → Tools & MCP**
2. You should see **context7** and **supabase** with a green/connected status.
3. If one is red or disconnected, restart Cursor and try again; for Supabase, trigger a tool once to complete the browser login.

---

## 5. Global config (optional)

If you prefer one config for all projects (e.g. with your Context7 API key), use the **global** MCP config instead of the project one:

- **Windows:** `%APPDATA%\Cursor\mcp.json`  
  (e.g. `C:\Users\YourName\AppData\Roaming\Cursor\mcp.json`)
- **macOS:** `~/.cursor/mcp.json`
- **Linux:** `~/.config/cursor/mcp.json`

Use the same `mcpServers` structure as in `.cursor/mcp.json`. If both global and project configs exist, behavior depends on Cursor’s merge rules; keeping one place (e.g. project) is simpler.

---

## Summary

| Server    | Config in `.cursor/mcp.json` | Extra step |
|----------|-----------------------------|------------|
| Context7 | ✅ URL only (optional headers with API key) | Optional: add API key for higher limits |
| Supabase | ✅ URL only (optional query params)        | First use: log in via browser when prompted |

After editing `.cursor/mcp.json`, restart Cursor so changes take effect.
