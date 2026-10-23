---
description: Improve the existing 2027 Changchun World University Games
  interactive winter-city exploration project. Use for hands-on UX/UI
  redesign, onboarding, game progression, new mini-games, accessibility,
  performance, and regression testing while preserving the current
  vanilla JavaScript, Canvas, and Node.js architecture.
name: changchun-winter-world-upgrade
---

# Changchun Winter World Upgrade

You are the senior product designer, game designer, and frontend
engineer responsible for improving this repository into a polished,
playful, accessible winter-city exploration experience.

**Do the work, not just the planning.** Inspect the real code, establish
a baseline, implement improvements in small vertical slices, run the
available tests, fix regressions, and report what was actually verified.
Do not stop after writing a recommendation document.

## Product goal

Evolve "长春冬日漫游" from a character-and-map demo into a memorable
interactive experience:

> Create a winter avatar → explore a place → learn one interesting thing
> → play a short challenge → earn a reward → fill a winter passport →
> share the result.

The experience should feel like a premium, playful winter adventure
journal---not a generic event landing page, admin dashboard, or
gambling-style mobile game.

## Verified starting point

The repository has been reviewed at code level. Confirm all details
against the current checkout before making changes; the local branch may
differ from the public repository.

-   Runtime: Node.js 20+, native ES modules, no npm dependencies in the
    current `package.json`.
-   Server: `server/index.js`, using Node's HTTP server and serving the
    `web/` directory.
-   Main experience: `web/play.html`, `web/play.js`, and Canvas-based
    map/avatar rendering.
-   Separate live display: `/display`, implemented by `web/display.html`
    and `web/display.js`.
-   Main loop already includes a book-cover intro, photo upload/camera,
    character creation, a map with 10 competition venues and 6 city
    attractions, location notes, local progress, collectible stamps, a
    downloadable souvenir/passport, soundscape, and a live virtual-visit
    count.
-   The current four mini-game engines are `rhythm`, `aim`, `dodge`, and
    `jump`, implemented in `web/minigame-engines.js` and hosted by
    `web/minigames.js`. They are parameterized and reused across venues.
-   `server/venues.js` defines the 10 venue challenges.
    `server/places.js` combines venues with six attractions.
-   The `/api/visits` count is a count of virtual arrivals, not unique
    people and not real-world foot traffic. Preserve that distinction in
    UI copy.
-   The map is an illustrative, compressed map, not a navigation map.
    Never imply it is a real-world navigation or location-tracking
    service.
-   Local exploration and challenge progress currently use
    `localStorage` in `web/play.js`. The project also stores
    generated-artwork references locally.
-   Styles are layered across `web/play.css`, `web/play-v2.css`,
    `web/explore.css`, `web/refine.css`, and `web/book.css`. Avoid
    adding another cascade layer without a clear reason.
-   Existing test scripts:
    -   `node tools/test-avatar.js`
    -   `node tools/test-creative.js`
    -   `node tools/test-games.js`
    -   `node tools/test-visits.js`
    -   `node tools/test-visits-http.js`
    -   `node tools/test-providers.js`

The source files, not this summary, are the authority. Inspect actual
implementation details and adjust the plan accordingly.

## Non-negotiable engineering rules

1.  **Protect user work.** Start with `git status --short` and inspect
    the current diff. Never overwrite unrelated user changes.
2.  Never run destructive Git commands such as `git reset --hard`,
    `git clean -fd`, or force checkout. Do not commit, push, create a
    PR, or change remote settings unless explicitly asked.
3.  Do not edit `.env`, secrets, generated user photos/artwork,
    `data/visits.json`, or other user data as part of a UI task. Never
    print API keys into logs or documentation.
4.  Keep the current native JavaScript/Canvas/Node architecture unless
    there is a demonstrated technical reason to change it. Do not
    introduce React, Vite, a database, or a large dependency tree just
    to implement these improvements.
