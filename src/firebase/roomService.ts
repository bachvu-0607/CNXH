import { doc, runTransaction, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import { getGuestUserId } from './guestIdentity';
import type { RoomState, QuestionPhase } from '../types/game';
import type { GameAction } from '../game/engine';
import { transactRoomAction } from './roomTransactions';
export { PLAYER_COLORS, rollNormalDice, rollBonusDice } from '../game/engine';

function requireUser(expectedId?: string): string {
  const id = expectedId || getGuestUserId();
  if (!id) throw new Error('Không tạo được mã người chơi. Vui lòng tải lại trang.');
  return id;
}
function roomRef(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(normalized)) throw new Error('Mã phòng phải gồm 5 chữ cái hoặc chữ số.');
  return doc(db, 'rooms', normalized);
}

export async function dispatchRoomAction(code: string, action: GameAction, expectedUserId?: string) {
  const actor = requireUser(expectedUserId);
  const ref = roomRef(code);
  return transactRoomAction(db, ref.id, actor, action);
}

export async function createRoom(hostName: string, hostId: string, _hostIsPlayer = false): Promise<string> {
  requireUser(hostId);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 5; attempt++) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const code = Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
    const ref = roomRef(code);
    const created = await runTransaction(db, async transaction => {
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, {
        roomCode: code, hostId, hostName: hostName.trim().slice(0, 60) || 'Quản trò', hostIsPlayer: false,
        status: 'lobby', players: [], playerIds: [], currentPlayerIndex: 0, diceValue: null, isBonusRoll: false,
        bonusPlayerId: null, targetPosition: null, currentQuestion: null, usedQuestionKeys: [], winner: null,
        turnId: crypto.randomUUID(), lastAction: { type: 'create', actorId: hostId },
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      return true;
    });
    if (created) return code;
  }
  throw new Error('Chưa tạo được mã phòng mới. Vui lòng thử lại.');
}

export const joinRoom = (code: string, name: string, id: string) => dispatchRoomAction(code, { type: 'join', name }, id);
export const setPlayerReady = (code: string, id: string, ready: boolean) => dispatchRoomAction(code, { type: 'ready', ready }, id);
export const startGame = (code: string, id: string) => dispatchRoomAction(code, { type: 'start' }, id);
export const restartGame = (code: string, id: string) => dispatchRoomAction(code, { type: 'restart' }, id);
export const leaveRoom = (code: string, id: string) => dispatchRoomAction(code, { type: 'leave' }, id);
export const rollDice = (code: string, id: string, turnId: string) => dispatchRoomAction(code, { type: 'roll', turnId }, id);
export const openQuestionModal = (code: string, turnId: string) => dispatchRoomAction(code, { type: 'open', turnId });
export const finishBonusRoll = (code: string, turnId: string) => dispatchRoomAction(code, { type: 'finish_bonus', turnId });
export const skipTurn = (code: string, turnId: string) => dispatchRoomAction(code, { type: 'skip', turnId });
export const submitPlayerAnswer = (code: string, answer: string, id: string, turnId: string, phase: QuestionPhase) =>
  dispatchRoomAction(code, { type: 'answer', answer, turnId, phase }, id);
export const reviewPlayerAnswer = (code: string, id: string, turnId: string, correct: boolean) =>
  dispatchRoomAction(code, { type: 'review', correct, turnId, phase: 'host_review' }, id);
export const closeQuestionAndAdvance = (code: string, turnId: string, phase: QuestionPhase) =>
  dispatchRoomAction(code, { type: 'close', turnId, phase });
export const usePlayerHint = (code: string, id: string, turnId: string) => dispatchRoomAction(code, { type: 'hint', turnId }, id);
export const buzzToStealQuestion = (code: string, id: string, turnId: string) => dispatchRoomAction(code, { type: 'buzz', turnId }, id);
export const handleMainPlayerTimeout = (code: string, turnId: string) =>
  dispatchRoomAction(code, { type: 'timeout', turnId, phase: 'active_answering' });
export const handleStealTimeout = (code: string, turnId: string) =>
  dispatchRoomAction(code, { type: 'timeout', turnId, phase: 'stealer_answering' });
export const handleHostReviewTimeout = (code: string, turnId: string) =>
  dispatchRoomAction(code, { type: 'timeout', turnId, phase: 'host_review' });

export function subscribeToRoom(code: string, onUpdate: (room: RoomState | null) => void,
  onError: (message: string) => void): Unsubscribe {
  return onSnapshot(roomRef(code), snapshot => onUpdate(snapshot.exists() ? snapshot.data() as RoomState : null),
    error => onError(error.code === 'permission-denied' ? 'Không có quyền truy cập phòng.' : 'Mất kết nối phòng. Vui lòng thử lại.'));
}
