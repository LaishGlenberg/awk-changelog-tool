# Changelog

From commit `c406c3935f8429db809edd1262230be3e132303d` (2026-07-23 06:07:52 -0700)

**35 commit(s), 3 PR(s) matched**

## b9c95e8 — feat: add npm version badge to README

| Field | Value |
|-------|-------|
| **Hash** | `b9c95e8f4b77957375fe8cf9aaa868c1269073d6` |
| **Date** | Wed, 23 Sep 2026 12:03:06 |
| **Author** | LaishGlenberg |
| **Lines** | +2 / −0 |
| **Files** | `README.md` |
| **Refs** | HEAD -> main, origin/main, origin/HEAD |

---

---

## 18aa122 — 1.1.1

| Field | Value |
|-------|-------|
| **Hash** | `18aa122bb98879cc0aa306af25cc06bd2d5c476f` |
| **Date** | Wed, 23 Sep 2026 10:39:00 |
| **Author** | LaishGlenberg |
| **Lines** | +3 / −3 |
| **Files** | `package-lock.json`, `package.json` |
| **Refs** | tag: v1.1.1 |

---

---

## 2a523e4 — chore: tag and release workflow

| Field | Value |
|-------|-------|
| **Hash** | `2a523e45f95faec0cd360d86c1ff83be9630fbbf` |
| **Date** | Wed, 23 Sep 2026 10:36:50 |
| **Author** | LaishGlenberg |
| **Lines** | +48 / −0 |
| **Files** | `.github/workflows/release.yml` |

---

---

## 30dbd19 — feat: add test for npm install

| Field | Value |
|-------|-------|
| **Hash** | `30dbd195d58c907ed3d2c8f1b4c794aca62ade1b` |
| **Date** | Wed, 23 Sep 2026 10:34:46 |
| **Author** | LaishGlenberg |
| **Lines** | +117 / −1 |
| **Files** | `README.md`, `package.json`, `test/npm-install.test.js` |

---

---

## b6b98bf — feat: update timer style

| Field | Value |
|-------|-------|
| **Hash** | `b6b98bff2a2bb2c7bb8a35ff618d34c3a325d30b` |
| **Date** | Wed, 23 Sep 2026 10:25:58 |
| **Author** | LaishGlenberg |
| **Lines** | +35 / −19 |
| **Files** | `README.md`, `src/pr-progress.js`, `test/basic.test.js` |

---

---

## 47dc539 — feat: Add interactive timer

| Field | Value |
|-------|-------|
| **Hash** | `47dc5399cd6b3bb5f7e80533158b1c238681cd4b` |
| **Date** | Wed, 23 Sep 2026 10:25:41 |
| **Author** | LaishGlenberg |
| **Lines** | +163 / −10 |
| **Files** | `README.md`, `bin/awk-changelog.js`, `src/changelog-pr.js`, `src/pr-progress.js`, `test/basic.test.js` |

---

---

## 93634cf — 1.1.0

| Field | Value |
|-------|-------|
| **Hash** | `93634cf602d871430b9060689b2923f528d4fa18` |
| **Date** | Wed, 23 Sep 2026 09:41:23 |
| **Author** | LaishGlenberg |
| **Lines** | +3 / −3 |
| **Files** | `package-lock.json`, `package.json` |
| **Pull Request** | #3 |

---

### Pull Request Description

```
## Summary
- Match PR descriptions on merge, squash, and rebase commits without per-commit API lookups.
- Add practical examples to ^[[1mawkch --help^[[0m and clarify the inclusive range for the last 50 commits in the README.

## Testing
- ^[[1mnpm test^[[0m (11 tests)
- ^[[1mnode bin/awk-changelog.js --help^[[0m
- ^[[1mbash -n bash/git-changelog-pr.sh^[[0m
```

---

## 6fddcc2 — docs: add CLI help examples

| Field | Value |
|-------|-------|
| **Hash** | `6fddcc26207cae96297ffa74911cb5d5c44da48f` |
| **Date** | Wed, 23 Sep 2026 09:33:45 |
| **Author** | LaishGlenberg |
| **Lines** | +15 / −1 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## 78e1920 — feat: fully fix and overhaul PR matching and display

