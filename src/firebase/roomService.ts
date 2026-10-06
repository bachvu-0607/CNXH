import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  getDocFromServer,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './error';
import { RoomState, Player, CurrentQuestionState } from '../types/game';
import { BOARD_SQUARES } from '../questions/boardData';
import { generateMaskedHint } from '../utils/hintGenerator';

export const PLAYER_COLORS = [
  { color: '#BE123C', name: 'Đỏ', avatar: '🔴' },
  { color: '#1D4ED8', name: 'Xanh dương', avatar: '🔵' },
  { color: '#047857', name: 'Xanh lá', avatar: '🟢' },
  { color: '#D97706', name: 'Vàng cam', avatar: '🟡' },
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Normal Roll: 1: 15% | 2: 25% | 3: 25% | 4: 15% | 5: 10% | 6: 10%
export function rollNormalDice(): number {
  const r = Math.random();
  if (r < 0.15) return 1;
  if (r < 0.40) return 2;
  if (r < 0.65) return 3;
  if (r < 0.80) return 4;
  if (r < 0.90) return 5;
  return 6;
}

// Bonus Roll: 1: 7.5% | 2: 10% | 3: 10% | 4: 12.5% | 5: 30% | 6: 30%
export function rollBonusDice(): number {
  const r = Math.random();
  if (r < 0.075) return 1;
  if (r < 0.175) return 2;
  if (r < 0.275) return 3;
  if (r < 0.400) return 4;
  if (r < 0.700) return 5;
  return 6;
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline.');
    }
    return false;
  }
}

