---
name: git-workflow
description: Manage git branches, commits, and pull requests
triggers:
  - "create.*branch"
  - "switch.*branch"
  - "merge.*branch"
  - "checkout.*branch"
  - "make.*pr"
  - "pr.*create"
  - "commit.*changes"
  - "push.*changes"
---

# Git Workflow Helper

Handle common git operations for the InsureAssist CRM project.

## Branch Operations

### Create New Branch
```
git checkout -b feature/your-feature-name
```

### Switch Branch
```
git checkout branch-name
```

### List Branches
```
git branch -a
```

### Delete Branch
```
git branch -d branch-name        # local
git push origin --delete branch-name  # remote
```

## Commit Operations

### Stage Changes
```
git add .
git add path/to/file
```

### Commit Changes
```
git commit -m "type: description"
```

### Commit Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build/chore changes
- `perf:` - Performance improvement

### View Recent Commits
```
git log --oneline -5
git show HEAD
```

## Pull Request Operations

### Create PR
```
gh pr create --title "type: description" --body "description"
```

### View PRs
```
gh pr list
gh pr view
```

### Merge PR
```
gh pr merge
gh pr merge --squash
gh pr merge --rebase
```

## Push Operations

### Push to Remote
```
git push origin main
git push origin feature-branch
```

### Push with Upstream
```
git push -u origin feature-branch
```

## Sync Operations

### Pull Latest Changes
```
git pull origin main
```

### Fetch All Branches
```
git fetch --all
```

## Status and Diff

### Check Status
```
git status
```

### View Diff
```
git diff
git diff path/to/file
```

### View Staged Diff
```
git diff --staged
```

## Undo Operations

### Unstage Changes
```
git restore --staged path/to/file
```

### Discard Uncommitted Changes
```
git restore path/to/file
git checkout -- path/to/file
```

### Reset to Previous Commit
```
git reset --soft HEAD~1  # keep changes
git reset --hard HEAD~1  # discard changes
```

## Project-Specific Notes

### Main Branch
- Main branch is `main`
- Deployments happen from `main` via Vercel
- Worktrees are in `.claude/worktrees/`

### Commit Flow
1. Make changes
2. Test locally
3. `git add` files
4. `git commit` with descriptive message
5. `git push origin main`
6. Vercel auto-deploys