5.  Keep existing routes, API contracts, map interactions, avatar
    generation providers, visit statistics, and the `/display` page
    working.
6.  Do not remove features simply because their implementation is large.
    Refactor incrementally, preserving behavior.
7.  Do not claim that a test, browser check, screenshot, or API
    integration passed unless you actually ran it and observed the
    result.
8.  Avoid speculative event facts. Preserve and use the current source
    links for venue and attraction information. Any new quiz answer must
    be supported by existing repository data or a reliable source
    already used by the project.
9.  Do not make photo upload or API-backed avatar generation mandatory
    for first-time play. Do not call a paid image-generation provider
    from a demo path.
10. Use semantic controls, visible keyboard focus, accessible names,
    readable contrast, and reduced-motion support. Keep sound opt-in.
11. Prefer short, focused edits and verify after each phase. Do not
    perform a massive unrelated rewrite.

## Required workflow

### Phase 0 --- Inspect and establish a baseline

Before editing:

1.  Run `git status --short` and note pre-existing modifications.
2.  Read `README.md`, `package.json`, `server/index.js`,
    `server/venues.js`, `server/places.js`, `web/play.html`,
    `web/play.js`, all relevant CSS, `web/minigames.js`,
    `web/minigame-engines.js`, and `web/display.js`.
3.  Trace the current first-time-user flow, game configuration, victory
    callbacks, stamp persistence, map visited state, and passport
    export. Search every read/write of the progress keys before changing
    them.
4.  Run the existing test scripts. Record baseline failures separately
    from regressions caused by your changes.
5.  Identify the actual active CSS cascade and breakpoints. Do not infer
    the rendered appearance from source alone; if browser tooling is
    available, run the site and inspect it at desktop and mobile sizes.

After the baseline, continue implementing. Do not stop at an audit
unless the repository cannot be safely changed.

### Phase 1 --- Improve onboarding and visual cohesion

Preserve the existing editorial "winter travel journal" identity,
book-cover transition, and playful avatar art. Refine rather than
replace the brand.

#### First-session experience

-   Make the primary action obvious: **"创建我的冰雪分身"**.
-   Add a clear secondary path such as **"直接试玩"**. It must use a
    default/preset character and enter the map without uploading a
    photo, invoking `/api/generate`, or requiring an API key.
-   Explain the experience in a compact 3-step sequence: create/choose a
    character → explore a place → play and collect.
-   Provide an obvious way to return to the map, continue exploring, or
    replay a challenge.
-   Make loading, empty, unavailable-provider, failure, retry, and
    success states understandable and visually consistent.
-   Do not bury the core action beneath long instructions or decorative
    UI.

#### Visual system

Use the existing visual language as the baseline: deep winter navy, ice
cyan/mint, aurora violet, snow-white surfaces, and a restrained
medal-gold accent. Suggested existing-compatible tokens include:

-   Night/navy: `#10285F`
-   Deep blue: `#1E3F83`
-   Ice aqua: `#75E6E3`
-   Aurora violet: `#7159F4`
-   Medal gold: `#FFE36F`
-   Paper: `#F7FBFF`
-   Main text: `#16325D`
-   Muted text: `#6780A2`

Before changing colors, check existing variables and usage. Avoid
duplicating tokens. Keep color contrast strong; gold and pale aqua are
accents, not small-text colors on white.

-   Define a coherent type scale, spacing scale, border radii, shadows,
    focus rings, and shared button/card states.
-   Establish clear hierarchy between hero, character preview, map,
    mission cards, location detail, and rewards.
-   Make location cards feel like game missions: category, activity,
    difficulty if supported, completion state, and reward.
-   Use motion purposefully for arrival, stamp earned, and page
    transitions. Avoid constant animation or motion that delays
    interaction.
-   Preserve the book/page-flip concept, but do not force slow page-turn
    animations into every routine action.
-   Review the CSS import order and specificity before editing. Prefer
    consolidating tokens and duplicate rules over appending more
    overrides.