| Field | Value |
|-------|-------|
| **Hash** | `78e19207b75c681c61fe69ba13f02b7c67411e09` |
| **Date** | Wed, 23 Sep 2026 09:21:03 |
| **Author** | LaishGlenberg |
| **Lines** | +103 / −28 |
| **Files** | `README.md`, `src/changelog-pr.js`, `src/index.js`, `test/basic.test.js` |

---

---

## 5540fa6 — feat: enhance PR handling and changelog generation

| Field | Value |
|-------|-------|
| **Hash** | `5540fa6814b27d097052bed216f87769611a96bd` |
| **Date** | Wed, 23 Sep 2026 09:14:46 |
| **Author** | LaishGlenberg |
| **Lines** | +133 / −35 |
| **Files** | `README.md`, `bash/git-changelog-pr.sh`, `src/changelog-pr.js`, `src/changelog.js`, `src/index.js`, `test/basic.test.js` |

### Commit Message

- Update README to clarify PR description integration for merge, squash, and rebase commits.

---

---

## 7061d04 — Merge pull request #2 from LaishGlenberg/lg/refactor/remove-sub-commands

| Field | Value |
|-------|-------|
| **Hash** | `7061d048c543aa7fa9be7c368b8cc78b1d9f52e1` |
| **Date** | Fri, 24 Jul 2026 20:30:11 |
| **Author** | Laish Glenberg |
| **Lines** | +0 / −0 |
| **Files** |  |
| **Pull Request** | #2 |

### Commit Message

feat: remove redundant pr subcommand + replace jq with node-jq

---

### Pull Request Description

```
 Summary                                                                              
                                                                                      
 Refactor the CLI to remove unnecessary subcommands and eliminate the system jq       
 dependency, while updating documentation to reflect the simplified interface.        
                                                                                      
 ### Highlights                                                                       
                                                                                      
 - Removed pr and bash-path subcommands from bin/awk-changelog.js (-39 lines). The    
   default run now handles everything, so these redundant commands were dropped.      
 - Bundled jq via node-jq — added a thin wrapper bash/jq.mjs and the node-jq          
   dependency (^6.3.1). The bash script now calls node jq.mjs instead of requiring jq 
    to be installed system-wide.                                                      
 - README cleanup — removed subcommand docs, updated install/scope language, and      
   documented the bundled node-jq requirement.                                        
 - Bumped version to 1.0.2.                                                           
                                     
 Notes                                                                                
                                                                                      
 - No system jq install is required anymore — the bash flow self-contains it via the  
   npm package.                                                                       
 - CLI surface is now just awkch [since] with -o/--output, -d, --all, --no-email      
   options. 
```

---

## afcdbbf — feat: pr template

| Field | Value |
|-------|-------|
| **Hash** | `afcdbbf236215aa8a78b4f342120963b892d9c3f` |
| **Date** | Fri, 24 Jul 2026 20:29:49 |
| **Author** | LaishGlenberg |
| **Lines** | +7 / −0 |
| **Files** | `.github/pull\_request\_template.md` |
| **Refs** | origin/lg/refactor/remove-sub-commands |

---

---

## 8d0045f — 1.0.2

| Field | Value |
|-------|-------|
| **Hash** | `8d0045f028ef6bc8f5bd3fc800287a265e5884a2` |
| **Date** | Fri, 24 Jul 2026 01:42:19 |
| **Author** | LaishGlenberg |
| **Lines** | +3 / −3 |
| **Files** | `package-lock.json`, `package.json` |

---

---

## b6d4e04 — Update changelog

| Field | Value |
|-------|-------|
| **Hash** | `b6d4e042698a58708289c16d08072516bf19d439` |
| **Date** | Fri, 24 Jul 2026 01:42:08 |
| **Author** | LaishGlenberg |
| **Lines** | +101 / −2 |
| **Files** | `CHANGELOG.md` |

---

---

## 44f3506 — chore: update readme with node-jq usage

| Field | Value |
|-------|-------|
| **Hash** | `44f3506aaf30b9b01da0e2efc6452777b1ada65d` |
| **Date** | Fri, 24 Jul 2026 01:40:56 |
| **Author** | LaishGlenberg |
| **Lines** | +5 / −2 |
| **Files** | `README.md` |

---

---

