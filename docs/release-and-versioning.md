# Release And Versioning

## Branch Model

- `dev` is the active integration branch.
- `main` is reserved for stable releases unless the user says otherwise.
- Feature branches should use the `codex/` prefix when branches are needed.

## Commit Model

- Use one commit for each accepted spec.
- Use one commit for each clean implementation phase.
- Corrective commits are allowed and should be named clearly.

## Tag Model

- No release tags are required yet.
- The first semver tag should wait for a stable engine-backed playable milestone.
- Suggested future tags: `v0.1.0-engine-ui`, `v0.2.0-engine-ai`, `v0.3.0-match-modes`.

## Package Version

Keep `package.json` at `0.0.0` until a release milestone unless the user approves changing it.

## Changelog

`CHANGELOG.md` is optional now. Add it once release tags start.

## CI/CD

- CI gates run on pull requests and pushes to `dev` or `main`.
- Deployment is not automatic until a hosting target is chosen.
- Build artifacts may be uploaded by CI for inspection.