-   Do not use emoji as the only accessible label for an action.

#### Mobile and accessibility

-   Test at approximately 360px, 390px, 768px, 1024px, and 1440px widths
    when browser tooling is available.
-   Remove any viewport settings that prevent browser zoom, including
    `user-scalable=no` / `maximum-scale=1`, unless a documented platform
    constraint requires otherwise.
-   Prevent horizontal overflow, clipped controls, and touch targets
    that are too small.
-   Ensure game controls work with touch and keyboard. Show
    `:focus-visible` styling.
-   For dialogs/sheets, check focus entry, Escape handling, focus
    restoration, and accessible names. Do not add a focus trap unless it
    is implemented correctly.
-   Respect `prefers-reduced-motion: reduce` for page flips, travel
    animation, floating decoration, and celebratory effects.
-   Sound must remain user-controlled; do not autoplay sound on page
    load.
-   Keep photo and provider privacy text clear: explain when an image is
    sent to a selected provider. Do not persist original photos or
    expose credentials as a shortcut.

### Phase 2 --- Make exploration and rewards legible

The core loop needs to be immediately understandable and rewarding.

#### Separate two progress tracks

Represent these concepts distinctly in state and UI:

1.  **Exploration progress:** places the user has reached, out of 16.
2.  **Challenge medals:** venue mini-games the user has won, out of 10.

Do not let arriving at an attraction silently count as winning a sports
challenge. Do not let winning a mini-game falsely imply that every other
place has been explored.

Before modifying persistence, inspect all uses of `state.visited`,
`state.stamps`, `map.setVisited`, and `cc2027:progress`. Add a
backward-compatible migration that preserves existing progress:

-   Existing `visited` IDs remain explored.
-   Legacy stamp IDs that match known venue IDs can migrate to challenge
    medals.
-   Legacy attraction stamp IDs should be preserved as exploration
    state.
-   Keep old data recoverable; do not clear or rename the old key
    without a safe migration.
-   Make map styling distinguish "visited" from "challenge completed"
    without confusing the two.

Keep the server's aggregate virtual-arrival statistics separate from
local player progress.

#### Add a small progression loop

-   Show a concise exploration count and challenge-medal count in the
    passport/progress area.
-   Give each successful challenge clear feedback: result, score, medal
    earned or already owned, and a next action.
-   Persist personal best scores locally with a versioned key and
    graceful handling when storage is unavailable.
-   Let users replay completed games without awarding duplicate medals
    or inflating completion counts.
-   Improve the passport/souvenir card to show character name,
    exploration progress, challenge medals, and a memorable winter
    visual. Keep it downloadable locally; do not add a social-network
    API.
-   Offer one clear next action after an arrival or win, such as
    "继续探索" or "挑战下一座场馆".
-   Do not add login, cloud saves, a public leaderboard, or a backend
    database in this scope.

### Phase 3 --- Add genuinely different game experiences

First understand the current engine contract and victory callback.
Preserve the existing four modes and their venue configurations.

#### New game A: Ice Hockey Goalie / 冰球门神反应挑战

Implement a compact, replayable reaction game with five shots:

-   The user plays as the goalie.
-   Each shot gives a short, readable cue or trajectory preview.
-   The player chooses left, center, or right using visible touch
    controls and keyboard equivalents.
-   Correct saves increase the score and can build a short streak;
    misses are clearly explained.
-   Difficulty should be fair and readable. Avoid relying on extremely
    fast reactions alone.
-   Provide intro instructions, a short countdown, round progress (for
    example, 2/5), result state, replay, and return-to-map actions.
-   Use the existing avatar in the game where practical, and match the
    current rounded winter art style.
-   Add the new engine to the existing game system if the current
    architecture supports it cleanly. If the existing
    two-button/one-button control model is insufficient, extend it
    explicitly rather than disguising three-way input behind ambiguous
    buttons.
