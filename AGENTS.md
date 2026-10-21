# AGENTS.md

Instructions for an AI agent that has been asked to install, configure or verify Hardened Ops Agent. People should start with [README.md](README.md) and [docs/SETUP.md](docs/SETUP.md).

## What this repository is

The repository holds two n8n workflows, a Postgres schema and red-team scripts. There is no application to build and no package to install. Everything runs inside the user's own n8n.

## Before you start, ask the user for

- The URL of their n8n instance, and an n8n API key (*Settings → n8n API*). Never ask them to paste secrets into chat if you can read them from their environment.
- Confirmation that the [Blue Bookmark](https://github.com/aleks-gotsa/blue-bookmark) node is installed. Without it, the import fails with an unknown node type.
- Which Gmail inbox the agent should read, which Telegram chat should receive approval cards, and which GitHub repository tickets should go to.

## Install

1. Create the audit table in a database named `ops`:
   ```bash
   psql -U <user> -d ops < workflow/schema.sql
   ```
2. Import `workflow/hardened-ops-agent.json` with `POST /api/v1/workflows` and note the returned `id`.
3. In `workflow/inbox-fanout.json`, replace `MAIN_WORKFLOW_ID` with that `id`, then import it.
4. Have the user create these credentials in the n8n UI: Gmail OAuth2, Anthropic, Telegram, GitHub, Postgres (database `ops`), and Header Auth (header `x-rt-token`). OAuth needs a browser, so you cannot do this step for them.
5. Replace the placeholders in both workflows: every `REPLACE_ME` credential reference, `YOUR_TELEGRAM_CHAT_ID`, `YOUR_TELEGRAM_USER_ID`, `YOUR_GITHUB_OWNER` and `YOUR_REPO`.
6. Activate the main workflow first, then the fan-out.

## Verify

- Ask the user to send a customer-style question to the inbox. Within about a minute, a row appears in `agent_runs` with an `outcome` other than `processing`, and Telegram shows a card.
- After any API update to the fan-out, deactivate and re-activate it. n8n can report it as active while the Gmail poll has stopped.
- Regression checks live in `redteam/`. Copy `redteam/.env.example` to `redteam/.env`, then run `npm run checks` from that folder. The custom set expects 14/14 and the other three print PASS.

## Do not

- Do not press Approve or Decline in Telegram. That decision belongs to a human.
- Do not weaken a guard threshold, disable a check, or turn on the red-team test flags (`guard_bypass`, `dg_enforce`, `force_class`) to make a test pass. The flags only work through the token-protected red-team webhook.
- Do not send email anywhere except the test addresses the user names.
- Do not commit credentials, chat IDs, tunnel domains or real email addresses.
