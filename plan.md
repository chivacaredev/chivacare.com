# Chivacare Clone — Implementation Plan

## Goal
Bilingual (EN + TH) static site clone of chivacare.com, with blog posts stored as individual Markdown files using Astro Content Collections.

---

## Architecture

### Content Collections
```
src/content/
  config.ts               ← define "blog-en" and "blog-th" collections
  blog-en/
    5.md
    6.md
    7.md
    8.md
    9.md
    10.md
    11.md
    12.md
    13.md
    14.md
    17.md
    18.md
    19.md
    20.md
    21.md
    22.md
    23.md
    24.md
    27.md
    29.md
    30.md
    31.md
    32.md
    33.md
    34.md
    35.md
    36.md
    37.md
    40.md
    41.md
    42.md
    43.md
  blog-th/
    (same IDs, Thai content)
```

### Frontmatter schema (both collections)
```yaml
---
id: 43
title: "..."
category: "..."
description: "..."
img: "https://chivacare.com/assets/uploads/img_services/main/..."
---
Body content in Markdown
```

### Pages
```
src/pages/
  blog/
    index.astro     ← EN listing  (reads blog-en collection)
    [id].astro      ← EN post     (reads blog-en by id)
  th/
    teams.astro     ← TH teams page
    blog/
      index.astro   ← TH listing  (reads blog-th collection)
      [id].astro    ← TH post     (reads blog-th by id)
```

### Layouts / Components
```
src/layouts/
  Layout.astro      ← EN layout (lang="en")
  LayoutTh.astro    ← TH layout (lang="th")
src/components/
  Header.astro      ← EN nav — locale switcher links to /th/{currentPath}
  HeaderTh.astro    ← TH nav — locale switcher links to /{currentPath without /th}
```

---

## Tasks

### Phase 1 — Content Collections Setup
- [x] 1.1  Add `src/content.config.ts` defining `blog-en` and `blog-th` schemas (Astro 6 glob loader)
- [x] 1.2  Delete `src/data/blogPosts.ts` (replaced by collection)

### Phase 2 — EN Blog Markdown Files (32 files)
- [x] 2.1  Write EN `.md` for posts: 43, 42, 41, 40, 37, 36, 35, 34, 33, 32
- [x] 2.2  Write EN `.md` for posts: 31, 30, 29, 27, 24, 23, 22, 21, 20, 19
- [x] 2.3  Write EN `.md` for posts: 18, 17, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5

### Phase 3 — TH Blog Markdown Files (32 files)
- [x] 3.1  Write TH `.md` for posts: 43, 41 (full Thai content fetched)
- [x] 3.2  Write TH `.md` for posts: 42, 40, 37, 36, 35, 34, 33, 32, 31, 30
- [x] 3.3  Write TH `.md` for posts: 29, 27, 24, 23, 22, 21, 20, 19, 18, 17, 14, 13
- [x] 3.4  Write TH `.md` for posts: 12, 11, 10, 9, 8, 7, 6, 5

### Phase 4 — Update Blog Pages to Use Collections
- [x] 4.1  Rewrite `src/pages/blog/index.astro` to use `getCollection('blog-en')`
- [x] 4.2  Rewrite `src/pages/blog/[id].astro` to use collection for static paths + render()

### Phase 5 — Language Switcher Fix
- [x] 5.1  `public/styles/languages.png` downloaded — flags sprite present
- [x] 5.2  Update `Header.astro` — locale link: `/th` + current path; trigger button shows EN flag
- [x] 5.3  `HeaderTh.astro` — locale link: strips `/th` from current path

### Phase 6 — TH Layout & Header
- [x] 6.1  `src/layouts/LayoutTh.astro` (`lang="th"`, uses HeaderTh, Thai cookie banner)
- [x] 6.2  `src/components/HeaderTh.astro` with Thai nav labels

### Phase 7 — TH Pages
- [x] 7.1  `src/pages/th/teams.astro` — Thai team names, hero banner, same structure
- [x] 7.2  `src/pages/th/blog/index.astro` — Thai listing with category filter
- [x] 7.3  `src/pages/th/blog/[id].astro` — Thai post with related articles + EN switcher

### Phase 8 — QA & Build
- [x] 8.1  `bun run build` — 0 errors, **79 pages** generated
- [x] 8.2  Smoke-tested: EN↔TH switcher links correct on listing and post pages
- [x] 8.3  Flag sprite confirmed in nav (languages.png present)

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
