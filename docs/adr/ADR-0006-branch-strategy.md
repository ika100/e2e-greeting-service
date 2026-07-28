# ADR-0006: Squash-Merge to Main with task/T-NNN Branches

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, references/gitflow.md

## Context

The build skill dispatches parallel coding agents, each working in an isolated git worktree
on a separate branch. A branch and merge strategy is needed that keeps `main` clean,
supports concurrent task development, and integrates with CI gates.

## Decision

We will use **squash-merge to `main`** with branches named `task/T-NNN-<kebab-slug>`.
Each task gets one branch; PRs are squash-merged with a Conventional Commit message.

Branch types:
- `task/T-NNN-<slug>` — feature/fix work (one per task)
- `chore/setup-<timestamp>` — foundational serial setup
- `hotfix/T-NNN-<slug>` — post-release bug fixes
- `release/v<semver>` — release prep (created by release skill)

## Alternatives Considered

- **Git Flow (feature + develop + release branches)** — more complex; overkill for a
  single-service repository with a small team.
- **Trunk-based development (direct push to main)** — no PR review step; bypasses CI
  gates; not safe for automated agents.
- **Rebase merge** — preserves individual commits but produces a noisier `main` history;
  harder for the release skill to parse conventional commit bumps from squashes.

## Consequences

**Positive**
- One commit per task on `main` → clean, readable history.
- Conventional commit squash message drives semver bump in release skill.
- Isolated worktrees prevent agents from conflicting with each other.
- PR CI gates run per branch before merge.

**Negative / trade-offs**
- Individual commit history within a task branch is lost on squash merge. Acceptable
  because the PR description captures context.

**Neutral / follow-ups**
- Add `.worktrees/` and `planning/.build/` to `.gitignore`.
- Configure GitHub branch protection: require PR + CI pass before merge to `main`.
- PR title format: `[T-NNN] <Imperative summary>`.
