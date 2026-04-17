# DRAMAC CMS — Session 6 Quick Agent Prompt

Use this when you want a shorter copy-paste handoff for another AI agent.

---

```text
Read these first, in order:
1. /memory-bank/projectbrief.md
2. /memory-bank/productContext.md
3. /memory-bank/systemPatterns.md
4. /memory-bank/techContext.md
5. /memory-bank/activeContext.md
6. /memory-bank/progress.md
7. /phases/PHASE-INVFIX-MASTER-GUIDE.md
8. /phases/PHASE-INVFIX-SESSION-BRIEF.md
9. /phases/PHASE-INVFIX-SESSION-06-PROMPT.md

Then run `git status --short` and inspect the current invoicing-related diffs before editing. Treat the working tree as partially advanced, not clean.

Verified reality:
- Do not reintroduce Stripe into the invoicing module.
- Paddle remains the platform billing provider.
- The invoice module is manual-collection only: bank transfer, mobile money, cash, cheque, other.
- Recent hotfix already fixed the broken settings save mapping, invoice row mapping, item price decimal handling, and public invoice totals mapping.

Your scope is only INVFIX-04 + INVFIX-05 carryover closure:
1. Make public invoice payment behavior coherent under `onlinePaymentEnabled`.
2. Finish real persisted receipt numbering and receipt rendering.
3. Close reconciliation, payment detail, receipt, and export surfaces cleanly.
4. Reconcile repo migrations with the manual-payment architecture; do not leave Stripe schema behind.
5. Finish recurring form UX: notify option plus in-form next 12 occurrences with amounts.
6. Generate recurring invoices from current linked client/company/storefront data when available.
7. Finish cron robustness: claim lock, safe release, structured history, and failure alerting.

Hard rules:
- Do not start INVFIX-06.
- Do not overwrite existing working-tree changes blindly.
- Do not confuse Paddle platform billing with invoice-module collection.
- Do not claim completion if receipt numbering, recurring generation accuracy, or cron history are still partial.

Before finishing:
- Run the TypeScript baseline from `next-platform-dashboard` with enough memory.
- Confirm no new invoicing-specific regressions in touched files.
- Update `/memory-bank/activeContext.md` and `/memory-bank/progress.md`.
- Commit and push only if INVFIX-04/05 carryover is actually closed.
```

---

For the full detailed version, use `phases/PHASE-INVFIX-SESSION-06-PROMPT.md`.