## 890d9e6 — feat: replace jq command with node-jq and mjs helper script that is called in bash. No need to have jq installed (windows).

| Field | Value |
|-------|-------|
| **Hash** | `890d9e6917ee553013e71a70f86dcdd4bea01382` |
| **Date** | Fri, 24 Jul 2026 01:17:09 |
| **Author** | LaishGlenberg |
| **Lines** | +279 / −6 |
| **Files** | `bash/git-changelog-pr.sh`, `bash/jq.mjs`, `package-lock.json`, `package.json` |

---

---

## 13d6fc1 — chore: remove old pr subcommand (was completely useless)

| Field | Value |
|-------|-------|
| **Hash** | `13d6fc19b740ca1e182ce5c19ebb57ced2ba1641` |
| **Date** | Fri, 24 Jul 2026 00:30:06 |
| **Author** | LaishGlenberg |
| **Lines** | +8 / −55 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## dc099ce — 1.0.1

| Field | Value |
|-------|-------|
| **Hash** | `dc099cee9c094abc253332db547e3b9c936baf59` |
| **Date** | Thu, 23 Jul 2026 15:47:58 |
| **Author** | LaishGlenberg |
| **Lines** | +3 / −3 |
| **Files** | `package-lock.json`, `package.json` |
| **Refs** | origin/lg/feat/node-jq |

---

---

## 23a849a — chore: add scope to package

| Field | Value |
|-------|-------|
| **Hash** | `23a849a1b601a04f1b409535ee8f669dfbd1dd22` |
| **Date** | Thu, 23 Jul 2026 15:47:48 |
| **Author** | LaishGlenberg |
| **Lines** | +8 / −8 |
| **Files** | `README.md`, `package.json` |

---

---

## 4c98bc3 — fix: fix test path

| Field | Value |
|-------|-------|
| **Hash** | `4c98bc30e20d797eb9c9b27510d2c068d9b5a845` |
| **Date** | Thu, 23 Jul 2026 15:42:17 |
| **Author** | LaishGlenberg |
| **Lines** | +6 / −6 |
| **Files** | `README.md`, `package.json` |

---

---

## fd3d156 — chore: generate new changelog

| Field | Value |
|-------|-------|
| **Hash** | `fd3d156bef1f8cd3928661549cfc1c3148bbf31c` |
| **Date** | Thu, 23 Jul 2026 15:36:49 |
| **Author** | LaishGlenberg |
| **Lines** | +114 / −2 |
| **Files** | `CHANGELOG.md` |

---

---

## 9acf098 — feat: add new flags for -d default output, --all for including all flags, and --no-email for removing emails

| Field | Value |
|-------|-------|
| **Hash** | `9acf098d8ab21f3489b1d18386117f99c051ead9` |
| **Date** | Thu, 23 Jul 2026 15:35:46 |
| **Author** | LaishGlenberg |
| **Lines** | +34 / −9 |
| **Files** | `README.md`, `bin/awk-changelog.js`, `src/changelog-pr.js`, `src/changelog.js` |

---

---

## 17a5c36 — chore(dev): npm script to replace personal info

| Field | Value |
|-------|-------|
| **Hash** | `17a5c362f8abdf1dc262010c5393da5f91dd4025` |
| **Date** | Thu, 23 Jul 2026 15:23:57 |
| **Author** | LaishGlenberg |
| **Lines** | +2 / −2 |
| **Files** | `package.json` |

---

---

## 2f5748f — feat: add --all flag that runs awkch --pr -o changelog.md

| Field | Value |
|-------|-------|
| **Hash** | `2f5748f4c028d5a8c812805f88743e55172364f5` |
| **Date** | Thu, 23 Jul 2026 15:13:02 |
| **Author** | LaishGlenberg |
| **Lines** | +7 / −0 |
| **Files** | `bin/awk-changelog.js` |

---

---

## 62af092 — refact: remove redunant no prs flag

| Field | Value |
|-------|-------|
| **Hash** | `62af0922e0c880bf4186588e0182aea0192fafc1` |
| **Date** | Thu, 23 Jul 2026 15:03:31 |
| **Author** | LaishGlenberg |
| **Lines** | +4 / −10 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## f027b53 — chore(dev): add gitignored test changelog for testing the tool

