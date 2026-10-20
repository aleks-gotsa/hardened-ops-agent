# workflow

Everything you import. Full guide: [docs/SETUP.md](../docs/SETUP.md).

| File | What it is | Import |
|---|---|---|
| [schema.sql](schema.sql) | The `agent_runs` audit table, in PostgreSQL | first, into a database named `ops` |
| [hardened-ops-agent.json](hardened-ops-agent.json) | The agent: eight checkpoints, approval and audit | second, into n8n. Note its ID. |
| [inbox-fanout.json](inbox-fanout.json) | Polls Gmail and starts one agent run per email | third. Set `MAIN_WORKFLOW_ID` to the ID from the previous step. |

The workflows contain no credentials. Every `REPLACE_ME` and `YOUR_…` value is a placeholder for your own account.
