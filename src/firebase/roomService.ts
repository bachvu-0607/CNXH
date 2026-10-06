import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  getDocFromServer,
  runTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './error';
import { RoomState, Player, CurrentQuestionState } from '../types/game';
import { BOARD_SQUARES } from '../questions/boardData';
import { isAnswerCorrect } from '../utils/answerChecker';

export const PLAYER_COLORS = [
  { color: '#BE123C', name: 'Đỏ', avatar: '🔴' },
  { color: '#1D4ED8', name: 'Xanh dương', avatar: '🔵' },
  { color: '#047857', name: 'Xanh lá', avatar: '🟢' },
  { color: '#D97706', name: 'Vàng cam', avatar: '🟡' },
  { color: '#7C3AED', name: 'Tím', avatar: '🟣' },
  { color: '#0D9488', name: 'Xanh ngọc', avatar: '💎' },
  { color: '#DB2777', name: 'Hồng', avatar: '🌸' },
  { color: '#4F46E5', name: 'Chàm', avatar: '🔮' },
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
  _hostIsPlayer: boolean = false
): Promise<string> {
  const roomCode = generateRoomCode();
  const path = `rooms/${roomCode}`;

  // Quản trò luôn luôn chỉ quan sát & điều phối, không tham gia chơi
  const players: Player[] = [];

  const roomData: any = {
    roomCode,
    hostId,
    hostName: hostName.trim() || 'Thầy/Cô Quản Trò',
    hostIsPlayer: false,
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
  const roomRef = doc(db, 'rooms', code);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);

      if (!snap.exists()) {
        return { success: false, message: 'Phòng không tồn tại. Vui lòng kiểm tra lại mã phòng.' };
      }

      const room = snap.data() as RoomState;

      // Quản trò không được tham gia thi đấu
      if (playerId === room.hostId) {
        return {
          success: false,
          message: 'Bạn là Quản trò của phòng này. Quản trò chỉ theo dõi và điều phối, không được tham gia chơi.',
        };
      }

      const existingPlayerIndex = room.players.findIndex((p) => p.id === playerId);

      if (existingPlayerIndex >= 0) {
        const updatedPlayers = [...room.players];
        updatedPlayers[existingPlayerIndex] = {
          ...updatedPlayers[existingPlayerIndex],
          name: playerName.trim() || updatedPlayers[existingPlayerIndex].name,
          connected: true,
        };

        transaction.update(roomRef, {
          players: updatedPlayers,
          updatedAt: serverTimestamp(),
        });
        return { success: true };
      }

      if (room.status !== 'lobby') {
        return { success: false, message: 'Trò chơi đã bắt đầu, không thể tham gia.' };
      }

      if (room.players.length >= 7) {
        return { success: false, message: 'Phòng đã đủ tối đa 7 người chơi.' };
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
        isReady: false,
        connected: true,
        completedLap: false,
        laps: 0,
        joinedAt: Date.now(),
      };

      transaction.update(roomRef, {
        players: [...room.players, newPlayer],
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { success: false, message: 'Lỗi tham gia phòng.' };
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
  const roomRef = doc(db, 'rooms', code);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
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
          transaction.update(roomRef, {
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

        // Bonus roll rolling: Show dice result first before advancing
        transaction.update(roomRef, {
          status: 'moving',
          diceValue,
          isBonusRoll: true,
          bonusPlayerId: playerId,
          players: updatedPlayers,
          targetPosition: newPosition,
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

      const allAcceptedAnswers = Array.from(
        new Set([
          chosenQuestion.answer,
          ...(chosenQuestion.acceptedAnswers || []),
          ...(chosenQuestion.keyword ? [chosenQuestion.keyword, chosenQuestion.keyword.replace(/;/g, ' '), chosenQuestion.keyword.replace(/;/g, ',')] : []),
        ])
      );

      const questionState: CurrentQuestionState = {
        squareId: targetSquare.id,
        questionIndex: selectedQuestionIdx,
        questionText: chosenQuestion.text,
        officialAnswer: chosenQuestion.answer,
        answerTemplate: chosenQuestion.answerTemplate,
        keyword: chosenQuestion.keyword,
        acceptedAnswers: allAcceptedAnswers,
        category: targetSquare.category,
        squareName: targetSquare.name,
        phase: 'active_answering',
        activePlayerId: currentPlayer.id,
        originalDiceValue: diceValue,
        targetPosition: projectedTarget,
        stolenByPlayerId: null,
        stealStartTime: null,
        questionStartTime: null,
        resultWinnerId: null,
        disqualifiedPlayerIds: [],
        playerAnswer: '',
        result: null,
        hint: chosenQuestion.hint || 'Chưa có gợi ý cho câu hỏi này.',
        hintUsedByPlayerIds: [],
      };

      // Set status: 'moving' so dice roll animation & target show on board with "Mở câu hỏi" button
      transaction.update(roomRef, {
        status: 'moving',
        diceValue,
        isBonusRoll: false,
        bonusPlayerId: null,
        targetPosition: projectedTarget,
        currentQuestion: questionState,
        usedQuestionKeys: nextUsedQuestionKeys,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 1b. Open Question Modal when active player clicks "Mở câu hỏi"
export async function openQuestionModal(roomCode: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', code);
  try {
    await updateDoc(roomRef, {
      status: 'question',
      'currentQuestion.questionStartTime': Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('openQuestionModal error:', error);
  }
}

// 1c. Finish Bonus Roll and Advance Turn to Next Player
export async function finishBonusRoll(roomCode: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', code);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as RoomState;
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (!currentPlayer) return;

      // Check win condition
      if (currentPlayer.completedLap) {
        transaction.update(roomRef, {
          status: 'finished',
          isBonusRoll: false,
          bonusPlayerId: null,
          winner: {
            id: currentPlayer.id,
            name: currentPlayer.name,
            avatar: currentPlayer.avatar,
            color: currentPlayer.color,
            laps: currentPlayer.laps || 1,
          },
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // Advance turn to next player
      const nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
      transaction.update(roomRef, {
        status: 'playing',
        currentPlayerIndex: nextPlayerIndex,
        isBonusRoll: false,
        bonusPlayerId: null,
        diceValue: null,
        targetPosition: null,
        currentQuestion: null,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('finishBonusRoll error:', error);
  }
}

// 2. Submit Player Answer (Automatic Evaluation based on acceptedAnswers)
export async function submitPlayerAnswer(
  roomCode: string,
  answerText: string,
  submittingPlayerId?: string
): Promise<{ success: boolean; isCorrect: boolean }> {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', code);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return { success: false, isCorrect: false };

      const room = snap.data() as RoomState;
      if (!room.currentQuestion) return { success: false, isCorrect: false };

      const q = room.currentQuestion;

      // Check correctness using smart Vietnamese keyword matching
      const isCorrect = isAnswerCorrect(
        answerText,
        q.officialAnswer,
        q.acceptedAnswers
      );

      // CASE 1: Main active player is answering (60s timer)
      if (q.phase === 'active_answering') {
        if (isCorrect) {
          transaction.update(roomRef, {
            'currentQuestion.phase': 'showing_result',
            'currentQuestion.result': 'correct',
            'currentQuestion.resultWinnerId': submittingPlayerId || q.activePlayerId,
            'currentQuestion.playerAnswer': answerText,
            updatedAt: serverTimestamp(),
          });
        } else {
          // If incorrect and opponents exist -> open buzz for opponents!
          const opponents = room.players.filter((p) => p.id !== q.activePlayerId);
          if (opponents.length > 0) {
            transaction.update(roomRef, {
              'currentQuestion.phase': 'stealing_open',
              'currentQuestion.playerAnswer': answerText,
              'currentQuestion.stealStartTime': Date.now(),
              updatedAt: serverTimestamp(),
            });
          } else {
            transaction.update(roomRef, {
              'currentQuestion.phase': 'showing_result',
              'currentQuestion.result': 'incorrect',
              'currentQuestion.playerAnswer': answerText,
              updatedAt: serverTimestamp(),
            });
          }
        }
        return { success: true, isCorrect };
      }

      // CASE 2: Stealer is answering (30s timer)
      if (q.phase === 'stealer_answering') {
        if (isCorrect) {
          // Correct! Stealer gets +originalDiceValue
          const originalDice = q.originalDiceValue || 1;
          const stealerIndex = room.players.findIndex(
            (p) => p.id === (submittingPlayerId || q.stolenByPlayerId)
          );

          let updatedPlayers = [...room.players];
          if (stealerIndex >= 0) {
            const stealer = room.players[stealerIndex];
            const oldPos = stealer.position || 1;
            let newPos = oldPos + originalDice;
            let willCompleteLap = stealer.completedLap;
            let laps = stealer.laps || 0;
            if (newPos > 24) {
              newPos = ((newPos - 1) % 24) + 1;
              willCompleteLap = true;
              laps += 1;
            }
            updatedPlayers[stealerIndex] = {
              ...stealer,
              position: newPos,
              completedLap: willCompleteLap,
              laps,
            };
          }

          transaction.update(roomRef, {
            'currentQuestion.phase': 'showing_result',
            'currentQuestion.result': 'correct',
            'currentQuestion.resultWinnerId': submittingPlayerId || q.stolenByPlayerId,
            'currentQuestion.playerAnswer': answerText,
            players: updatedPlayers,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Stealer incorrect -> question ends!
          transaction.update(roomRef, {
            'currentQuestion.phase': 'showing_result',
            'currentQuestion.result': 'incorrect',
            'currentQuestion.playerAnswer': answerText,
            updatedAt: serverTimestamp(),
          });
        }
        return { success: true, isCorrect };
      }

      return { success: true, isCorrect };
    });

    return result;
  } catch (error) {
    console.error('submitPlayerAnswer error:', error);
    return { success: false, isCorrect: false };
  }
}

// 2b. Handle Main Player 60s Timeout (Opens buzzing if opponents exist)
export async function handleMainPlayerTimeout(roomCode: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', code);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as RoomState;
      if (!room.currentQuestion || room.currentQuestion.phase !== 'active_answering') return;

      const q = room.currentQuestion;
      const opponents = room.players.filter((p) => p.id !== q.activePlayerId);

      if (opponents.length > 0) {
        transaction.update(roomRef, {
          'currentQuestion.phase': 'stealing_open',
          'currentQuestion.playerAnswer': '(Hết thời gian 60s)',
          'currentQuestion.stealStartTime': Date.now(),
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.update(roomRef, {
          'currentQuestion.phase': 'showing_result',
          'currentQuestion.result': 'incorrect',
          'currentQuestion.playerAnswer': '(Hết thời gian 60s)',
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    console.error('handleMainPlayerTimeout error:', error);
  }
}

// 2c. Close Question Modal and Advance Game (Atomic Transaction)
export async function closeQuestionAndAdvance(roomCode: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', code);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;

      const room = snap.data() as RoomState;
      if (!room.currentQuestion) return;

      const q = room.currentQuestion;
      const activePlayer =
        room.players.find((p) => p.id === q.activePlayerId) ||
        room.players[room.currentPlayerIndex];

      if (!activePlayer) {
        transaction.update(roomRef, {
          status: 'playing',
          currentQuestion: null,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // CASE A: Active player answered correctly -> advance pawn to targetPosition & give bonus roll!
      if (q.result === 'correct' && q.resultWinnerId === activePlayer.id) {
        const targetPos = q.targetPosition || activePlayer.position || 1;
        const willCompleteLap = activePlayer.completedLap || targetPos < (activePlayer.position || 1);
        let laps = activePlayer.laps || 0;
        if (targetPos < (activePlayer.position || 1)) {
          laps += 1;
        }

        const updatedPlayers = room.players.map((p) => {
          if (p.id === activePlayer.id) {
            return {
              ...p,
              position: targetPos,
              completedLap: willCompleteLap,
              laps,
            };
          }
          return p;
        });

        // Win condition: completed lap
        if (willCompleteLap) {
          transaction.update(roomRef, {
            status: 'finished',
            players: updatedPlayers,
            currentQuestion: null,
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

        // Correct answer -> Move to bonus roll!
        transaction.update(roomRef, {
          status: 'bonus_roll',
          players: updatedPlayers,
          isBonusRoll: true,
          bonusPlayerId: activePlayer.id,
          currentQuestion: null,
          diceValue: null,
          targetPosition: null,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // CASE B: Stealer answered correctly -> Stealer already got +originalDiceValue in players!
      if (q.result === 'correct' && q.resultWinnerId && q.resultWinnerId !== activePlayer.id) {
        const winningPlayer = room.players.find((p) => p.id === q.resultWinnerId);
        if (winningPlayer && winningPlayer.completedLap) {
          transaction.update(roomRef, {
            status: 'finished',
            currentQuestion: null,
            winner: {
              id: winningPlayer.id,
              name: winningPlayer.name,
              avatar: winningPlayer.avatar,
              color: winningPlayer.color,
              laps: winningPlayer.laps || 1,
            },
            updatedAt: serverTimestamp(),
          });
          return;
        }

        // Regular turn rotation to next player
        const nextPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        transaction.update(roomRef, {
          status: 'playing',
          currentPlayerIndex: nextPlayerIndex,
          currentQuestion: null,
          diceValue: null,
          targetPosition: null,
          isBonusRoll: false,
          bonusPlayerId: null,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // CASE C: Nobody got it right (Incorrect / Timeout)
      // Active player does not advance (stays at original position). Next player's turn!
      const nextPlayerIndex =
        room.players.length > 0
          ? (room.currentPlayerIndex + 1) % room.players.length
          : 0;
      transaction.update(roomRef, {
        status: 'playing',
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: null,
        diceValue: null,
        targetPosition: null,
        isBonusRoll: false,
        bonusPlayerId: null,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('closeQuestionAndAdvance error:', error);
  }
}

// 2d. Allow Host to Join as Player in Lobby
export async function addHostAsPlayer(
  roomCode: string,
  hostId: string,
  hostName: string
): Promise<boolean> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;
  const roomRef = doc(db, 'rooms', code);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return false;

      const room = snap.data() as RoomState;
      if (room.players.some((p) => p.id === hostId)) return true;
      if (room.players.length >= 7) return false;

      const colorConfig = PLAYER_COLORS[room.players.length] || PLAYER_COLORS[0];
      const newPlayer: Player = {
        id: hostId,
        name: hostName.trim() || `Quản trò (${room.players.length + 1})`,
        color: colorConfig.color,
        colorName: colorConfig.name,
        avatar: colorConfig.avatar,
        position: 1,
        hintsRemaining: 2,
        isReady: true,
        connected: true,
        completedLap: false,
        laps: 0,
        joinedAt: Date.now(),
      };

      transaction.update(roomRef, {
        players: [...room.players, newPlayer],
        hostIsPlayer: true,
        updatedAt: serverTimestamp(),
      });
      return true;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

// 3. Player Uses a Hint (Max 2 per game per player, atomic via transaction)
export async function usePlayerHint(
  roomCode: string,
  playerId: string
): Promise<{ success: boolean; message?: string }> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;
  const roomRef = doc(db, 'rooms', code);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return { success: false, message: 'Phòng không tồn tại' };

      const room = snap.data() as RoomState;
      if (!room.currentQuestion) return { success: false, message: 'Không có câu hỏi đang hoạt động' };

      const playerIndex = room.players.findIndex((p) => p.id === playerId);
      if (playerIndex < 0) return { success: false, message: 'Người chơi không tồn tại' };

      const player = room.players[playerIndex];
      const hintsRemaining = player.hintsRemaining ?? 2;

      // Check if already used for this question
      if (room.currentQuestion.hintUsedByPlayerIds?.includes(playerId)) {
        return { success: true };
      }

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

      transaction.update(roomRef, {
        players: updatedPlayers,
        'currentQuestion.hintUsedByPlayerIds': hintUsedByPlayerIds,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { success: false };
  }
}

// 4. Opponent Buzzes to Steal ("BẤM ĐỂ TRẢ LỜI" - Atomic Race-Condition Safe)
export async function buzzToStealQuestion(
  roomCode: string,
  playerId: string
): Promise<{ success: boolean }> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;
  const roomRef = doc(db, 'rooms', code);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return { success: false };

      const room = snap.data() as RoomState;
      if (!room.currentQuestion) return { success: false };
      if (room.currentQuestion.phase !== 'stealing_open') return { success: false };

      // Validate eligibility
      if (room.currentQuestion.disqualifiedPlayerIds?.includes(playerId)) return { success: false };
      if (room.currentQuestion.activePlayerId === playerId) return { success: false };
      if (room.currentQuestion.stolenByPlayerId != null) return { success: false };

      // Winner of the buzz transaction claims right to answer with 10s timer
      transaction.update(roomRef, {
        'currentQuestion.phase': 'stealer_answering',
        'currentQuestion.stolenByPlayerId': playerId,
        'currentQuestion.stealStartTime': Date.now(),
        'currentQuestion.playerAnswer': '',
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { success: false };
  }
}

// 5. Handle Steal 30s Timeout (Ends question on timeout as specified)
export async function handleStealTimeout(
  roomCode: string,
  stealerId: string
): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;
  const roomRef = doc(db, 'rooms', code);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;

      const room = snap.data() as RoomState;
      if (!room.currentQuestion) return;
      if (room.currentQuestion.phase !== 'stealer_answering') return;
      if (room.currentQuestion.stolenByPlayerId !== stealerId) return;

      const startTs = room.currentQuestion.stealStartTime;
      if (!startTs || Date.now() - startTs < 29000) return;

      // Stealer timeout (30s) -> end question with incorrect result
      transaction.update(roomRef, {
        'currentQuestion.phase': 'showing_result',
        'currentQuestion.result': 'incorrect',
        'currentQuestion.playerAnswer': '(Hết thời gian 30s)',
        updatedAt: serverTimestamp(),
      });
    });
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
