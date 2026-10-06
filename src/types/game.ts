export type CategoryType =
  | 'politics'
  | 'economy'
  | 'culture_society'
  | 'law'
  | 'knowledge'
  | 'scenario'
  | 'start';

export interface Question {
  id: string;
  text: string;
  answer: string;
  answerTemplate?: string;
  keyword?: string;
  hint?: string;
  acceptedAnswers?: string[];
  explanation?: string;
  points?: number;
}

export interface BoardSquare {
  id: number; // 1 - 24
  name: string;
  category: CategoryType;
  subtitle?: string;
  iconName?: string;
  questions: Question[];
}

export interface Player {
  id: string;
  name: string;
  color: string;
  colorName: string;
  avatar: string;
  position: number; // 1 - 24
  hintsRemaining: number; // Max 2 hint uses per game
  isReady?: boolean;
  connected: boolean;
  completedLap: boolean;
  laps: number;
  joinedAt?: number;
}

export type QuestionPhase =
  | 'active_answering'    // Main player is answering
  | 'stealing_open'       // Main player failed, buzzing is open for opponents
  | 'stealer_answering'   // An opponent buzzed in, has 30s to answer
  | 'host_review'         // Host checks an answer rejected by automatic matching
  | 'showing_result'      // Evaluating result display before auto-closing
  | 'resolved';           // Question finished

export interface CurrentQuestionState {
  phaseStartedAt: number;
  squareId: number;
  questionIndex: number;
  questionText: string;
  officialAnswer: string;
  answerTemplate?: string;
  keyword?: string;
  acceptedAnswers?: string[];
  category: CategoryType;
  squareName: string;
  phase: QuestionPhase;
  activePlayerId: string;
  originalDiceValue: number;
  targetPosition: number;
  stolenByPlayerId?: string | null;
  stealStartTime?: number | null; // timestamp for 30s countdown
  questionStartTime?: number | null; // timestamp for 60s countdown
  resultWinnerId?: string | null; // player who got points/advancement
  disqualifiedPlayerIds: string[]; // Opponents who failed steal
  playerAnswer?: string;
  result?: 'correct' | 'incorrect' | null;
  hint?: string;
  hintUsedByPlayerIds?: string[]; // players who used a hint on this question
}

export interface RoomState {
  turnId: string;
  lastAction?: { type: string; actorId: string };
  roomCode: string;
  hostId: string;
  hostName: string;
  hostIsPlayer: boolean;
  status: 'lobby' | 'playing' | 'question' | 'bonus_roll' | 'moving' | 'finished';
  players: Player[];
  playerIds: string[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isBonusRoll: boolean; // whether current roll is bonus roll
  bonusPlayerId?: string | null;
  targetPosition?: number | null;
  currentQuestion: CurrentQuestionState | null;
  usedQuestionKeys: string[];
  winner: {
    id: string;
    name: string;
    avatar?: string;
    color?: string;
    laps?: number;
  } | null;
  createdAt: any;
  updatedAt: any;
}
