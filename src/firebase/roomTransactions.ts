import { doc, getDocFromServer, runTransaction, serverTimestamp, type Firestore, type Timestamp } from 'firebase/firestore';
import type { RoomState } from '../types/game';
import { applyGameAction, type GameAction } from '../game/engine';

export async function transactRoomAction(db: Firestore, roomCode: string, actor: string, action: GameAction) {
  const ref = doc(db, 'rooms', roomCode);
  for (let attempt = 0; ; attempt++) {
    let observedTime: Timestamp | undefined;
    try {
      return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return { success: false, message: 'Phòng không tồn tại.' };
        observedTime = snapshot.get('updatedAt');
        const result = applyGameAction(snapshot.data() as RoomState, actor, action);
        if (result.room) transaction.update(ref, { ...result.room, updatedAt: serverTimestamp() });
        return { success: result.success, message: result.message, isCorrect: result.isCorrect };
      });
    } catch (error) {
      // Rules may reject a stale optimistic write before the SDK sees the
      // transaction conflict. Retry only when the room actually changed;
      // unchanged-state permission errors must still surface to the caller.
      if (attempt >= 2 || (error as { code?: string }).code !== 'permission-denied' || !observedTime) throw error;
      const latest = await getDocFromServer(ref);
      const latestTime = latest.get('updatedAt') as Timestamp | undefined;
      if (!latest.exists() || !latestTime || observedTime.isEqual(latestTime)) throw error;
    }
  }
}
