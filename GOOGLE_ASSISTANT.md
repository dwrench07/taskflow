# "Hey Google → add a reminder to Dash"

This document covers the voice-to-Dash reminder feature: what's in the code, what
you still have to do outside the repo, and the honest limitations.

## What this feature does

Say: **"Hey Google, add a reminder in Dash to call mom tomorrow at 5pm."**

1. Google Assistant/Gemini matches the built-in **`CREATE_THING`** intent declared
   in `android/app/src/main/res/xml/shortcuts.xml`.
2. It opens the Dash Android app via the deep link `dash://quick-add?text=call mom tomorrow at 5pm`.
3. `src/components/deep-link-handler.tsx` catches the deep link (cold start and
   while running) and POSTs the text to **`/api/quick-add`**.
4. `src/lib/reminder-parser.ts` turns the phrase into a reminder — title
   ("Call mom"), due date/time (tomorrow 17:00 in the device's timezone), and a
   priority — and it's saved as a task tagged `reminder` for the signed-in user.

The parser understands: `today`, `tonight`, `tomorrow`, `day after tomorrow`,
`next week`, weekday names (`monday`, `next friday`), `in 30 minutes`/`in 2 hours`/
`in 3 days`, `on March 5`, clock times (`at 5pm`, `5:30pm`, `17:00`, `noon`,
`midnight`), and priority words (`urgent`, `asap`, `important`). Anything it can't
parse becomes a plain reminder with no date rather than failing.

## What works with no extra setup

- `/api/quick-add` is live and authenticated. You can use it today from the web app
  (or any logged-in client) without Google at all, e.g. a "quick add" box:

  ```bash
  curl -X POST https://taskflow-iota-ashen.vercel.app/api/quick-add \
    -H 'Content-Type: application/json' \
    --cookie 'token=<your session cookie>' \
    -d '{"text":"remind me to pay rent on March 1","tzOffsetMinutes":300}'
  ```

- The deep link itself works once the app is built: opening
  `dash://quick-add?text=...` on the device creates the reminder.

## What YOU must do for the "Hey Google" part (outside this repo)

The voice trigger depends on Google, not on code we can ship:

1. **Publish the Android app to the Play Store.** App Actions are only evaluated for
   installed apps that Google can match to a Play listing. Build with
   `npx cap sync android` then assemble/upload an AAB.
2. **Register/verify App Actions** in Play Console and test with the
   **Google Assistant plugin for Android Studio** (App Actions test tool) before
   release. Google reviews/approves the capability.
3. Keep `appId` = `com.dash.productivity` consistent across `capacitor.config.json`,
   the manifest `targetPackage`, and the Play listing.

### Honest limitations (verified Oct 2026)

- You **cannot** make a *generic* "Hey Google, remind me to X" silently land in Dash.
  A bare reminder phrase goes to Google's own Tasks/Calendar. Catching it requires
  the user to say **"…in Dash"** (the App Action path here), or the Google Tasks
  bridge below.
- Google's older `actions.xml` Conversational Actions are **deprecated/removed**; the
  `shortcuts.xml` built-in-intent framework used here is the current path, and the
  newer **AppFunctions** agent API is still experimental. Confirm the current status
  of `actions.intent.CREATE_THING` in Google's built-in-intent reference before you
  rely on it; if it has changed, the deep link and `/api/quick-add` still work via
  the alternatives below.

## Recommended alternative: Google Tasks bridge

If the App Action approval proves fragile, the most reliable "say it and it shows up
in Dash" path is to sync **Google Tasks** (which Gemini already writes voice reminders
into) into Dash via the Google Tasks API (OAuth). It needs a Google Cloud OAuth client
(your setup) but no Play Store capability approval. Not yet implemented — ask and it
can be added as a follow-up.

## Files involved

| File | Role |
| --- | --- |
| `src/lib/reminder-parser.ts` | Natural-language → title + due date + priority |
| `src/pages/api/quick-add.ts` | Authenticated endpoint that creates the reminder |
| `src/components/deep-link-handler.tsx` | Catches `dash://quick-add` in the app |
| `android/app/src/main/res/xml/shortcuts.xml` | Declares the `CREATE_THING` App Action |
| `android/app/src/main/AndroidManifest.xml` | Deep-link filter + shortcuts registration |
