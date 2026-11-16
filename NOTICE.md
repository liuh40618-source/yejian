# Notice

**页见 (YeJian)**
Copyright (c) 2026 liuh40618-source

## Origin

This project is a derivative work (a fork) of:

> **Reactive Resume** `v6.0.10`
> https://github.com/reactive-resume/reactive-resume
> Copyright (c) 2026 Amruth Pillai
> Licensed under the MIT License

The upstream source was obtained as a GitHub source-code ZIP snapshot (no git history).
A pristine copy of that snapshot is the first commit of this repository, so every
change made here is visible as a real diff against `v6.0.10`. See `UPSTREAM-DIFF.md`.

The original `LICENSE` file is retained **verbatim**, including the upstream copyright
notice and permission notice, as required by the MIT License. It has not been modified
and must not be replaced.

## Modifications

Modifications made for this fork include, non-exhaustively:

- Localization of the UI to `zh-CN`, with the locale set narrowed from 55 to 2.
- Replacement of the PDF template set: 18 upstream templates reduced to 19 Chinese-market,
  single-column ATS-safe templates under new semantic IDs, plus a database migration
  for existing template IDs.
- Bundling of `Noto Sans SC` / `Noto Serif SC` webfont subsets and their CSS.
- Chinese-language ATS analysis (segmentation, stopwords, section aliases, dates,
  names and places) and Chinese date parsing.
- A `china-market` data model and domain layer: scene presets, visual presets,
  platform form-field mapping, JD keyword alignment, and Web/Mobile design panels.
- Chinese sample resume data and Chinese ATS-safe defaults applied at resume creation.
- Brand assets, PWA metadata, and the `dashscope` (通义千问) AI provider entry.
- Test-time font caching and regenerated OpenAPI snapshot.

The complete, hash-verified file-level inventory is in `UPSTREAM-DIFF.md`.

## Scope of this notice

The copyright above applies to the modifications and additions made in this fork.
It does not claim ownership of, or replace, the upstream copyright. The upstream
MIT License continues to govern the upstream code; this project is distributed
under the same MIT License (see `LICENSE`).

The upstream project and its author are **not affiliated with, do not endorse, and
do not sponsor** this fork. Links to the upstream repository are for attribution only.

## Fonts

Bundled webfonts are third-party assets with their own licenses. Font license texts
are kept alongside the fonts: upstream ships e.g. `ibm-plex-mono-OFL.txt`, and the
bundled `Noto Sans SC` / `Noto Serif SC` slices ship `OFL-noto-sans-sc.txt` and
`OFL-noto-serif-sc.txt` in `apps/web/public/fonts/cn/`.

The glyphs are unmodified. Only the per-unicode-range slicing produced by the
Fontsource packages is used, so no Modified Version exists and the Reserved Font
Name clause does not apply. Provenance is documented in that directory's `README.md`.

## Current status

Prepared for public release but not yet pushed: no remote is configured. Font license
texts are in place. Localized legal pages (privacy policy, terms of service, ICP
filing) are still missing and are tracked in `UPSTREAM-DIFF.md`; they must be written
before a hosted instance accepts real users.
