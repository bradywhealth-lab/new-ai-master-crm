---
name: commit
description: Create a git commit for staged changes
parameters:
  name: message
  type: string
  description: Commit message (optional, will prompt if not provided)
  optional: true
---

Quickly create a git commit with descriptive message following convention.

**Usage:** `/commit fix typo in lead validation`

If no message provided, you'll be prompted for details about the changes.

**Commit conventions:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `perf:` - Performance improvement

**Examples:**
- `/commit` - Interactive prompt
- `/commit "feat: add lead source tracking"`
- `/commit "fix: update scraper validation logic"`
