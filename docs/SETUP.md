# Setup

## What you need

| | Tested with | Used for |
|---|---|---|
| [n8n](https://docs.n8n.io/hosting/) in queue mode | 2.43.7 | runs both workflows (main process plus worker) |
| [PostgreSQL](https://www.postgresql.org/) | 16 | n8n's own data and the `agent_runs` audit table |
| [Redis](https://redis.io/) | 7.4 | the n8n job queue |
| [Document Guard](https://github.com/aleks-gotsa/blue-bookmark) node (Blue Bookmark) | v1 | the static guard (checkpoint 03). Without it, n8n reports an unknown node on import. |
| Gmail account | | the inbox the agent reads and replies from |
| [Telegram bot](https://core.telegram.org/bots#how-do-i-create-a-bot) | | approval cards and alerts |
| GitHub repository and token | | tickets |
| [Anthropic API key](https://console.anthropic.com/) | Claude Haiku and Sonnet | guard, agent and judge |

n8n needs a public URL, a domain or a tunnel, because Telegram's approval buttons call back into it.

## Steps

1. Create the audit table in a database named `ops`:
   ```bash
   psql -U n8n -d ops < workflow/schema.sql
   ```
2. Add these credentials in n8n (*Credentials → Add*):
   - Gmail OAuth2
   - Anthropic
   - Telegram
   - GitHub
   - Postgres, pointed at the `ops` database
   - Header Auth for the red-team webhook: header `x-rt-token` with any long random value
3. Import [`workflow/hardened-ops-agent.json`](../workflow/hardened-ops-agent.json) (*Workflows → Import from file*). Note its ID from the URL.
4. Import [`workflow/inbox-fanout.json`](../workflow/inbox-fanout.json). In its *Run agent workflow* node, replace `MAIN_WORKFLOW_ID` with the ID from step 3.
5. In every node marked `REPLACE_ME`, pick your credential. Then replace the placeholders:

   | Placeholder | Value |
   |---|---|
   | `YOUR_TELEGRAM_CHAT_ID` | the chat where cards and alerts arrive |
   | `YOUR_TELEGRAM_USER_ID` | the only Telegram user allowed to press Approve |
   | `YOUR_GITHUB_OWNER`, `YOUR_REPO` | where tickets are opened |

6. Activate the main workflow first, then the fan-out.
7. Send a customer-style question to the inbox. Within a minute, Telegram shows one of two cards:
   - a draft with *Approve* and *Decline*;
   - an escalation with *Draft a reply* and *Ignore*.

> [!TIP]
> After you edit the fan-out, switch it off and on again. Otherwise n8n can report it as active while the Gmail poll has stopped.

## Red-team runs

See [Reproduce](REDTEAM.md#reproduce) in the red-team report.
