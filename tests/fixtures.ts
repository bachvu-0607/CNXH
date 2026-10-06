import type { RoomState, Player } from '../src/types/game';
export const player = (id: string, position = 1): Player => ({ id, name: id, color: '#047857', colorName: 'Xanh lá',
  avatar: '🟢', position, hintsRemaining: 2, isReady: false, connected: true, completedLap: false, laps: 0 });
export function room(overrides: Partial<RoomState> = {}): RoomState {
  return { roomCode: 'TEST1', hostId: 'host', hostName: 'Quản trò', hostIsPlayer: false, status: 'playing',
    players: ['a','b','c'].map(id => player(id)), currentPlayerIndex: 0, diceValue: null,
    isBonusRoll: false, bonusPlayerId: null, targetPosition: null, currentQuestion: null,
    usedQuestionKeys: [], winner: null, playerIds: (overrides.players || ['a','b','c'].map(id => player(id))).map(p => p.id), turnId: 'turn-1', createdAt: 0, updatedAt: 0, ...overrides };
}
