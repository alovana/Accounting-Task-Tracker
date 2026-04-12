# Subagents

## Available specialists

### vision
- Profile: `subagents/vision.md`
- Preferred model: `google/gemini-2.5-flash`
- Use for OCR, document/image understanding, extracting structured text from receipts, bills, forms, and screenshots
- Rules: prioritize exact text extraction, separate unclear text, never guess when the image is ambiguous

### logic
- Profile: `subagents/logic.md`
- Preferred model: `anthropic/claude-sonnet-4-6`
- Use for drafting code, refactoring, function design, and logic implementation
- Rules: optimize for readability and maintainability, call out assumptions and edge cases, treat output as draft for main review

## Spawn prompt templates
- `subagents/templates/vision-spawn-prompt.md`
- `subagents/templates/logic-spawn-prompt.md`

Use `{{TASK}}` and `{{CONTEXT}}` as placeholders before spawning.

## One-command examples
- `subagents/templates/spawn-examples.md`

Includes ready-to-copy PowerShell examples for:
- inline spawn
- template-based spawn

## Notes
- These are workspace profiles for subagent spawning, not standalone OpenClaw agents.
- Runtime model selection should be set when spawning the subagent.
- Current intended mapping:
  - `vision` -> `google/gemini-2.5-flash`
  - `logic` -> `anthropic/claude-sonnet-4-6`
