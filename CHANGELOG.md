# Changelog

From commit `c406c3935f8429db809edd1262230be3e132303d` (2026-07-23 06:07:52 -0700)

**21 commit(s), 1 PR(s) fetched**

## 44f3506 — chore: update readme with node-jq usage

| Field | Value |
|-------|-------|
| **Hash** | `44f3506aaf30b9b01da0e2efc6452777b1ada65d` |
| **Date** | Fri, 24 Jul 2026 01:40:56 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +5 / −2 |
| **Files** | `README.md` |
| **Refs** | HEAD -> lg/refactor/remove-sub-commands |

---

---

## 890d9e6 — feat: replace jq command with node-jq and mjs helper script that is called in bash. No need to have jq installed (windows).

| Field | Value |
|-------|-------|
| **Hash** | `890d9e6917ee553013e71a70f86dcdd4bea01382` |
| **Date** | Fri, 24 Jul 2026 01:17:09 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +279 / −6 |
| **Files** | `bash/git-changelog-pr.sh`, `bash/jq.mjs`, `package-lock.json`, `package.json` |

---

---

## 13d6fc1 — chore: remove old pr subcommand (was completely useless)

| Field | Value |
|-------|-------|
| **Hash** | `13d6fc19b740ca1e182ce5c19ebb57ced2ba1641` |
| **Date** | Fri, 24 Jul 2026 00:30:06 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +8 / −55 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## dc099ce — 1.0.1

| Field | Value |
|-------|-------|
| **Hash** | `dc099cee9c094abc253332db547e3b9c936baf59` |
| **Date** | Thu, 23 Jul 2026 15:47:58 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +3 / −3 |
| **Files** | `package-lock.json`, `package.json` |
| **Refs** | tag: v1.0.1, origin/main, origin/lg/refactor/remove-sub-commands, origin/HEAD, main |

---

---

## 23a849a — chore: add scope to package

| Field | Value |
|-------|-------|
| **Hash** | `23a849a1b601a04f1b409535ee8f669dfbd1dd22` |
| **Date** | Thu, 23 Jul 2026 15:47:48 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +8 / −8 |
| **Files** | `README.md`, `package.json` |

---

---

## 4c98bc3 — fix: fix test path

| Field | Value |
|-------|-------|
| **Hash** | `4c98bc30e20d797eb9c9b27510d2c068d9b5a845` |
| **Date** | Thu, 23 Jul 2026 15:42:17 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +6 / −6 |
| **Files** | `README.md`, `package.json` |

---

---

## fd3d156 — chore: generate new changelog

| Field | Value |
|-------|-------|
| **Hash** | `fd3d156bef1f8cd3928661549cfc1c3148bbf31c` |
| **Date** | Thu, 23 Jul 2026 15:36:49 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +114 / −2 |
| **Files** | `CHANGELOG.md` |

---

---

## 9acf098 — feat: add new flags for -d default output, --all for including all flags, and --no-email for removing emails

| Field | Value |
|-------|-------|
| **Hash** | `9acf098d8ab21f3489b1d18386117f99c051ead9` |
| **Date** | Thu, 23 Jul 2026 15:35:46 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +34 / −9 |
| **Files** | `README.md`, `bin/awk-changelog.js`, `src/changelog-pr.js`, `src/changelog.js` |

---

---

## 17a5c36 — chore(dev): npm script to replace personal info

| Field | Value |
|-------|-------|
| **Hash** | `17a5c362f8abdf1dc262010c5393da5f91dd4025` |
| **Date** | Thu, 23 Jul 2026 15:23:57 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +2 / −2 |
| **Files** | `package.json` |

---

---

## 2f5748f — feat: add --all flag that runs awkch --pr -o changelog.md

| Field | Value |
|-------|-------|
| **Hash** | `2f5748f4c028d5a8c812805f88743e55172364f5` |
| **Date** | Thu, 23 Jul 2026 15:13:02 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +7 / −0 |
| **Files** | `bin/awk-changelog.js` |

---

---

## 62af092 — refact: remove redunant no prs flag

| Field | Value |
|-------|-------|
| **Hash** | `62af0922e0c880bf4186588e0182aea0192fafc1` |
| **Date** | Thu, 23 Jul 2026 15:03:31 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +4 / −10 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## f027b53 — chore(dev): add gitignored test changelog for testing the tool

