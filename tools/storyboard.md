# Storyboard runbook

When the user asks "rerun the storyboard" (or similar), follow these instructions exactly. Read `tools/storyboard.config.json` first.

## Preflight

1. **Read config.** Load `tools/storyboard.config.json`. Capture `targetUrl`, `viewport`, `auth`, `password`, `figmaFileKey`, `figmaPageName`.
2. **Start the dev server.** Run `npx wrangler dev --port 8787` in the background. Wait until `http://localhost:8787` responds.
3. **Start the local screenshot helper.** Run `python3 tools/_save_screenshot.py` in the background. Probe with `curl -s -X POST 'http://127.0.0.1:9999/save?name=__probe.txt' --data-binary 'ok'` — it should write `tools/out/__probe.txt`. Delete the probe.
4. **Wipe the output dir.** `rm -rf tools/out && mkdir -p tools/out/<each-flow-id>`.
5. **Open Chrome.** Pick the connected browser via `mcp__claude-in-chrome__list_connected_browsers` + `select_browser`. Create a tab with `tabs_context_mcp({ createIfEmpty: true })`.
6. **Resize window.** `mcp__claude-in-chrome__resize_window` to `viewport.width × viewport.height`.
7. **Navigate.** `mcp__claude-in-chrome__navigate` to `targetUrl`. The first call may require user permission for the localhost origin.
8. **Auth.**
   - If `auth === "fresh"`: clear the `yt_auth` cookie for the origin (`document.cookie = "yt_auth=; Max-Age=0; path=/"`), then reload.
   - **Always**: if the page rendered is the `/__login` page (detected by the presence of `input[type="password"][name="password"]`), submit the form: type `config.password` into the password field and click the Continue button. Wait for navigation. This runs for both `"reuse"` and `"fresh"` modes — a `"reuse"` run on a fresh browser still needs to log in.
9. **Focus Chrome.** Chrome background-tab throttling clamps timers when the localhost tab isn't visible. Run this AppleScript (Bash) to bring the right Chrome window to the foreground — try `Google Chrome Canary` first, then `Google Chrome`:

   ```bash
   osascript <<'EOF'
   tell application "Google Chrome Canary"
     activate
     set wcount to count of windows
     repeat with i from 1 to wcount
       set tcount to count of tabs of window i
       repeat with j from 1 to tcount
         if URL of tab j of window i contains "localhost:8787" then
           set active tab index of window i to j
           set index of window i to 1
           return "focused"
         end if
       end repeat
     end repeat
     return "not-found"
   end tell
   EOF
   ```

   If `not-found`, retry with `Google Chrome`. This is required for the capture loop to run at full speed; the `setTimeout` patch in `capture-controller.js` provides a backup but visible-tab state is the reliable signal.
10. **Sanity.** Confirm the demo loaded by checking `document.querySelector("#startScreen")` exists via `mcp__claude-in-chrome__javascript_tool`.

## Capture phase

1. **Inject html2canvas.** Run via `javascript_tool`:

   ```js
   (async function(){
     if (window.html2canvas) return 'already-loaded';
     const s = document.createElement('script');
     s.src = '/tools/_html2canvas.min.js';
     const p = new Promise((res, rej) => { s.onload = () => res('ok'); s.onerror = () => rej(new Error('load-failed')); });
     document.head.appendChild(s);
     await p;
     return typeof html2canvas;
   })()
   ```

   Expect `function`. The file is served same-origin by wrangler dev from the worktree's `tools/_html2canvas.min.js`.
