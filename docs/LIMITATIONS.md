# Limitations

What the results do not show yet, and what would close each gap.

| Limitation | Why it matters | Next step |
|---|---|---|
| The public attack corpus is plain text. | HTML and PDF attacks are tested only by the 12-case custom set. | A larger HTML and PDF attack set. |
| Safe is not yet useful. | Almost every ordinary email in the corpus was escalated to a person rather than answered. They are internal business mail, not customer requests, so the agent had no allowed action. | Measure on real customer-support mail and widen the allowed actions where it is safe. |
| LLM scores vary. | On identical input, Haiku's scores differ between runs. The totals moved by up to 3 per bucket. | Report results as a range over several runs. |
| Tickets need no approval. | Ticket creation is not human-gated, and spend is capped per sender, not globally. | A human gate for tickets, or a global hourly cap. |
| One machine. | Tested on a laptop. The Gmail poll stops while it sleeps. | Run n8n on a server. |
