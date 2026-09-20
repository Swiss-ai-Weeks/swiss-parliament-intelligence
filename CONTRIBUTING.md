# Contributing to the Swiss pilot

## Branch policy

The working branch until final submission is:

```text
tomasgarro/swiss-parliament-intelligence:feat/swiss-citizen-pilot
```

Push implementation and documentation changes only to that branch. Do not push directly to either `main` branch or to `Swiss-ai-Weeks/swiss-parliament-intelligence` without explicit approval.

Baseline on 20 September 2026:

- `fork/feat/swiss-citizen-pilot` and `origin/main` had identical Git trees.
- `fork/main` was two implementation commits behind and did not include the latest account, MFA and profile work.
- Documentation work after that baseline intentionally makes the feature branch newer than both main branches.

Before final submission, compare all three refs explicitly and review the merge rather than assuming branch names imply content parity:

```bash
git fetch --all --prune
git diff --stat fork/main..fork/feat/swiss-citizen-pilot
git diff --stat origin/main..fork/feat/swiss-citizen-pilot
```

## Development rules

- Preserve original-source provenance and source URLs.
- Keep official text, machine transcription, translation and generated explanation distinct.
- Do not describe queued processing as completed or machine alignment as human-reviewed.
- Keep secrets, imported databases, media and private account data out of Git.
- Add or update tests when application behavior changes.
- Update `docs/STATUS.md` only from validated artifacts; operators can inspect counts with `npm run docs:status`.

## Validation

Run the checks relevant to every change:

```bash
npm run docs:check
npm test
npm run test:api --prefix frontend
npm run test:sites --prefix frontend
npm run build --prefix frontend
git diff --check
```

Provider mocks prove request contracts, not live model, email, OAuth or GPU availability. Record any provider-dependent acceptance separately and date it.

## Commit and push

Keep canonical-document changes and historical archive moves in separate commits so both are reviewable. Confirm the destination before pushing:

```bash
git branch --show-current
git remote -v
git push fork feat/swiss-citizen-pilot
```