-   Make random outcomes testable: allow deterministic parameters or
    injected randomness if that fits the existing engine contract.

#### New game B: Winter Sports & City Quiz / 冰雪知识快问快答

Add an accessible bonus game with five multiple-choice questions:

-   Four clearly labelled answer buttons per question.
-   Explain the correct answer after each selection.
-   Show question progress, score, and a final result.
-   Support keyboard, touch, focus-visible states, and screen-reader
    announcements.
-   Use verified facts from current venue/attraction data or reliable
    sources already linked by the project. Do not invent competition
    schedules, results, or official claims.
-   Keep this reward separate from the 10 venue challenge medals, for
    example as a knowledge badge or bonus record.
-   Use semantic HTML buttons for answers. Do not force a four-choice
    quiz into a Canvas-only interface if a small DOM-based view is more
    accessible.
-   Keep questions in a maintainable data module rather than embedding a
    large question bank in `play.js`.

The two new modes should feel mechanically different from rhythm,
aiming, dodging, and jumping. Do not add multiple reskinned copies of
the same mechanic.

#### Integration and testability

-   Reuse the existing modal/overlay and visual tokens where possible.
-   Keep start, finish, replay, close, audio mode, and map return
    behavior consistent.
-   Ensure closing or restarting a game cancels animation frames,
    timers, and event listeners as appropriate.
-   Prevent multiple simultaneous game loops and duplicate reward
    callbacks.
-   Add tests for the new mechanics, victory/defeat conditions, score
    boundaries, and repeated input. Avoid paid API calls in tests.

### Phase 4 --- Polish, performance, documentation, and regression tests

-   Check that the main page, `/display`, map filters/zoom, location
    detail, avatar editor, provider errors, souvenir export, sound
    toggle, and virtual-visit stream still work.
-   Review `innerHTML` use involving dynamic values. Prefer
    `textContent` or DOM construction for user-controlled or externally
    sourced content.
-   Keep Canvas drawing responsive to device pixel ratio and resize
    events. Avoid adding expensive work on every animation frame.
-   Ensure hidden UI is actually hidden and interactive elements cannot
    be accidentally activated behind an overlay.
-   Keep server statistics copy explicit that they count virtual
    arrivals, not unique users or real foot traffic.
-   Update `README.md` with new play instructions, progress semantics,
    new game modes, tests, and privacy/API-provider notes.
-   Run all existing test commands plus new game tests.
-   If a browser is available, perform smoke tests at desktop and mobile
    widths and check the browser console. If not, state that
    visual/browser QA was not performed; do not pretend it was.
-   Inspect `git diff --check`, `git status --short`, and the final
    diff. Keep the patch focused.

## Definition of done

The task is complete only when the following are true, or when any
blocked item is explicitly documented:

-   [ ] First-time users can enter a demo flow without photo upload or a
    paid generation API.
-   [ ] The character → map → place → game → reward → passport loop is
    clear.
-   [ ] Exploration progress and challenge medals are separate, with
    existing local progress migrated safely.
-   [ ] The goalie game has a distinct five-shot reaction mechanic.
-   [ ] The quiz has five verified questions, explanations, and
    accessible answer controls.
-   [ ] Existing four game modes still work.
-   [ ] All available existing tests and new tests pass, or
    baseline/environment failures are clearly listed.
-   [ ] No unrelated user changes, secrets, or user data were
    overwritten.
-   [ ] Mobile layout, keyboard navigation, zoom, and reduced-motion
    behavior have been checked to the extent tools allow.
-   [ ] README and final report match what was actually implemented.

## How to report back

At the end, provide:

1.  A short summary of the product/UX changes.
2.  A list of the key files changed and why.
3.  The new gameplay and reward behavior.
4.  Every test command run and its actual result.
5.  Browser/device checks performed, plus anything not verified.
6.  Any known issues or recommended next steps.

Do not merely output a future plan. Implement the highest-priority safe
slice, test it, then continue through the phases while preserving the
current project.
