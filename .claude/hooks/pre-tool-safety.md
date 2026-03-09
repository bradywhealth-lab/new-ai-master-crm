---
name: Pre-Tool Safety Check
trigger: PreToolUse
condition: tool_name in ["Bash", "Edit", "Write"] && (
  tool.command starts_with("git reset") ||
  tool.command starts_with("git push --force") ||
  tool.command starts_with("rm") ||
  tool.command starts_with("drop") ||
  tool.command starts_with("delete") ||
  tool.command starts_with("truncate") ||
  tool.old_string includes("DROP TABLE") ||
  tool.old_string.includes("DELETE FROM") ||
  tool.old_string.includes("TRUNCATE") ||
  tool.old_string.includes("rm -rf")
)

⛔ You are about to perform a potentially dangerous operation.

## Operation Analysis

**Tool:** {{ tool_name }}
**Command/Edit:** {{ tool.command || tool.old_string }}

## Risk Assessment

This operation could:
- ❌ Lose uncommitted work
- ❌ Delete data permanently
- ❌ Break production deployment
- ❌ Affect other users
- ❌ Be difficult to reverse

## Before You Proceed

### For Git Operations
- [ ] Verify correct branch
- [ ] Check for uncommitted changes
- [ ] Confirm you have backups if needed
- [ ] Consider alternative approaches

### For Database Operations
- [ ] Verify table name is correct
- [ ] Check if data should be preserved
- [ ] Have you tested in development first?
- [ ] Is this absolutely necessary?

### For File Operations
- [ ] Verify file path is correct
- [ ] Confirm file should be deleted
- [ ] Check for important data
- [ ] Are you sure?

## Safer Alternatives

### Instead of `git reset --hard`
- Use `git restore` for unstaged changes
- Use `git reset --soft` to keep changes
- Create new branch to preserve work

### Instead of `rm -rf`
- Use `rm` for single files
- Move to temp directory instead
- Check what's in directory first

### Instead of `DROP TABLE`
- Add a column instead
- Rename table instead
- Archive old data first

## If You're Absolutely Sure

1. Confirm the exact impact
2. Have a rollback plan ready
3. Know how to recover if something goes wrong
4. Document what you're doing

**Proceed at your own risk.**
