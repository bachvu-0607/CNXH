# Security specification

Rooms contain one host (observer) and up to seven players. Firebase Anonymous Authentication must be enabled. Client-generated localStorage identities are not accepted as authentication.

All requests require Firebase authentication. An exact five-character room-code lookup is allowed for invitations; collection listing is denied. Only the host may delete a room, start/restart a game or skip an abandoned turn. A new player may only append their own authenticated UID in the lobby. Existing players may change their own name/readiness, use their own hints and leave. Joining, readiness, leaving and gameplay writes use transactions.

Rules keep host identity and creation time immutable, validate seven distinct player identities and bound player state. They restrict changed fields for each action, answer ownership, timestamps, movement and winner assignment. Members may resolve expired timers and completed results; their requests cannot change a new turn or a different question phase. Identity mapping and uniqueness are checked on every write. New players receive full schema validation; each action then validates exactly the fields it changes and preserves all others. Reset actions validate every reset value, movement checks board/lap bounds, readiness accepts only a boolean, and hints permit only a bounded decrement. This keeps seven-player updates within Firestore's rule-evaluation budget without dropping these invariants.

The browser still selects the random dice and evaluates answers. These rules prevent outsiders and invalid state transitions; this is not a server-authoritative anti-cheat system against a player who rewrites their own browser code. Question answers are shipped with the educational game. A competitive deployment would need server-side dice, answer evaluation and private question data.

Run `npm run test:rules` against the local demo emulator to verify allowed gameplay and denied malicious writes. Tests never use the production project. Deploy `firestore.rules` separately from the Vercel frontend; pushing Git does not deploy Firebase rules.
