# redteam

Everything you need to check the agent yourself. Results and method: [docs/REDTEAM.md](../docs/REDTEAM.md).

## Setup

```bash
cp .env.example .env   # fill in your n8n API key, red-team token and webhook URL
```

Node 20.6 or newer. There are no dependencies to install.

## Commands

| Command | What it does | Time |
|---|---|---|
| `npm run attack -- A` | Sends 200 emails (100 attacks, 100 normal) through the full system. `B` = strict mode, `C` = agent alone. | ~17 min |
| `npm run checks` | Runs all four checks below | a few minutes |
| `npm run check:custom` | 12 hand-written attacks and 2 normal emails, each with an expected outcome | |
| `npm run check:audit` | Emails that break Telegram formatting still get a recorded decision and an alert | |
| `npm run check:duplicate` | The same email delivered twice is processed once | |
| `npm run check:payment` | Replies never ask a customer for card or login details | |
| `npm run sample` | Rebuilds `sample.jsonl` from the LLMail-Inject release placed in `data/` | |

## Files

- [run.js](run.js): sends the sample to the red-team webhook.
- [sample.js](sample.js) and [sample.jsonl](sample.jsonl): the seeded 200-email sample.
- [checks/](checks/): the four checks.
- [report.sql](report.sql): turns a run into the tables in the report. Run it with `psql -v since=<run start, UTC> < report.sql`.
- [results/](results/): every run, one line per email.
