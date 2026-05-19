# Storyboard runbook

When the user asks "rerun the storyboard" (or similar), follow these instructions exactly. Read `tools/storyboard.config.json` first.

## Preflight

1. **Read config.** Load `tools/storyboard.config.json`. Capture `targetUrl`, `viewport`, `auth`, `password`, `figmaFileKey`, `figmaPageName`.
2. **Open Chrome.** Navigate to `targetUrl` using `mcp__claude-in-chrome__navigate`.
3. **Resize window.** Set the viewport to `viewport.width × viewport.height` via `mcp__claude-in-chrome__resize_window`.
4. **Auth.**
   - If `auth === "fresh"`: clear the `yt_auth` cookie for the origin (via `mcp__claude-in-chrome__javascript_tool`: `document.cookie = "yt_auth=; Max-Age=0; path=/"`), then reload.
   - **Always**: if the page rendered is the `/__login` page (detected by the presence of `input[type="password"][name="password"]`), submit the form: type `config.password` into the password field and click the Continue button. Wait for navigation. This runs for both `"reuse"` and `"fresh"` modes — a `"reuse"` run on a fresh browser still needs to log in.
5. **Sanity.** Confirm the demo loaded by checking `document.querySelector("#startScreen")` exists via `mcp__claude-in-chrome__javascript_tool`.

## Capture phase

1. **Inject controller.** Run the contents of `tools/capture-controller.js` via `mcp__claude-in-chrome__javascript_tool`. Verify `typeof window.__storyboard.start === "function"`.
2. **Wait for flows to register.** `UserFlow.play()` is called on the `load` event, so `UserFlow.getFlows()` returns `[]` until then. Poll `UserFlow.getFlows().length > 0` via `mcp__claude-in-chrome__javascript_tool`, up to 5 seconds. If it remains `0`, abort with "flows never registered; check that UserFlow.play() ran on the page".
3. **Discover flows.** Evaluate `JSON.stringify(UserFlow.getFlows())` — parse the result client-side. Note `flows[*].id`, `flows[*].name`, `flows[*].steps[*].say`, and `flows[*].steps.length`.
4. **Prepare output.** Wipe `tools/out/` (delete recursively, then `mkdir -p tools/out`). Create one subdirectory per flow: `tools/out/<flow.id>/`.
5. **For each flow:**
   a. Reload the page (`mcp__claude-in-chrome__navigate` to `targetUrl`, or hard reload via `location.reload()`).
   b. Wait for `#startScreen` to be visible.
   c. Re-inject the controller (idempotent — needed because of the reload).
   d. Call `__storyboard.start(flowId)` via `mcp__claude-in-chrome__javascript_tool`. Do not await.
   e. Loop:
      i. Track `prevIdx` for this flow, initialized to `-1` before the loop. Poll `__storyboard.poll()` until `lastStep !== null && lastStep.idx > prevIdx && awaitingAdvance === true`. Allow up to 8 seconds per step before treating it as failure.
      ii. If `error` is set, abort the run, surface the message, and stop.
      iii. Take a **viewport-only** screenshot (not full-page) via the Chrome MCP screenshot tool. Save to `tools/out/<flow.id>/<NN>-<slug(say)>.png`, where `NN` is the zero-padded index (e.g. `03`) and `slug(say)` is a kebab-case slug of the step's `say` text (lowercase, non-alnum → `-`, collapse dashes, trim).
      iv. Set `prevIdx = lastStep.idx`.
      v. Call `__storyboard.next()` to advance.
   f. Break when `poll().done === true`.
6. **Write manifest.** After all flows captured, write `tools/out/manifest.json`:

   ```json
   {
     "capturedAt": "<ISO timestamp>",
     "gitSha": "<short sha from `git rev-parse --short HEAD`>",
     "viewport": { "width": 1440, "height": 900 },
     "flows": [
       {
         "id": "<flow.id>",
         "name": "<flow.name>",
         "steps": [
           { "idx": 0, "say": "<say text>", "file": "<flow.id>/00-<slug>.png" }
         ]
       }
     ]
   }
   ```

## Figma phase

1. **Resolve canonical file.**
   - If `figmaFileKey` is non-null, open the file by key via the Figma MCP.
   - If `figmaFileKey` is null, follow the `figma-create-new-file` skill to create a new design file titled `<repo name> storyboard`. Capture the resulting file key and write it back into `tools/storyboard.config.json`. **Stage this change for commit.**
2. **Find or create page.** Open the file, find a page named exactly `figmaPageName` (default `Storyboard`). Create it if missing.
3. **Clear page.** Follow the `figma-use` skill, then run a plugin script that removes all children of the `Storyboard` page.
4. **Upload assets.** Use `mcp__figma-remote__upload_assets` to upload every PNG in `tools/out/` (paths come from the manifest). Capture the returned imageHash for each.
5. **Layout.** Run a second `use_figma` plugin script that, given the manifest + imageHashes:
   - Creates a top banner text node: `Storyboard — <gitSha> — <capturedAt>`.
   - For each flow in manifest order: creates a section frame titled `flow.name`. Inside it, lays out one tile per step in a horizontal auto-layout row with 24px gap.
   - Each tile: a 360×225 frame with image fill (`imageHashes[step.file]`) plus a 14px text label above showing `[NN] <step.say>` (e.g. `[01] Start screen`).
   - Sections stack vertically with 48px gap.
6. **Report.** Print the final file URL.

## Failure modes

- **Step never settles** — surfaced via `error` in `poll()`. Stop; do not write Figma. Manifest is not written.
- **Auth gate not handled** — if the demo `#startScreen` isn't visible after preflight, abort with "auth gate not bypassed; check config.password or auth mode".
- **Figma file key invalid** — surface the Figma MCP error verbatim. Suggest setting `figmaFileKey: null` to recreate.