export async function createRoom(
  hostName: string,
  hostId: string,
  hostIsPlayer: boolean = false
): Promise<string> {
  const roomCode = generateRoomCode();
  const path = `rooms/${roomCode}`;

  const players: Player[] = [];

  if (hostIsPlayer) {
    players.push({
      id: hostId,
      name: hostName.trim() || 'Người chơi 1',
      color: PLAYER_COLORS[0].color,
      colorName: PLAYER_COLORS[0].name,
      avatar: PLAYER_COLORS[0].avatar,
      position: 1,
      hintsRemaining: 2, // Max 2 hint uses
      score: 0,
      isReady: true,
      connected: true,
      completedLap: false,
      laps: 0,
      joinedAt: Date.now(),
    });
  }

  const roomData: any = {
    roomCode,
    hostId,
    hostName: hostName.trim() || 'Thầy/Cô Quản Trò',
    hostIsPlayer,
    status: 'lobby',
    players,
    currentPlayerIndex: 0,
    diceValue: null,
    isBonusRoll: false,
    bonusPlayerId: null,
    targetPosition: null,
    currentQuestion: null,
    usedQuestionKeys: [],
    winner: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'rooms', roomCode), roomData);
    return roomCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinRoom(
  roomCode: string,
  playerName: string,
  playerId: string
): Promise<{ success: boolean; message?: string }> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      return { success: false, message: 'Phòng không tồn tại. Vui lòng kiểm tra lại mã phòng.' };
    }

    const room = snap.data() as RoomState;
    const existingPlayerIndex = room.players.findIndex((p) => p.id === playerId);

    if (existingPlayerIndex >= 0) {
      const updatedPlayers = [...room.players];
      updatedPlayers[existingPlayerIndex] = {
        ...updatedPlayers[existingPlayerIndex],
        name: playerName.trim() || updatedPlayers[existingPlayerIndex].name,
        connected: true,
        hintsRemaining: updatedPlayers[existingPlayerIndex].hintsRemaining ?? 2,
      };

      await updateDoc(roomRef, {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    }

    if (room.status !== 'lobby') {
      return { success: false, message: 'Trò chơi đã bắt đầu, không thể tham gia.' };
    }

    if (room.players.length >= 4) {
      return { success: false, message: 'Phòng đã đủ 4 đội/người chơi.' };
    }

    const colorConfig = PLAYER_COLORS[room.players.length] || PLAYER_COLORS[0];
    const newPlayer: Player = {
      id: playerId,
      name: playerName.trim() || `Đội ${room.players.length + 1}`,
      color: colorConfig.color,
      colorName: colorConfig.name,
      avatar: colorConfig.avatar,
      position: 1,
      hintsRemaining: 2, // Max 2 hint uses
      score: 0,
      isReady: false,
      connected: true,
      completedLap: false,
      laps: 0,
      joinedAt: Date.now(),
    };

    await updateDoc(roomRef, {
      players: [...room.players, newPlayer],
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function togglePlayerReady(roomCode: string, playerId: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    const updatedPlayers = room.players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          isReady: !p.isReady,
        };
      }
      return p;
    });

    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToRoom(
  roomCode: string,
  onUpdate: (room: RoomState | null) => void
): Unsubscribe {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  return onSnapshot(
    doc(db, 'rooms', code),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as RoomState);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function startGame(roomCode: string, hostId: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (room.hostId !== hostId) {
      throw new Error('Chỉ Quản trò (Host) mới có quyền bắt đầu ván chơi.');
    }

    if (room.players.length < 1) {
      throw new Error('Cần có ít nhất 1 đội/người chơi tham gia để bắt đầu.');
    }

    const resetPlayers = room.players.map((p) => ({
      ...p,
      position: 1,
      score: 0,
      hintsRemaining: 2, // Reset to 2 hints per player
      completedLap: false,
      laps: 0,
    }));

    await updateDoc(roomRef, {
      status: 'playing',
      players: resetPlayers,
      currentPlayerIndex: 0,
      diceValue: null,
      isBonusRoll: false,
      bonusPlayerId: null,
      targetPosition: null,
      currentQuestion: null,
      usedQuestionKeys: [],
      winner: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 1. Roll Dice (Normal or Bonus)
export async function rollDice(roomCode: string, playerId: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer) return;

    // CASE A: BONUS ROLL
    if (room.status === 'bonus_roll' && room.isBonusRoll) {
      if (room.bonusPlayerId !== playerId) return;

      const diceValue = rollBonusDice();
      const oldPosition = currentPlayer.position || 1;
      let newPosition = oldPosition + diceValue;
      let willCompleteLap = currentPlayer.completedLap;
      let laps = currentPlayer.laps || 0;

      if (newPosition > 24) {
        newPosition = ((newPosition - 1) % 24) + 1;
        willCompleteLap = true;
        laps += 1;
      }

      const updatedPlayers = room.players.map((p) => {
        if (p.id === currentPlayer.id) {
          return {
            ...p,
            position: newPosition,
            completedLap: willCompleteLap,
            laps,
          };
        }
        return p;
      });

      // If bonus roll crosses finish line -> WINNER!
      if (willCompleteLap) {
        await updateDoc(roomRef, {
          status: 'finished',
          diceValue,
          isBonusRoll: false,
          bonusPlayerId: null,
          players: updatedPlayers,
          winner: {
            id: currentPlayer.id,
            name: currentPlayer.name,
            avatar: currentPlayer.avatar,
            color: currentPlayer.color,
            laps,
          },
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // Bonus roll finished -> End turn, advance to next player
      const nextPlayerIndex = (room.currentPlayerIndex + 1) % updatedPlayers.length;
      await updateDoc(roomRef, {
        status: 'playing',
        diceValue,
        isBonusRoll: false,
        bonusPlayerId: null,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: null,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // CASE B: NORMAL ROLL
    if (room.status !== 'playing') return;
    if (currentPlayer.id !== playerId) return;

    const diceValue = rollNormalDice();
    const oldPosition = currentPlayer.position || 1;
    let projectedTarget = oldPosition + diceValue;
    if (projectedTarget > 24) {
      projectedTarget = ((projectedTarget - 1) % 24) + 1;
    }

    // Determine question for target square
    const targetSquare = BOARD_SQUARES.find((sq) => sq.id === projectedTarget) || BOARD_SQUARES[0];
    const squareQuestions = targetSquare.questions;

    const usedKeys = new Set(room.usedQuestionKeys || []);
    let availableIndices = squareQuestions
      .map((_, idx) => idx)
      .filter((idx) => !usedKeys.has(`${projectedTarget}_${idx}`));

    if (availableIndices.length === 0) {
      availableIndices = squareQuestions.map((_, idx) => idx);
    }

    const selectedQuestionIdx =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const chosenQuestion = squareQuestions[selectedQuestionIdx];
    const newUsedKey = `${projectedTarget}_${selectedQuestionIdx}`;
    const nextUsedQuestionKeys = Array.from(new Set([...(room.usedQuestionKeys || []), newUsedKey]));

    const questionState: CurrentQuestionState = {
      squareId: targetSquare.id,
      questionIndex: selectedQuestionIdx,
      questionText: chosenQuestion.text,
      officialAnswer: chosenQuestion.answer,
      category: targetSquare.category,
      squareName: targetSquare.name,
      phase: 'active_answering',
      activePlayerId: currentPlayer.id,
      originalDiceValue: diceValue,
      targetPosition: projectedTarget,
      disqualifiedPlayerIds: [],
      playerAnswer: '',
      result: null,
      hint: chosenQuestion.hint || generateMaskedHint(chosenQuestion.answer),
      hintUsedByPlayerIds: [],
    };

    // Open question modal without moving pawn yet
    await updateDoc(roomRef, {
      status: 'question',
      diceValue,
      isBonusRoll: false,
      bonusPlayerId: null,
      targetPosition: projectedTarget,
      currentQuestion: questionState,
      usedQuestionKeys: nextUsedQuestionKeys,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 2. Submit Player Answer (Main Player or Stealing Opponent)
export async function submitPlayerAnswer(roomCode: string, answerText: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (!room.currentQuestion) return;

    await updateDoc(roomRef, {
      'currentQuestion.playerAnswer': answerText,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 3. Player Uses a Hint (Max 2 per game per player)
export async function usePlayerHint(roomCode: string, playerId: string): Promise<{ success: boolean; message?: string }> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return { success: false, message: 'Phòng không tồn tại' };

    const room = snap.data() as RoomState;
    if (!room.currentQuestion) return { success: false, message: 'Không có câu hỏi đang hoạt động' };

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex < 0) return { success: false, message: 'Người chơi không tồn tại' };

    const player = room.players[playerIndex];
    const hintsRemaining = player.hintsRemaining ?? 2;

    if (hintsRemaining <= 0) {
      return { success: false, message: 'Bạn đã dùng hết 2 lượt gợi ý của mình!' };
    }

    const updatedPlayers = [...room.players];
    updatedPlayers[playerIndex] = {
      ...player,
      hintsRemaining: hintsRemaining - 1,
    };

    const hintUsedByPlayerIds = Array.from(
      new Set([...(room.currentQuestion.hintUsedByPlayerIds || []), playerId])
    );

    await updateDoc(roomRef, {
      players: updatedPlayers,
      'currentQuestion.hintUsedByPlayerIds': hintUsedByPlayerIds,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { success: false };
  }
}

// 4. Host evaluates Main Active Player
export async function evaluateMainPlayer(
  roomCode: string,
  isCorrect: boolean,
  hostId: string
): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (room.hostId !== hostId) return;
    if (!room.currentQuestion) return;

    const activePlayer = room.players[room.currentPlayerIndex];
    if (!activePlayer) return;

    // IF CORRECT: Main player moves -> Gets Bonus Roll!
    if (isCorrect) {
      const diceVal = room.currentQuestion.originalDiceValue;
      const oldPos = activePlayer.position || 1;
      let newPos = oldPos + diceVal;
      let willCompleteLap = activePlayer.completedLap;
      let laps = activePlayer.laps || 0;

      if (newPos > 24) {
        newPos = ((newPos - 1) % 24) + 1;
        willCompleteLap = true;
        laps += 1;
      }

      const updatedPlayers = room.players.map((p) => {
        if (p.id === activePlayer.id) {
          return {
            ...p,
            position: newPos,
            completedLap: willCompleteLap,
            laps,
          };
        }
        return p;
      });

      // Win check
      if (willCompleteLap) {
        await updateDoc(roomRef, {
          status: 'finished',
          players: updatedPlayers,
          'currentQuestion.phase': 'resolved',
          'currentQuestion.result': 'correct',
          winner: {
            id: activePlayer.id,
            name: activePlayer.name,
            avatar: activePlayer.avatar,
            color: activePlayer.color,
            laps,
          },
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // Enter bonus roll state
      await updateDoc(roomRef, {
        status: 'bonus_roll',
        players: updatedPlayers,
        isBonusRoll: true,
        bonusPlayerId: activePlayer.id,
        'currentQuestion.phase': 'resolved',
        'currentQuestion.result': 'correct',
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // IF INCORRECT: Main player does NOT move. Question opened for steal!
    const otherPlayers = room.players.filter((p) => p.id !== activePlayer.id);

    if (otherPlayers.length === 0) {
      // No opponents available to steal -> Turn ends
      const nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
      await updateDoc(roomRef, {
        status: 'playing',
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: null,
        diceValue: null,
        isBonusRoll: false,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // Open stealing for opponents
    await updateDoc(roomRef, {
      'currentQuestion.phase': 'stealing_open',
      'currentQuestion.disqualifiedPlayerIds': [activePlayer.id],
      'currentQuestion.playerAnswer': '',
      'currentQuestion.stolenByPlayerId': null,
      'currentQuestion.stealStartTime': null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 5. Opponent Buzzes to Steal ("BẤM ĐỂ TRẢ LỜI")
export async function buzzToStealQuestion(roomCode: string, playerId: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (!room.currentQuestion) return;
    if (room.currentQuestion.phase !== 'stealing_open') return;

    // Check if disqualified or main player
    if (room.currentQuestion.disqualifiedPlayerIds?.includes(playerId)) return;
    if (room.currentQuestion.activePlayerId === playerId) return;

    // First buzz claims right to answer (10s timer)
    await updateDoc(roomRef, {
      'currentQuestion.phase': 'stealer_answering',
      'currentQuestion.stolenByPlayerId': playerId,
      'currentQuestion.stealStartTime': Date.now(),
      'currentQuestion.playerAnswer': '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 6. Host evaluates Stealing Opponent (or 10s Timer Expired)
export async function evaluateStealAnswer(
  roomCode: string,
  isCorrect: boolean,
  hostId: string
): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (room.hostId !== hostId) return;
    if (!room.currentQuestion) return;

    const stealerId = room.currentQuestion.stolenByPlayerId;
    if (!stealerId) return;

    const stealer = room.players.find((p) => p.id === stealerId);

    // IF STEAL CORRECT: Stealer moves original diceValue steps (No bonus roll) -> Turn ends
    if (isCorrect && stealer) {
      const diceVal = room.currentQuestion.originalDiceValue;
      const oldPos = stealer.position || 1;
      let newPos = oldPos + diceVal;
      let willCompleteLap = stealer.completedLap;
      let laps = stealer.laps || 0;

      if (newPos > 24) {
        newPos = ((newPos - 1) % 24) + 1;
        willCompleteLap = true;
        laps += 1;
      }

      const updatedPlayers = room.players.map((p) => {
        if (p.id === stealer.id) {
          return {
            ...p,
            position: newPos,
            completedLap: willCompleteLap,
            laps,
          };
        }
        return p;
      });

      // Win check for stealer
      if (willCompleteLap) {
        await updateDoc(roomRef, {
          status: 'finished',
          players: updatedPlayers,
          'currentQuestion.phase': 'resolved',
          'currentQuestion.result': 'correct',
          winner: {
            id: stealer.id,
            name: stealer.name,
            avatar: stealer.avatar,
            color: stealer.color,
            laps,
          },
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // Stealer does NOT get bonus roll -> Advance to next player
      const nextPlayerIndex = (room.currentPlayerIndex + 1) % updatedPlayers.length;
      await updateDoc(roomRef, {
        status: 'playing',
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: null,
        diceValue: null,
        isBonusRoll: false,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // IF STEAL INCORRECT OR TIMEOUT: Disqualify this stealer
    const nextDisqualified = Array.from(
      new Set([...(room.currentQuestion.disqualifiedPlayerIds || []), stealerId])
    );

    // Check if any opponents remain who haven't attempted steal
    const eligibleOpponents = room.players.filter(
      (p) => !nextDisqualified.includes(p.id) && p.id !== room.currentQuestion?.activePlayerId
    );

    if (eligibleOpponents.length > 0) {
      // Re-open buzzing for remaining opponents!
      await updateDoc(roomRef, {
        'currentQuestion.phase': 'stealing_open',
        'currentQuestion.disqualifiedPlayerIds': nextDisqualified,
        'currentQuestion.stolenByPlayerId': null,
        'currentQuestion.stealStartTime': null,
        'currentQuestion.playerAnswer': '',
        updatedAt: serverTimestamp(),
      });
    } else {
      // All opponents failed or disqualified -> Nobody moves -> Turn ends
      const nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
      await updateDoc(roomRef, {
        status: 'playing',
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: null,
        diceValue: null,
        isBonusRoll: false,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function restartGame(roomCode: string, hostId: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (room.hostId !== hostId) return;

    const resetPlayers = room.players.map((p) => ({
      ...p,
      position: 1,
      score: 0,
      hintsRemaining: 2, // Reset hints
      completedLap: false,
      laps: 0,
    }));

    await updateDoc(roomRef, {
      status: 'playing',
      players: resetPlayers,
      currentPlayerIndex: 0,
      diceValue: null,
      isBonusRoll: false,
      bonusPlayerId: null,
      targetPosition: null,
      currentQuestion: null,
      usedQuestionKeys: [],
      winner: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function leaveRoom(roomCode: string, playerId: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    const remainingPlayers = room.players.filter((p) => p.id !== playerId);

    if (remainingPlayers.length === 0 && room.hostId === playerId) {
      return;
    }

    const updates: Partial<RoomState> = {
      players: remainingPlayers,
      updatedAt: serverTimestamp(),
    };

    if (room.currentPlayerIndex >= remainingPlayers.length && remainingPlayers.length > 0) {
      updates.currentPlayerIndex = 0;
    }

    await updateDoc(roomRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
