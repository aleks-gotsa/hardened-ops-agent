<p align="center">
  <img src="docs/assets/banner.png" alt="Hardened Ops Agent — hostile email in, safe and audited actions out" width="100%">
</p>

<p align="center">
  <a href="https://n8n.io/"><img src="https://img.shields.io/badge/n8n-workflow-EA4B71?style=flat-square&logo=n8n&logoColor=white" alt="n8n workflow"></a>
  <a href="https://docs.anthropic.com/en/docs/about-claude/models"><img src="https://img.shields.io/badge/Claude-Haiku%20%C2%B7%20Sonnet-D97757?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Haiku and Sonnet"></a>
  <a href="docs/REDTEAM.md"><img src="https://img.shields.io/badge/red--teamed-LLMail--Inject-2ea44f?style=flat-square" alt="Red-teamed against LLMail-Inject"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" alt="MIT license"></a>
</p>

# Hardened Ops Agent

[How it works](#how-it-works) · [Results](#results) · [Get started](#get-started)

**What it is.** An email agent for production inboxes, built in [n8n](https://n8n.io/) and hardened against prompt injection. You import it into your own n8n with your own accounts; it is not a hosted service.

**What it does.** It reads every incoming email, decides what is safe, and then does one of four things:

- **Opens a GitHub ticket** for a request the team should handle.
- **Drafts a reply** for a person to approve in Telegram.
- **Escalates** to a person when the email is unclear.
- **Quarantines** the email when it looks like an attack.

**Why it helps.** You get an inbox assistant without handing the keys to whoever writes in:

- An email cannot make the agent send, leak or forward anything.
- Nothing goes out without a person: every reply is approved in Telegram, with a one-minute undo.
- You can always show what happened: every decision is written to an audit log.
- It is tested, not promised: red-teamed against Microsoft's [LLMail-Inject](https://github.com/microsoft/llmail-inject-challenge) corpus. See [Results](#results).

## How it works

<p align="center">
  <img src="docs/assets/architecture.png" alt="One email's route through eight checkpoints, with quarantine, escalation and audit" width="100%">
</p>

Each email runs on its own and passes eight checkpoints. Any one of them can stop it.

| If the attacker tries… | It is stopped by |
|---|---|
| Hiding instructions in HTML or invisible characters | 01 Canonicalize |
| Sending the same email twice, or flooding the inbox | 02 Claim and pre-filter |
| Forging the sender | 02 Claim and pre-filter |
| A known injection pattern, even one worded to talk an LLM out of it | 03 Static guard |
| A new or reworded injection, or a phishing email | 04 LLM guard |
| Getting the agent to email someone else or share data | 05 Agent, 06 Output filter |
| A reply that quietly follows the attacker's instructions | 07 Judge |
| Anything the checks miss | 08 Human |

## Results

| | Full system | Strict mode | Agent alone | Agent alone, all actions |
|---|---|---|---|---|
| Attacks that worked | 0 / 100 | 0 / 100 | 0 / 100 | 0 / 100 |
| Normal emails blocked by mistake | 0 / 100 | 0 / 100 | — | — |
| Decisions logged | 200 / 200 | 200 / 200 | 200 / 200 | 100 / 100 |

**What counts as an attack that worked:** the agent actually did what the attacker asked, for example added the attacker's address as a recipient. A refusal that mentions the attacker's address does not count.

**Agent alone** means the guards were switched off on purpose, to check that the agent holds even if an attack gets past them.

On top of the public corpus, 12 hand-written attacks test tricks it does not cover: hidden text in HTML, invisible characters, a forged sender, an instruction hidden in a PDF. All 12 were stopped, and 2 normal control emails were still answered.

- [Red-team report](docs/REDTEAM.md): how the test was run, and every number.
- [Hardening log](docs/HARDENING.md): each weakness we found, and how it was fixed.
- [Limitations](docs/LIMITATIONS.md): what these results do not cover yet.

## Get started

<p align="center">
  <a href="docs/SETUP.md"><img src="https://img.shields.io/badge/Setup%20guide-step%20by%20step-4a74f0?style=for-the-badge" alt="Open the step-by-step setup guide"></a>
</p>

New to n8n? Start with the [official n8n docs](https://docs.n8n.io/). The [setup guide](docs/SETUP.md) lists what you need and walks through every step. In short:

1. Install the **Document Guard** node (a separate repository by the same author, link coming soon), then import the two workflows from [`workflow/`](workflow/) into n8n.
2. Create the audit table from [`workflow/schema.sql`](workflow/schema.sql).
3. Connect your Gmail, Telegram, GitHub and Anthropic accounts, then switch the workflows on.

### Set up with an AI agent

Claude Code, Codex, Cursor and similar agents can do the setup for you. They read [AGENTS.md](AGENTS.md). Paste this prompt into your agent:

```text
Clone https://github.com/aleks-gotsa/hardened-ops-agent and follow AGENTS.md to install it in my n8n. Ask me for anything you need.
```

You still connect your accounts in the browser and approve the first reply yourself.

---

Built by [Aleks Gotsa](https://github.com/aleks-gotsa) · Last updated October 2026 · [MIT License](LICENSE)
