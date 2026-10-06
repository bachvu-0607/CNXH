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
import { BOARD_SQUARES, TIE_BREAK_QUESTIONS } from '../questions/boardData';

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
      score: 0,
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
    targetPosition: null,
    currentQuestion: null,
    usedQuestionKeys: [],
    winner: null,
    isTieBreak: false,
    tieBreakQuestion: null,
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
      // Reconnecting existing player
      const updatedPlayers = [...room.players];
      updatedPlayers[existingPlayerIndex] = {
        ...updatedPlayers[existingPlayerIndex],
        name: playerName.trim() || updatedPlayers[existingPlayerIndex].name,
        connected: true,
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
      completedLap: false,
      laps: 0,
    }));

    await updateDoc(roomRef, {
      status: 'playing',
      players: resetPlayers,
      currentPlayerIndex: 0,
      diceValue: null,
      targetPosition: null,
      currentQuestion: null,
      usedQuestionKeys: [],
      winner: null,
      isTieBreak: false,
      tieBreakQuestion: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

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

    // Allow roll if caller is the active player OR if caller is the Host (Moderator can roll on behalf of active player in classroom)
    const canRollThisTurn = currentPlayer.id === playerId || room.hostId === playerId;
    if (!canRollThisTurn) {
      console.warn('Chưa tới lượt của bạn.');
      return;
    }

    if (room.status !== 'playing') {
      return;
    }

    // Roll dice 1-6
    const diceValue = Math.floor(Math.random() * 6) + 1;
    const oldPosition = currentPlayer.position || 1;
    let newPosition = oldPosition + diceValue;
    let completedLap = currentPlayer.completedLap;
    let laps = currentPlayer.laps || 0;

    if (newPosition > 24) {
      newPosition = ((newPosition - 1) % 24) + 1;
      completedLap = true;
      laps += 1;
    }

    // Determine question for target square
    const targetSquare = BOARD_SQUARES.find((sq) => sq.id === newPosition) || BOARD_SQUARES[0];
    const squareQuestions = targetSquare.questions;

    // Filter available questions not used yet
    const usedKeys = new Set(room.usedQuestionKeys || []);
    let availableIndices = squareQuestions
      .map((_, idx) => idx)
      .filter((idx) => !usedKeys.has(`${newPosition}_${idx}`));

    if (availableIndices.length === 0) {
      availableIndices = squareQuestions.map((_, idx) => idx);
    }

    const selectedQuestionIdx =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const chosenQuestion = squareQuestions[selectedQuestionIdx];
    const newUsedKey = `${newPosition}_${selectedQuestionIdx}`;
    const nextUsedQuestionKeys = Array.from(new Set([...(room.usedQuestionKeys || []), newUsedKey]));

    const questionState: CurrentQuestionState = {
      squareId: targetSquare.id,
      questionIndex: selectedQuestionIdx,
      questionText: chosenQuestion.text,
      officialAnswer: chosenQuestion.answer,
      category: targetSquare.category,
      squareName: targetSquare.name,
      points: targetSquare.category === 'scenario' ? 2 : 1,
      status: 'pending',
      result: null,
    };

    // First update status to rolling/moving
    await updateDoc(roomRef, {
      status: 'rolling',
      diceValue,
      targetPosition: newPosition,
      currentQuestion: questionState,
      usedQuestionKeys: nextUsedQuestionKeys,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function finishPawnMove(roomCode: string): Promise<void> {
  const code = roomCode.trim().toUpperCase();
  const path = `rooms/${code}`;

  try {
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as RoomState;
    if (room.status !== 'rolling' && room.status !== 'moving') return;

    const targetPos = room.targetPosition ?? 1;
    const updatedPlayers = room.players.map((p, idx) => {
      if (idx === room.currentPlayerIndex) {
        const oldPos = p.position || 1;
        const willCompleteLap = p.completedLap || (oldPos > targetPos && room.diceValue !== null);
        return {
          ...p,
          position: targetPos,
          completedLap: willCompleteLap,
          laps: willCompleteLap ? (p.laps || 0) + 1 : p.laps,
        };
      }
      return p;
    });

    await updateDoc(roomRef, {
      status: 'evaluating',
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

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
      'currentQuestion.status': 'submitted',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function evaluateAnswer(
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
    if (room.hostId !== hostId) {
      throw new Error('Chỉ Quản trò (Host) mới có quyền chấm điểm.');
    }

    if (!room.currentQuestion) return;

    const pointsToAdd = isCorrect ? room.currentQuestion.points : 0;
    const activeIndex = room.currentPlayerIndex;

    const updatedPlayers = room.players.map((p, idx) => {
      if (idx === activeIndex) {
        return {
          ...p,
          score: Math.max(0, (p.score || 0) + pointsToAdd),
        };
      }
      return p;
    });

    // Check if anyone completed a lap to finish the game
    const hasAnyPlayerCompletedLap = updatedPlayers.some((p) => p.completedLap || (p.laps && p.laps >= 1));

    if (hasAnyPlayerCompletedLap) {
      const sortedByScore = [...updatedPlayers].sort((a, b) => b.score - a.score);
      const highestScore = sortedByScore[0]?.score || 0;
      const topPlayers = sortedByScore.filter((p) => p.score === highestScore);

      if (topPlayers.length > 1 && updatedPlayers.length > 1) {
        // Tie break
        const randomTieQ =
          TIE_BREAK_QUESTIONS[Math.floor(Math.random() * TIE_BREAK_QUESTIONS.length)];
        await updateDoc(roomRef, {
          players: updatedPlayers,
          'currentQuestion.status': 'resolved',
          'currentQuestion.result': isCorrect ? 'correct' : 'incorrect',
          'currentQuestion.awardedPoints': pointsToAdd,
          isTieBreak: true,
          tieBreakQuestion: {
            text: randomTieQ.text,
            answer: randomTieQ.answer,
            tiedPlayerIds: topPlayers.map((p) => p.id),
          },
          updatedAt: serverTimestamp(),
        });
        return;
      } else {
        const winner = sortedByScore[0];
        await updateDoc(roomRef, {
          players: updatedPlayers,
          status: 'finished',
          'currentQuestion.status': 'resolved',
          'currentQuestion.result': isCorrect ? 'correct' : 'incorrect',
          'currentQuestion.awardedPoints': pointsToAdd,
          winner: {
            id: winner.id,
            name: winner.name,
            score: winner.score,
            avatar: winner.avatar,
            color: winner.color,
          },
          updatedAt: serverTimestamp(),
        });
        return;
      }
    }

    // Next turn
    const nextPlayerIndex = (activeIndex + 1) % updatedPlayers.length;

    await updateDoc(roomRef, {
      players: updatedPlayers,
      status: 'playing',
      currentPlayerIndex: nextPlayerIndex,
      diceValue: null,
      targetPosition: null,
      'currentQuestion.status': 'resolved',
      'currentQuestion.result': isCorrect ? 'correct' : 'incorrect',
      'currentQuestion.awardedPoints': pointsToAdd,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function resolveTieBreakWinner(
  roomCode: string,
  winnerId: string,
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

    const winner = room.players.find((p) => p.id === winnerId);
    if (!winner) return;

    await updateDoc(roomRef, {
      status: 'finished',
      isTieBreak: false,
      winner: {
        id: winner.id,
        name: winner.name,
        score: winner.score + 1,
        avatar: winner.avatar,
        color: winner.color,
      },
      updatedAt: serverTimestamp(),
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
      score: 0,
      completedLap: false,
      laps: 0,
    }));

    await updateDoc(roomRef, {
      status: 'playing',
      players: resetPlayers,
      currentPlayerIndex: 0,
      diceValue: null,
      targetPosition: null,
      currentQuestion: null,
      usedQuestionKeys: [],
      winner: null,
      isTieBreak: false,
      tieBreakQuestion: null,
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
