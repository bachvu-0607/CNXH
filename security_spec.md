# Security Specification: Hành Trình Làm Chủ Board Game

## 1. Data Invariants
- A room document must have a valid `roomCode` matching `^[A-Z0-9]{4,10}$`.
- The `hostId` must be a valid non-empty string.
- Anonymous and authenticated users can create and join rooms.
- Only room members can read and update the room state.
- `players` array can hold at most 4 players.
- Room status transitions follow the game lifecycle: `lobby` -> `playing` / `rolling` / `moving` / `evaluating` -> `finished`.

## 2. Dirty Dozen Security Attack Scenarios
1. **Unauthenticated Read/Write**: Unauthenticated users cannot read or modify rooms.
2. **Invalid Room Code**: Rejecting malformed or excessively long room codes.
3. **Player List Flooding**: Attempting to add more than 4 players to a room.
4. **Non-Member Tampering**: User not present in room `players` modifying game state.
5. **Host Impersonation**: Non-host user attempting to start game or force Host evaluation.
6. **Malicious State Hijack**: Forging negative scores or out-of-bound board positions (< 1 or > 24).
7. **Dice Roll Manipulation**: Rolling dice when it is not the user's turn.
8. **Double Evaluation**: Submitting multiple score updates for the same question.
9. **Direct Winner Injection**: Forging winner field without completing the game lap or finishing evaluation.
10. **Shadow Fields Injection**: Adding unauthorized schema properties to room doc.
11. **Client Timestamp Spoofing**: Replacing server timestamps.
12. **Premature Game Termination**: Forcing terminal status before game completes.

## 3. Implementation Rules
- Room read allowed for all authenticated/anonymous users participating or looking up room code.
- Room create allowed for signed in user setting themselves as host and first player.
- Room update allowed for active players with valid structure and bounded arrays.
