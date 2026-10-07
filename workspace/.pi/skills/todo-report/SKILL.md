---
name: todo-report
description: Collect TODO and FIXME comments in the project and write a prioritized report to TODO-REPORT.md. Use when the user asks what is left to do or for a TODO report.
---

# TODO report

1. Find every `TODO` and `FIXME` comment under `src/` with `grep -rn "TODO\|FIXME" src`.
2. Write `TODO-REPORT.md` with a table: file, line, kind (TODO / FIXME), the comment, and a priority (FIXME = high, TODO = normal).
3. End your answer with the number of items found.