2. **Inject capture controller.** Run the contents of `tools/capture-controller.js` via `javascript_tool`. It is idempotent (no-op on re-injection) and installs `window.__sb_snap` plus `window.__storyboard.{start, next, poll}`.
3. **Wait for flows to register.** `UserFlow.play()` runs on the `load` event, so `UserFlow.getFlows()` returns `[]` until then. Poll `UserFlow.getFlows().length > 0` for up to 5 seconds. If it remains `0`, abort with "flows never registered; check that UserFlow.play() ran on the page".
4. **Discover flows.** Evaluate `JSON.stringify(UserFlow.getFlows())` — parse client-side. Note `flows[*].id`, `flows[*].name`, `flows[*].steps[*].say`.
5. **For each flow:**
   1. Reload the page (`navigate` to `targetUrl` or `location.reload()` via `javascript_tool`). Re-run preflight steps 9–10 (focus, sanity).
   2. Re-inject html2canvas and `tools/capture-controller.js` (both idempotent — needed because the reload wiped the page JS state).
   3. Call `window.__storyboard.start(flowId)` via `javascript_tool`. Do not await.
   4. **Per-step loop** — track `prevIdx = -1` for this flow. Repeat until `poll().done === true`:
      1. Poll `window.__storyboard.poll()` until `lastStep !== null && lastStep.idx > prevIdx && awaitingAdvance === true`. Allow up to 8 seconds per step before treating it as failure.
      2. If `error` is set, abort the run, surface the message, and stop.
      3. Call `await window.__sb_snap('<flow.id>/<NN>-<slug(say)>.png')` via `javascript_tool`, where `NN` is the zero-padded index (e.g. `03`) and `slug(say)` is a kebab-case slug of the step's `say` text (lowercase, non-alnum → `-`, collapse dashes, trim). The snap function POSTs the bytes to `127.0.0.1:9999` and the helper writes them under `tools/out/`.
      4. Set `prevIdx = lastStep.idx`.
      5. Call `window.__storyboard.next()` to advance.
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
2. **Find or create page.** Open the file. The default page (`Page 1`) is used unless `figmaPageName` differs.
3. **Clear page.** Follow the `figma-use` skill, then run a plugin script that removes all children of the target page.
4. **Upload assets.** Use `mcp__figma-remote__upload_assets` (count: 5 per call, 4 calls for 20 images) to get presigned URLs. For each, `curl -s -X POST -F "file=@tools/out/<flow>/<file>;filename=<file>" "<submitUrl>"`. The response includes the `placedOnNodeId` for each — record these in order.
5. **Layout.** Run a `use_figma` plugin script that, given the manifest + node IDs from step 4:
   - Loads Inter Regular and Inter Semi Bold.
   - Creates a root vertical auto-layout container.
   - Appends a banner text node (`Storyboard` title) and a sub-line (`<gitSha> · captured <capturedAt>`).
   - For each flow in manifest order: creates a section frame titled `flow.name` (vertical auto-layout, light fill, rounded corners). Inside it, lays out one tile per step in a horizontal auto-layout row.
   - Each tile: a vertical auto-layout containing `[NN]  <say>` label (Semi Bold, 13px) above a 360×189 frame with the image (resize the placed frame to 360×189 — image fills auto-rescale).
   - Sections stack vertically with 48px gap.
6. **Report.** Print the final file URL.

## Failure modes

- **Step never settles** — surfaced via `error` in `poll()`. Stop; do not write Figma. Manifest is not written.
- **Auth gate not handled** — if the demo `#startScreen` isn't visible after preflight, abort with "auth gate not bypassed; check config.password or auth mode".
- **Figma file key invalid** — surface the Figma MCP error verbatim. Suggest setting `figmaFileKey: null` to recreate.
- **Capture loop hangs at step 0** — the localhost tab isn't visible in Chrome (Page Visibility hidden) AND the setTimeout patch isn't installed. Re-run preflight step 9 (AppleScript focus) and verify `document.visibilityState === 'visible'` before injecting the capture controller.
- **html2canvas not loaded** — `__sb_snap` throws "html2canvas not loaded". Confirm capture phase step 1 ran successfully and `typeof html2canvas === 'function'` in the page.
- **Helper not responding** — `__sb_snap` throws on the fetch. Confirm `python3 tools/_save_screenshot.py` is still running and `curl http://127.0.0.1:9999/save?name=…` works from a shell.
