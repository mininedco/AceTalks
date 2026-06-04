# Contributing to AceTalks

First, thank you. AceTalks exists because of my nephew Ace, and every contribution brings us closer to giving more people a voice. As a beginner coder working on this as my passion project, any suggestions and feedback are welcome. 



Whether you're a developer, a speech-language pathologist, a parent, a translator, or someone who uses AAC yourself; there is a place for you here.

\---

## You don't have to write code to contribute

Some of the most valuable contributions to AceTalks have nothing to do with code:

* **Translations** — help translate vocabulary into your language. Our free-tier languages are English, Thai, Spanish, Vietnamese, Tagalog, and Haitian Creole. If you speak any of these natively, your review of existing vocabulary is invaluable. If you speak another language not yet supported, reach out.
* **Vocabulary packs** — suggest culturally appropriate words, phrases, and categories for your community. A word list built by a Filipino parent is more accurate than anything we can generate.
* **Symbol and icon suggestions** — if a tile symbol doesn't represent something correctly for your culture or context, tell us.
* **Accessibility feedback** — if something is hard to use, doesn't work with your assistive technology, or creates a barrier, that is a bug and we want to know about it.
* **Lived experience** — if you use AAC yourself, or support someone who does, your perspective shapes the product more than any technical decision. Open a Discussion and tell us what you need.

\---

## Reporting a bug

Go to [Issues](../../issues) → **New Issue** → **Bug report**.

Please include:

* What you expected to happen
* What actually happened
* Your device and OS (e.g. iPhone 15 / iOS 17, Samsung Galaxy / Android 14)
* Steps to reproduce if possible
* A screenshot or screen recording if it helps

If the bug involves a child's communication being blocked — a TTS failure, a crash during board use, anything that stops someone from speaking — mark it **P1** and add the `critical` label. We treat communication failures as the highest priority.

\---

## Requesting a feature

Go to [Issues](../../issues) → **New Issue** → **Feature request**.

Tell us:

* Who this helps (child, adult, elderly, SLP, parent, teacher)
* What problem it solves
* What language or cultural context it's for, if relevant

Feature requests from AAC users and caregivers carry significant weight. You don't need to justify why communication matters.

\---

## Contributing code

### Before you start

* Check [Issues](../../issues) and [Discussions](../../discussions) to see if someone is already working on it
* For anything larger than a typo fix, open an issue first and describe what you want to build — this saves both of us time
* Read `AGENTS.md` and `DECISIONS.md` to understand the project's settled decisions before proposing architectural changes

### Setup

```powershell
git clone https://github.com/mininedco/AceTalks.git
cd AceTalks/acetalks
npm install
cp .env.example .env
# Fill in your own development keys in .env
npx expo start
```

You will need your own free-tier keys for Supabase and Clerk to run the app locally. Azure TTS is optional for local development — the app falls back to text display if TTS is unavailable.

### Branch naming

```
feature/short-description     ← new functionality
fix/short-description         ← bug fixes
a11y/short-description        ← accessibility improvements
i18n/short-description        ← language and translation work
docs/short-description        ← documentation only
```

### Commit messages

```
feat: add Vietnamese TTS voice fallback
fix: sentence strip overflow on small screens
a11y: add accessibilityHint to all tile components
i18n: add Tagalog vocabulary for food category
```

### Opening a pull request

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` — it must pass with zero errors
4. Open a PR against `main`
5. Fill in the PR template — it asks about accessibility and security, please answer honestly
6. CodeRabbit will review automatically within about 60 seconds
7. Address any feedback from CodeRabbit and from the maintainer

### Pull request checklist

Before submitting, please confirm:

* \[ ] `npx tsc --noEmit` passes
* \[ ] Every new interactive element has `accessibilityLabel`
* \[ ] Touch targets are at least 44×44pt
* \[ ] No API keys, tokens, or secrets are in the code
* \[ ] If your change touches a child's data, parental consent flow is not bypassed
* \[ ] The change works on both iOS and Android if it touches the board screen

### What gets reviewed

Every PR goes through two reviews:

1. **CodeRabbit** — automated, checks code quality, security, accessibility props, and TypeScript issues
2. **Maintainer (MiniNedCo)** — checks that the change fits the mission, works for the intended user, and doesn't introduce regressions


We try to review PRs within 48 hours. If yours has been waiting longer, feel free to ping in [Discussions](../../discussions).

\---

## Language and translation contributions

Translation is not just text substitution. A word that means "water" in Spanish may carry different connotations in Mexican Spanish vs. Caribbean Spanish. We want translations that feel natural to native speakers, not translations that passed through Google Translate.

If you want to help with a language:

1. Open a Discussion in the **Language \& Translation** category
2. Tell us your language, region, and background
3. We will share the current vocabulary list for your review
4. You can suggest corrections, additions, or cultural notes directly

All translation contributors are credited in the app.

\---

## A note on this community

AceTalks is built for people who have often been excluded from conversations about tools that affect their lives. We ask that all contributors — coders and non-coders alike — keep that in mind. The people who will use this app to communicate deserve software built with as much care as we can give it.

If you have questions, start in [Discussions](../../discussions). If you're not sure whether an idea is a good fit, ask first. There are no bad questions here.