| Field | Value |
|-------|-------|
| **Hash** | `f027b53603970f2b4868d97908a78193998cd625` |
| **Date** | Thu, 23 Jul 2026 14:57:53 |
| **Author** | LaishGlenberg |
| **Lines** | +4 / −1 |
| **Files** | `.gitignore`, `package.json` |

---

---

## d536666 — refactor: remove log command (was default anyway)

| Field | Value |
|-------|-------|
| **Hash** | `d536666b4927ced1802dd82e8fd37bd1e3548e90` |
| **Date** | Thu, 23 Jul 2026 14:57:12 |
| **Author** | LaishGlenberg |
| **Lines** | +1 / −26 |
| **Files** | `README.md`, `bin/awk-changelog.js` |

---

---

## 8339088 — feat: update bash scripts to use code blocks for pr descriptions

| Field | Value |
|-------|-------|
| **Hash** | `833908811fec5ba90c3570b9fff06a72dc99a604` |
| **Date** | Thu, 23 Jul 2026 14:47:41 |
| **Author** | LaishGlenberg |
| **Lines** | +4 / −0 |
| **Files** | `bash/git-changelog-pr.sh`, `src/changelog-pr.js` |

---

---

## 00b9493 — chore: add an example changelog with pr to readme

| Field | Value |
|-------|-------|
| **Hash** | `00b94930ea2f0f79c58149f96ac738b6845da7b8` |
| **Date** | Thu, 23 Jul 2026 14:47:08 |
| **Author** | LaishGlenberg |
| **Lines** | +178 / −2 |
| **Files** | `CHANGELOG.md`, `README.md` |

---

---

## cd69d7d — Merge pull request #1 from LaishGlenberg:lg/feat/add-changelog

| Field | Value |
|-------|-------|
| **Hash** | `cd69d7d06216baab6caf8ec417f7a9b69b0845b4` |
| **Date** | Thu, 23 Jul 2026 14:20:20 |
| **Author** | Laish Glenberg |
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
| **Author** | LaishGlenberg |
| **Lines** | +54 / −1 |
| **Files** | `.gitignore`, `CHANGELOG.md` |
| **Refs** | origin/lg/feat/add-changelog |

---

---

## 2c2081c — refactor: shorten name to awkch

| Field | Value |
|-------|-------|
| **Hash** | `2c2081caaf43f3811c0dd4bfcf9dcd40c715439d` |
| **Date** | Thu, 23 Jul 2026 13:43:30 |
| **Author** | LaishGlenberg |
| **Lines** | +17 / −17 |
| **Files** | `README.md`, `bin/awk-changelog.js`, `package.json` |

---

---

## bb7f007 — feat: update readme

| Field | Value |
|-------|-------|
| **Hash** | `bb7f007aee4718bcfade34ca5cfbff3990e54555` |
| **Date** | Thu, 23 Jul 2026 13:37:49 |
| **Author** | LaishGlenberg |
| **Lines** | +26 / −1 |
| **Files** | `README.md` |

---

---

## 9935259 — chore: Scaffold npm package repository, add apis, docs, tests

| Field | Value |
|-------|-------|
| **Hash** | `9935259f689b498e6a5eec3818038868eaa49241` |
| **Date** | Thu, 23 Jul 2026 13:27:15 |
| **Author** | LaishGlenberg |
| **Lines** | +841 / −8 |
| **Files** | `.gitignore`, `LICENSE`, `README.md`, `git-changelog-pr.sh => bash/git-changelog-pr.sh`, `git-changelog.sh => bash/git-changelog.sh`, `bin/awk-changelog.js`, `package-lock.json`, `package.json`, `src/changelog-pr.js`, `src/changelog.js`, `src/index.js`, `src/utils.js`, `test/basic.test.js` |

---

---

## c406c39 — chore: initial commit with both bash scripts (regular and regular + pr descriptions)

| Field | Value |
|-------|-------|
| **Hash** | `c406c3935f8429db809edd1262230be3e132303d` |
| **Date** | Thu, 23 Jul 2026 13:07:52 |
| **Author** | LaishGlenberg |
| **Lines** | +284 / −0 |
| **Files** | `git-changelog-pr.sh`, `git-changelog.sh`, `package.json` |

---

---
