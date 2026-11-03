# Jisho: agents start here

Japanese word and kanji data for JavaScript (`@johnmorrisdotca/jisho`, GitHub johnmorrisdotca/jisho). Read
[CONTRIBUTING.md](CONTRIBUTING.md) and [CODE-STYLE.md](CODE-STYLE.md) first; the package's own commands are listed in the former.

- **Ports.** Jisho owns local ports **8500-8599** (John's port table): 8500 demo or dev server, 8501 tests, 8502 and up for
  worktrees and other servers. Check `lsof -iTCP:<port> -sTCP:LISTEN` first, stop only your own processes by PID, and give
  every server and browser base URL an explicit port. The demo's Playwright tests serve `site/` from disk and need none.
- **Worktrees** go in `~/Projects/worktrees/jisho/<name>`, removed when their work has landed.
- **Checks before every push:** `pnpm check`, `pnpm build`, `pnpm test:package`, `pnpm test:readme`, and `pnpm test:demo` when
  the demo changes. Browsers run headless in software GL, one at a time with one worker.
- **Commits:** Conventional Commits, subject 50 characters or less, files added by name, no AI attribution anywhere.
- **Data:** `src/data/words/` is machine output of `scripts/build-words.mjs`; change the script, never the files.
- **Releases:** the commit that bumps the version and the CHANGELOG is pushed, CI and Pages must be green on that sha, and the
  coordinating session tags it.
