import type { RoomState, Player, QuestionPhase } from '../types/game';
import { BOARD_SQUARES } from '../questions/boardData';
import { isAnswerCorrect } from '../utils/answerChecker';

export const MAX_PLAYERS = 7;
export const MAIN_ANSWER_MS = 60_000;
export const STEAL_ANSWER_MS = 30_000;
export const BUZZ_WINDOW_MS = 12_000;
export const RESULT_MS = 3_000;
export const PLAYER_COLORS = [
  { color: '#BE123C', name: 'Đỏ', avatar: '🔴' },
  { color: '#1D4ED8', name: 'Xanh dương', avatar: '🔵' },
  { color: '#047857', name: 'Xanh lá', avatar: '🟢' },
  { color: '#D97706', name: 'Vàng cam', avatar: '🟡' },
  { color: '#7C3AED', name: 'Tím', avatar: '🟣' },
  { color: '#0D9488', name: 'Xanh ngọc', avatar: '💎' },
  { color: '#DB2777', name: 'Hồng', avatar: '🌸' },
];

type TurnAction = { turnId: string } & (
  | { type: 'roll' | 'open' | 'finish_bonus' | 'buzz' | 'hint' | 'skip' }
  | { type: 'answer'; answer: string; phase: QuestionPhase }
  | { type: 'timeout' | 'close'; phase: QuestionPhase }
);
export type GameAction = TurnAction
  | { type: 'join'; name: string }
  | { type: 'ready'; ready: boolean }
  | { type: 'start' | 'restart' | 'leave' };
export interface ActionResult { success: boolean; room?: RoomState; isCorrect?: boolean; message?: string }
type Context = { now: number; random: () => number; newId: () => string };

export function rollNormalDice(random = Math.random): number {
  const r = random();
  return r < .15 ? 1 : r < .40 ? 2 : r < .65 ? 3 : r < .80 ? 4 : r < .90 ? 5 : 6;
}
export function rollBonusDice(random = Math.random): number {
  const r = random();
  return r < .075 ? 1 : r < .175 ? 2 : r < .275 ? 3 : r < .4 ? 4 : r < .7 ? 5 : 6;
}

