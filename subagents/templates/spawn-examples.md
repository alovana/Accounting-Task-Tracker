# One-command spawn examples

## Vision

### Simple inline example
```powershell
openclaw sessions spawn --runtime subagent --model google/gemini-2.5-flash --task "Analyze the attached receipt image. Extract raw text, key fields, unclear text, and confidence notes."
```

### Template-based example
```powershell
$task = "Extract data from this tax invoice image"
$context = "Focus on seller name, tax ID, invoice date, subtotal, VAT, and grand total."
$prompt = (Get-Content .\subagents\templates\vision-spawn-prompt.md -Raw).Replace("{{TASK}}", $task).Replace("{{CONTEXT}}", $context)
openclaw sessions spawn --runtime subagent --model google/gemini-2.5-flash --task $prompt
```

## Logic

### Simple inline example
```powershell
openclaw sessions spawn --runtime subagent --model anthropic/claude-sonnet-4-6 --task "Refactor this function for readability and maintainability. List assumptions, edge cases, risks, and provide draft code only."
```

### Template-based example
```powershell
$task = "Draft a helper function to calculate VAT totals safely"
$context = "Language: TypeScript. Requirements: readable code, explicit rounding, warn about financial edge cases."
$prompt = (Get-Content .\subagents\templates\logic-spawn-prompt.md -Raw).Replace("{{TASK}}", $task).Replace("{{CONTEXT}}", $context)
openclaw sessions spawn --runtime subagent --model anthropic/claude-sonnet-4-6 --task $prompt
```

## Notes
- Replace the task/context text before running.
- If you want to attach files or images, use the tool/runtime path that supports attachments in your current workflow.
- Main should review `logic` output before applying code changes.
