# Dá-lhe! Sprint 1: A1, A2, B1 task breakdown

Evening-sized tasks for the first stories of Sprint 1, each with a "done when" so you know when to stop. Route and file names are placeholders; adapt them to your structure.

## A1. Endpoint plumbing

1. **`resolveRig(id)`** in `$lib/server/rigs/`: return the rig or `null`. A malformed UUID returns `null` too, so you get the same 404 and no leak. *Done when:* a random UUID and the string "abc" both return null.
2. **Response helpers:** `rigJson(body, status)` that always sets `Cache-Control: no-store`, plus a generic `notFound()`. *Done when:* every response from them has the header.
3. **Query parsing:** a helper that takes the URL and a schema and returns a typed object or a 400 with a readable message. GET params are all strings, so coerce numbers (`z.coerce` if you use zod). *Done when:* `?lap_ms=abc` gives a 400 that names the field.
4. **Throwaway `/api/rig/ping`** wired to all three. Test with curl: unknown rig gives 404, bad param gives 400, valid gives 200, and the header is present. *Done when:* all four hold.

## A2. Poll + `rig_status`

1. **Expiry in one place:** define the session expiry window once (a small SQL function or constant). `rig_status`, the stats upserts and the write rpcs all need the same number.
2. **`rig_status(p_rig_id)`** returns rig name, `session_active` and driver, with expiry in the `WHERE`. No writes. *Done when:* the SQL editor shows three correct results for no session, active and stale.
3. **Service `getRigStatus(rig)`:** map the row to typed camelCase `{ name, sessionActive, driver }`.
4. **Route `GET /api/rig/poll`** using the A1 helpers.
5. **Check:** poll twice and confirm `last_activity_at` didn't move. Start the fake-rig script with just this scenario.

## B1. Connect action

1. **Decide the takeover rule first** (see the open decision below), then check `connect_to_rig` does exactly that.
2. **Connect page:** `load` validates the rig (404 page if unknown) and shows its name. If logged out, redirect to login with a return URL, because a QR scan will often start logged out. *Done when:* scanning while logged out lands back on this page after login.
3. **Service `connectToRig(userId, rigId)`:** call the rpc and map errors.
4. **Form action:** call the service, then `redirect(303, lounge)`. Create a stub lounge page that shows the rig name; B4 and B5 fill it in later. *Done when:* the association row appears and you land on the stub.
5. **Edge cases:** connecting twice only updates `last_connected_at`, an unknown rig and an rpc failure both return a clean `fail()`, and the takeover behaves as decided.

## Working habit

End each short session by leaving a `// NEXT:` comment where you stopped, so the next session doesn't start with rediscovering the plan.

## Open decision: takeover rule

Connecting while another user is driving: silent takeover or warn first? Default suggestion for Sprint 1 is silent takeover. It's a family app, the cost of a wrong takeover is low, and a warning dialog adds an extra state to B1. This is still to be confirmed.