| Field | Value |
|-------|-------|
| **Hash** | `f027b53603970f2b4868d97908a78193998cd625` |
| **Date** | Thu, 23 Jul 2026 14:57:53 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +4 / −1 |
| **Files** | `.gitignore`, `package.json` |

---

---

## d536666 — refactor: remove log command (was default anyway)

| Field | Value |
|-------|-------|
| **Hash** | `d536666b4927ced1802dd82e8fd37bd1e3548e90` |
| **Date** | Thu, 23 Jul 2026 14:57:12 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +1 / −26 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## 8339088 — feat: update bash scripts to use code blocks for pr descriptions

| Field | Value |
|-------|-------|
| **Hash** | `833908811fec5ba90c3570b9fff06a72dc99a604` |
| **Date** | Thu, 23 Jul 2026 14:47:41 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +4 / −0 |
| **Files** | `bash/git-changelog-pr.sh`, `src/changelog-pr.js` |

---

---

## 00b9493 — chore: add an example changelog with pr to readme

| Field | Value |
|-------|-------|
| **Hash** | `00b94930ea2f0f79c58149f96ac738b6845da7b8` |
| **Date** | Thu, 23 Jul 2026 14:47:08 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +178 / −2 |
| **Files** | `CHANGELOG.md`, `README.md` |

---

---

## cd69d7d — Merge pull request #1 from LaishGlenberg:lg/feat/add-changelog

| Field | Value |
|-------|-------|
| **Hash** | `cd69d7d06216baab6caf8ec417f7a9b69b0845b4` |
| **Date** | Thu, 23 Jul 2026 14:20:20 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +0 / −0 |
| **Files** |  |
| **Pull Request** | #1 |

### Commit Message

chore: generate changelog

---

### Pull Request Description

```
## What & Why

- Generate a changelog for the repo using the awkch tool to demo the tool

## Changes

- Add changelog.md, update gitignore

## Notes

- Adding as a pr to demo the pr tool next
```

---

## 3da00e5 — chore: generate changelog

| Field | Value |
|-------|-------|
| **Hash** | `3da00e5ee2a0e815c0b45ffc02c88c92166ce081` |
| **Date** | Thu, 23 Jul 2026 14:14:20 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +54 / −1 |
| **Files** | `.gitignore`, `CHANGELOG.md` |
| **Refs** | origin/lg/feat/add-changelog, lg/feat/add-changelog |

---

---

## 2c2081c — refactor: shorten name to awkch

| Field | Value |
|-------|-------|
| **Hash** | `2c2081caaf43f3811c0dd4bfcf9dcd40c715439d` |
| **Date** | Thu, 23 Jul 2026 13:43:30 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +17 / −17 |
| **Files** | `README.md`, `bin/awk-changelog.js`, `package.json` |

---

---

## bb7f007 — feat: update readme

| Field | Value |
|-------|-------|
| **Hash** | `bb7f007aee4718bcfade34ca5cfbff3990e54555` |
| **Date** | Thu, 23 Jul 2026 13:37:49 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +26 / −1 |
| **Files** | `README.md` |

---

---

## 9935259 — chore: Scaffold npm package repository, add apis, docs, tests

| Field | Value |
|-------|-------|
| **Hash** | `9935259f689b498e6a5eec3818038868eaa49241` |
| **Date** | Thu, 23 Jul 2026 13:27:15 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +841 / −8 |
| **Files** | `.gitignore`, `LICENSE`, `README.md`, `git-changelog-pr.sh => bash/git-changelog-pr.sh`, `git-changelog.sh => bash/git-changelog.sh`, `bin/awk-changelog.js`, `package-lock.json`, `package.json`, `src/changelog-pr.js`, `src/changelog.js`, `src/index.js`, `src/utils.js`, `test/basic.test.js` |

---

---

## c406c39 — chore: initial commit with both bash scripts (regular and regular + pr descriptions)

| Field | Value |
|-------|-------|
| **Hash** | `c406c3935f8429db809edd1262230be3e132303d` |
| **Date** | Thu, 23 Jul 2026 13:07:52 |
| **Author** | lglen <lglen@gmail.com> |
| **Lines** | +284 / −0 |
| **Files** | `git-changelog-pr.sh`, `git-changelog.sh`, `package.json` |

---

---
