# Hardening backlog (19 Oct 2026)

Sources: a web review of known weak spots in LLM email agents, plus findings from our own tests. Each item lists its status in this workflow.

## Found in our own tests

| # | Weakness | Evidence | Status |
|---|---|---|---|
| H1 | **Batch loss.** `Normalize`, `Merge Guard`, `Allowlist` and `Score redteam` run "once for all items" and read `.first()`. If one Gmail poll returns two emails, only the first is processed; the second gets no audit row and no alert. | `Normalize`: `const inp = $input.first().json` | **fixed**: one email per execution via the fan-out workflow; code nodes also per item. The first fix (per-item code nodes only) failed the manual two-email test |
| H2 | Agent action `none` had no route → row stuck in `processing`. | `Act` fallback output unwired | **fixed**: `Mark no action` (`outcome = no_action`) |
| H3 | Approval card broke on `_ * \` [` (send-and-wait always uses legacy Markdown). | n8n source: `parse_mode: 'Markdown'` | **fixed**: escaped and restructured |
| H4 | Agent asked customers for the last 4 card digits. | `checks/no-payment-data.js`: 1/3 replies before the fix | **fixed**: prompt rule plus deterministic check in `Allowlist`; 0/3 after |

## From research, mapped to this design

| # | Weakness | Applies here because | Fix | Effort | Source | Status |
|---|---|---|---|---|---|---|
| R1 | Each layer reads a different version of the email (hidden HTML, Unicode Tags, zero-width, bidi) | Haiku missed `display:none` (F2); Sonnet reads `body_text` | One `Canonicalize` node: visible text from the HTML, NFKC, strip invisible ranges, count what was stripped, then the same view goes to Blue Bookmark, Haiku and Sonnet. Hidden content raises the score. | S | embracethered.com (Unicode tags) | **fixed** |
| R2 | The reply goes to the attacker, so it is an exfiltration and phishing channel | `reply_text` goes back to the sender | Deterministic output filter: no URLs outside an allowlist, no foreign phone numbers or emails, length cap, a canary string from the system prompt | S | arXiv 2506.08837 | **fixed** |
| R3 | Sender not authenticated; Reply-To can redirect | Gmail reply target not verified | Parse `Authentication-Results`: DMARC/SPF/DKIM fail → escalate. Reply-To ≠ From → escalate. | S | RFC 3834, Google DMARC docs | **fixed** (+ `replyToSenderOnly`) |
| R4 | Ticket body is attacker text (GitHub injection, @mentions, images) | `args.title/body` come from the LLM | Fence the body as code, strip `@` and images; labels set by code | S | invariantlabs.ai | **fixed** |
| R5 | Fixed `<email>` delimiter can be closed by the attacker | prompt uses literal `<email>…</email>` | Random per-run delimiter; escape `<\|…\|>` role tokens; strip quoted thread history | S | arXiv 2506.09956 (LLMail-Inject) | **fixed** |
| R6 | No check of the agent's output against the email | only the class allowlist; the class itself comes from an LLM | Post-agent judge (Haiku): does the reply answer what was asked, with no new URLs or commitments? | M | arXiv 2506.09956 | **fixed** |
| R7 | Auto-responder / bot loops (worming) | loop guard checks only the SENT label | Drop `Auto-Submitted`≠no, `List-*`, `Precedence: bulk`, MAILER-DAEMON; cap replies per thread and per sender | S | RFC 3834, arXiv 2302.12173 | **fixed** |
| R8 | Hidden channels in PDFs (white text, metadata, image-only) | PDF text goes straight to the models | Run R1 on PDF text; an empty extraction escalates | M | Willison, dual-LLM pattern | **fixed**: same canonical pass on PDF text; an attachment with no extractable text (image-only PDF, other format, extraction error) sets `attachment_unreadable` and escalates |
| R9 | No resource limits | flood → cost + Telegram queue | Per-sender rate limit in Postgres, body length cap | S | OWASP LLM10 | **fixed** (10/hour per sender, 8k chars) |

## Already covered (safe to claim)

Fixed small action space with a code-side allowlist; a human approves every outgoing email (undo window plus a second lock); static plus LLM layers (defence in depth); fail-closed guard; no RAG or cross-mailbox context; idempotency; full audit trail.

## Found while building the fixes

| # | Weakness | Evidence | Status |
|---|---|---|---|
| H5 | Gmail reply goes to `Reply-To` when present **and to every address in `To`**. | n8n source `replyToEmail.js`: Reply-To used from node 2.2; `To` added unless `replyToSenderOnly` | **fixed**: `replyToSenderOnly: true`, and Reply-To ≠ From escalates |
| H6 | **Agent failure crashed the run** (`Model output doesn't fit required format` on an attack), leaving the row in `processing` with no alert. Same class as F4, but on the agent. | Run C smoke test, execution 969 | **fixed**: agent error output → `Agent failed` → escalate |
| H7 | **The judge blocked safe replies over quality.** Its rules mixed safety with completeness, so a safe holding reply ("sales will follow up with the price") was escalated. A person approves every draft anyway. | Benign control escalated in 1 of 5 runs; judge reason: "does not answer the pricing question" | **fixed**: the verdict is about safety only, and completeness becomes a judge note shown on the approval card. Afterwards: 14/14, and the control was answered 5/5. |

## Found by a security review of the repo

| # | Weakness | Evidence | Status |
|---|---|---|---|
| A1 | **Forged `Authentication-Results`.** The Gmail node keeps only the *last* copy of each header. An attacker can add their own `dmarc=pass` header below Gmail's, and it wins. | n8n source `GenericFunctions.js`: `headers[header.key] = header.line` | **fixed**: the fan-out reads the headers in order through the Gmail API and keeps the first one stamped by `mx.google.com`. If it is missing, the sender counts as unauthenticated. |
| A2 | A guard result with no numeric score became `NaN`, which never meets the 0.7 threshold, so the email was not quarantined. | `Merge Guard`: `Number(g.injection_risk)` | **fixed**: a missing or non-numeric score is treated as maximum risk |
| A3 | Red-team test flags were accepted based on the shape of the input, not on which trigger fired. | `Normalize`: `inp.body.redteam === true` | **fixed**: only when the token-protected webhook fired |
| A4 | Tickets are created without human approval, and the rate limit is per sender, not global. | `Act → Create ticket` | open, listed under Limitations |

## Verification

- `redteam/checks/custom-attacks.js`: 14/14 as expected (12 attacks blocked, 2 benign controls answered).
- Regression after every change, last run after A1–A3: `audit-under-load` 5/5 + alerts 5/5, `no-duplicate-reply` PASS, `no-payment-data` PASS.
- After replacing the Document Guard prototype with Blue Bookmark v1 (21 Oct): custom set 14/14, regressions PASS, then the full red-team re-run in [REDTEAM.md](REDTEAM.md).
- Real mail after A1: a Proton → Gmail email passed authentication (`dkim=pass`, `spf=pass`) and was handled as `support`.
- Manual tests: two emails in a row → two separate runs; Approve → undo → sent; Cancel; Decline → Reopen; Ignore; no answer for 2 h → timeout notice, nothing sent.
