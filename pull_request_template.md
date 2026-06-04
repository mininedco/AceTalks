# Pull Request — AceTalks

## Ticket
<!-- Link the ticket: e.g. ACET-005 -->
Closes #

## What this PR does
<!-- One paragraph. What changed and why. -->

## Type of change
- [ ] Feature (new functionality)
- [ ] Bug fix
- [ ] Security fix
- [ ] Accessibility fix
- [ ] Chore / refactor / docs

---

## Pre-merge checklist

### Build
- [ ] `tsc --noEmit` passes (no TypeScript errors)
- [ ] App builds without warnings on iOS and Android targets
- [ ] No new console errors or warnings introduced

### Code quality
- [ ] No hardcoded API keys, tokens, or secrets
- [ ] No `any` types without a `// WHY:` justification comment
- [ ] New files have a summary comment block at the top
- [ ] All non-obvious decisions have a `// WHY:` comment

### Security (SHIELD check)
- [ ] No new Supabase table without RLS enabled
- [ ] No children's PII stored without parental consent flow
- [ ] No auth bypass or weakened session validation
- [ ] New environment variables added to `.env.example`

### Accessibility (ACCESS check)
- [ ] All new interactive elements have `accessibilityLabel`
- [ ] All new images have `accessibilityLabel` or `accessible={false}`
- [ ] Touch targets are minimum 44×44pt
- [ ] Text does not truncate — tiles resize or wrap
- [ ] No animation without `useReducedMotion()` check
- [ ] No `ACCESS-TODO` comments left unresolved (or GitHub issue opened)

### COPPA (if this PR touches child profiles)
- [ ] Analytics events disabled for `age_group = 'child'` sessions
- [ ] No new PII collected without consent flow gate
- [ ] No external links accessible from child-facing board screen

---

## Screenshots / recordings
<!-- Required for any UI change. Before + After preferred. -->

## Notes for reviewer
<!-- Anything CodeRabbit or Nadia should know before reviewing -->
