# V4 Academic Editorial Portfolio

## Branch and scope

- Work branch: `phase-1-foundation-v4`.
- Original V4: `44303fd3644197a42ef227382183ba1407e85ae7`.
- Preserved backup: `backup/phase-1-foundation-v4-before-editorial-20261119`.
- No changes to V2, V3, master, Pages configuration, academic source records, or image/video bytes.

## Hero structure

The Hero shell has exactly three direct semantic siblings:

1. `.hero-identity`: 96 px circular portrait (90 px on mobile), name, Ph.D. Candidate, and Email.
2. `.hero-background`: Hunan University and KAIST, their distinct roles/dates, and linked supervisors.
3. `.hero-focus`: Research Focus heading and all three confirmed research paragraphs.

Desktop uses a 40/60 identity/background grid. Focus spans both columns. Below 768 px the same DOM stacks identity, background, and full-width focus. Focus is never nested inside the academic background.

## Typography and spacing

Shared tokens live in `_sass/_academic-v2.scss`; components live in `_sass/_homepage.scss`.

| Role | Desktop | Below 768 px |
| --- | --- | --- |
| H1 | 32 px | 28 px |
| H2 | 26 px | 24 px |
| H3 | 18 px | 18 px |
| Body | 16 px | 16 px |
| Supporting text / DOI links | 14 px | 14 px |

Type sizes use rem tokens based on the browser default, preserving user font scaling. Weights are 400, 600, and 700. Body line-height is 1.55 and heading line-height is 1.25. Spacing tokens are 8, 16, 24, 32, and 48 px at the default font size. Content width is capped at 1120 px.

## Sections and interactions

- Featured Research: existing three media slides on the left; all three project titles, publication evidence, and paper links remain visible in a directory on the right. At narrower sizes the directory moves beneath the media. Its buttons reuse `data-go`. On mobile a project selection scrolls its media into view.
- Existing video eligibility, lazy loading, readiness, generations, bounded AbortError retry, manual pause, sound, and resource release logic are retained.
- Track transform transition remains 360 ms, including reduced-motion settings.
- Publications retain the same citation includes and source records.
- Expertise remains a plain three-column / single-column list.
- Activities retain dates, descriptions, location links, and original photographs, with two desktop columns and full-width descriptions.
- Contact retains the email and academic links with a compact footer.
- The existing global mobile navigation is reused; no second navigation was added.
- Old layered Hero overrides are replaced. The unused Hero CTA polish partial is retired.

## Verification and screenshots

`scripts/capture-homepage.cjs` records initial viewport, Hero, research, publications, activities, and full-page screenshots plus page-height metrics at 1440, 1024, 768, 390, and 320 px.

`scripts/check-homepage.cjs` verifies sibling structure/full-width Focus, type scale, directory visibility and switching, citation content, activities, local resource links, menu behavior, and existing video recovery/transition behavior. Offscreen startup tests explicitly start with a short viewport rather than assuming that a compact homepage hides Featured Research.

The workflow publishes QA artifacts only; it does not deploy the site. The original screenshot capture run is 44492115834. Its legacy browser assertion failed because the video was already correctly visible at startup; the original page and all screenshot widths were captured before restructuring.

## WSL preview

From the existing repository:

```bash
git status --short
git fetch origin refs/heads/phase-1-foundation-v4:refs/remotes/origin/phase-1-foundation-v4
git switch phase-1-foundation-v4
git pull --ff-only origin phase-1-foundation-v4
bundle install
bundle exec jekyll serve -l -H localhost
```

If no local V4 branch exists yet, replace the switch command with:

`git switch -c phase-1-foundation-v4 --track origin/phase-1-foundation-v4`

Open http://localhost:4000/ and hard-refresh after restarting the server. The backup remains available as its own remote branch.
