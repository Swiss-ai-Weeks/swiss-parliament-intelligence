# Contributing to the Swiss pilot

## Branch policy

Work on a short-lived branch in Tomas Garro's fork (`tomasgarro/swiss-parliament-intelligence`), then open a pull request into the fork's `main`. The submission sprint used `sprint/cleisthenes-mvp`.

- Never push directly to `main`.
- Never push to the organization repository (`Swiss-ai-Weeks/swiss-parliament-intelligence`) without explicit approval.
- Deploys, releases and pushes each need explicit approval; show the plan and a diff summary first.

Before merging, compare the refs explicitly rather than assuming branch names imply content parity:

```bash
git fetch --all --prune
git diff --stat fork/main..HEAD
git diff --stat origin/main..HEAD
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
git push fork "$(git branch --show-current)"
```