// The transaction adapter calls this reducer again on every Firestore retry.
// Every turn-scoped command carries the turn observed by its originating client.
export function applyGameAction(source: RoomState, actorId: string, action: GameAction,
  context: Context = { now: Date.now(), random: Math.random, newId: () => crypto.randomUUID() },
): ActionResult {
  const { now, random, newId } = context;
  const reject = (message = 'Lượt chơi đã thay đổi hoặc bạn không có quyền thực hiện thao tác này.'): ActionResult => ({ success: false, message });
  const host = actorId === source.hostId;
  const member = source.players.some(p => p.id === actorId);
  if (!actorId || (!host && !member && action.type !== 'join')) return reject();
  if ('turnId' in action && action.turnId !== (source.turnId || 'legacy')) return reject();
  const room: RoomState = { ...source, players: source.players.map(p => ({ ...p })),
    currentQuestion: source.currentQuestion ? { ...source.currentQuestion } : null,
    turnId: source.turnId || 'legacy' };
  const active = room.players[room.currentPlayerIndex];
  const q = room.currentQuestion;
  const success = (isCorrect?: boolean): ActionResult => {
    room.playerIds = room.players.map(p => p.id);
    room.lastAction = { type: action.type, actorId };
    return { success: true, room, ...(isCorrect === undefined ? {} : { isCorrect }) };
  };
  const clearTurn = (index: number) => {
    room.currentPlayerIndex = index;
    room.turnId = newId();
    room.status = room.players.length ? 'playing' : 'lobby';
    room.diceValue = null;
    room.isBonusRoll = false;
    room.bonusPlayerId = null;
    room.targetPosition = null;
    room.currentQuestion = null;
  };
  const nextTurn = () => clearTurn((room.currentPlayerIndex + 1) % (room.players.length || 1));
  const finish = (player: Player) => {
    room.status = 'finished';
    room.currentQuestion = null;
    room.isBonusRoll = false;
    room.bonusPlayerId = null;
    room.targetPosition = null;
    room.winner = { id: player.id, name: player.name, avatar: player.avatar,
      color: player.color, laps: player.laps };
  };
  const move = (player: Player, steps: number) => {
    const total = player.position + steps;
    player.position = ((total - 1) % 24) + 1;
    if (total > 24) { player.completedLap = true; player.laps += 1; }
  };
  const result = (correct: boolean, answer: string, winner: string | null = null) => {
    q!.phase = 'showing_result';
    q!.phaseStartedAt = now;
    q!.result = correct ? 'correct' : 'incorrect';
    q!.resultWinnerId = winner;
    q!.playerAnswer = answer;
  };
  const failMain = (answer: string) => {
    if (room.players.some(p => p.id !== q!.activePlayerId)) {
      q!.phase = 'stealing_open';
      q!.phaseStartedAt = now;
      q!.stealStartTime = now;
      q!.playerAnswer = answer;
    } else result(false, answer);
  };

  if (action.type === 'join') {
    if (host) return reject('Quản trò chỉ theo dõi, không tham gia chơi.');
    if (member) {
      const player = room.players.find(p => p.id === actorId)!;
      player.name = action.name.trim().slice(0, 60) || player.name;
      player.connected = true;
      return success();
    }
    if (room.status !== 'lobby') return reject('Trò chơi đã bắt đầu, không thể tham gia.');
    if (room.players.length >= MAX_PLAYERS) return reject('Phòng đã đủ tối đa 7 người chơi.');
    const color = PLAYER_COLORS.find(c => !room.players.some(p => p.color === c.color))!;
    room.players.push({ id: actorId, name: action.name.trim().slice(0, 60) || `Đội ${room.players.length + 1}`,
      color: color.color, colorName: color.name, avatar: color.avatar, position: 1,
      hintsRemaining: 2, isReady: false, connected: true, completedLap: false, laps: 0, joinedAt: now });
    return success();
  }
  if (action.type === 'ready') {
    if (!member || room.status !== 'lobby') return reject();
    room.players.find(p => p.id === actorId)!.isReady = action.ready;
    return success();
  }
  if (action.type === 'start' || action.type === 'restart') {
    if (!host || (action.type === 'start' ? room.status !== 'lobby' : room.status !== 'finished')) return reject();
    if (!room.players.length) return reject('Cần ít nhất 1 người chơi để bắt đầu.');
    room.players.forEach(p => Object.assign(p, { position: 1, hintsRemaining: 2, completedLap: false, laps: 0, isReady: false }));
    room.usedQuestionKeys = [];
    room.winner = null;
    clearTurn(0);
    return success();
  }
  if (action.type === 'leave') {
    // The host is an observer and can return with the same saved guest identity.
    if (!member) return { success: true };
    const index = room.players.findIndex(p => p.id === actorId);
    const departed = room.players[index];
    room.players.splice(index, 1);
    if (room.status === 'lobby' || room.status === 'finished') {
      room.currentPlayerIndex = Math.max(0, room.players.findIndex(p => p.id === active?.id));
      return success();
    }
    if (!room.players.length) { clearTurn(0); room.winner = null; return success(); }
    if (active?.id === departed.id) {
      // Removing index i shifts the old successor into index i (or wraps to zero).
      clearTurn(index % room.players.length);
    } else {
      room.currentPlayerIndex = room.players.findIndex(p => p.id === active?.id);
      if (q?.stolenByPlayerId === actorId || q?.resultWinnerId === actorId) {
        result(false, '(Người cướp quyền đã rời phòng)');
        q.stolenByPlayerId = null;
      } else if (q?.phase === 'stealing_open' && room.players.length === 1) {
        result(false, q.playerAnswer || '(Không còn người cướp quyền)');
      }
    }
    return success();
  }
  if (!active || room.status === 'lobby' || room.status === 'finished') return reject();
  if (action.type === 'skip') {
    if (!host || !['playing', 'moving', 'bonus_roll'].includes(room.status)) return reject();
    nextTurn();
    return success();
  }
  if (action.type === 'roll') {
    if (!member || active.id !== actorId) return reject();
    if (room.status === 'bonus_roll' && room.isBonusRoll && room.bonusPlayerId === actorId) {
      const dice = rollBonusDice(random);
      move(active, dice);
      room.diceValue = dice;
      room.targetPosition = active.position;
      room.status = 'moving';
      if (active.completedLap) finish(active);
      return success();
    }
    if (room.status !== 'playing') return reject();
    const dice = rollNormalDice(random);
    const target = ((active.position + dice - 1) % 24) + 1;
    const square = BOARD_SQUARES.find(s => s.id === target)!;
    let used = room.usedQuestionKeys || [];
    let indices = square.questions.map((_, i) => i).filter(i => !used.includes(`${target}_${i}`));
    if (!indices.length) {
      used = used.filter(key => !key.startsWith(`${target}_`));
      indices = square.questions.map((_, i) => i);
    }
    const index = indices[Math.floor(random() * indices.length)];
    const question = square.questions[index];
    room.currentQuestion = { squareId: target, questionIndex: index, questionText: question.text,
      officialAnswer: question.answer, answerTemplate: question.answerTemplate || '', keyword: question.keyword || '',
      acceptedAnswers: question.acceptedAnswers || [], category: square.category, squareName: square.name,
      phase: 'active_answering', phaseStartedAt: now, activePlayerId: active.id, originalDiceValue: dice,
      targetPosition: target, stolenByPlayerId: null, stealStartTime: null, questionStartTime: null,
      resultWinnerId: null, disqualifiedPlayerIds: [], playerAnswer: '', result: null,
      hint: question.hint || 'Chưa có gợi ý cho câu hỏi này.', hintUsedByPlayerIds: [] };
    room.usedQuestionKeys = [...used, `${target}_${index}`];
    room.status = 'moving';
    room.diceValue = dice;
    room.targetPosition = target;
    room.isBonusRoll = false;
    room.bonusPlayerId = null;
    return success();
  }
  if (action.type === 'finish_bonus') {
    if (room.status !== 'moving' || !room.isBonusRoll) return reject();
    nextTurn();
    return success();
  }
  if (action.type === 'open') {
    if ((!host && actorId !== active.id) || room.status !== 'moving' || room.isBonusRoll || !q || q.questionStartTime != null) return reject();
    room.status = 'question';
    q.questionStartTime = now;
    q.phaseStartedAt = now;
    return success();
  }
  if (room.status !== 'question' || !q) return reject();
  if ('phase' in action && action.phase !== q.phase) return reject();
  if (action.type === 'answer') {
    const main = q.phase === 'active_answering';
    const start = main ? q.questionStartTime : q.stealStartTime;
    const owner = main ? q.activePlayerId : q.stolenByPlayerId;
    if (!member || !['active_answering', 'stealer_answering'].includes(q.phase) || owner !== actorId ||
      start == null || now >= start + (main ? MAIN_ANSWER_MS : STEAL_ANSWER_MS)) return reject();
    const answer = action.answer.trim().slice(0, 500);
    if (!answer) return reject('Vui lòng nhập đáp án.');
    const correct = isAnswerCorrect(answer, q.officialAnswer, q.acceptedAnswers);
    if (correct) {
      // Apply movement once at settlement, for both normal and stolen answers.
      result(true, answer, owner);
    } else if (main) failMain(answer);
    else result(false, answer);
    return success(correct);
  }
  if (action.type === 'buzz') {
    if (!member || q.phase !== 'stealing_open' || actorId === q.activePlayerId || q.stolenByPlayerId ||
      now >= (q.stealStartTime ?? q.phaseStartedAt) + BUZZ_WINDOW_MS) return reject();
    q.phase = 'stealer_answering';
    q.phaseStartedAt = now;
    q.stolenByPlayerId = actorId;
    q.stealStartTime = now;
    q.playerAnswer = '';
    return success();
  }
  if (action.type === 'hint') {
    const player = room.players.find(p => p.id === actorId);
    if (!player || q.phase === 'showing_result') return reject();
    if (q.hintUsedByPlayerIds?.includes(actorId)) return { success: true };
    if (player.hintsRemaining <= 0) return reject('Bạn đã dùng hết 2 lượt gợi ý.');
    player.hintsRemaining -= 1;
    q.hintUsedByPlayerIds = [...(q.hintUsedByPlayerIds || []), actorId];
    return success();
  }
  if (action.type === 'timeout') {
    if (q.phase === 'active_answering' && q.questionStartTime != null && now >= q.questionStartTime + MAIN_ANSWER_MS) {
      failMain('(Hết thời gian 60s)');
    } else if (q.phase === 'stealer_answering' && q.stealStartTime != null && now >= q.stealStartTime + STEAL_ANSWER_MS) {
      result(false, '(Hết thời gian 30s)');
    } else return reject();
    return success();
  }
  if (action.type === 'close') {
    if (q.phase === 'stealing_open') {
      if (now < (q.stealStartTime ?? q.phaseStartedAt) + BUZZ_WINDOW_MS) return reject();
      nextTurn();
      return success();
    }
    if (q.phase !== 'showing_result') return reject();
    const winner = room.players.find(p => p.id === q.resultWinnerId);
    if (q.result === 'correct' && winner) {
      move(winner, q.originalDiceValue);
      if (winner.completedLap) finish(winner);
      else if (winner.id === q.activePlayerId) {
        room.status = 'bonus_roll';
        room.isBonusRoll = true;
        room.bonusPlayerId = winner.id;
        room.currentQuestion = null;
        room.diceValue = null;
        room.targetPosition = null;
      } else nextTurn();
    } else nextTurn();
    return success();
  }
  return reject();
}
