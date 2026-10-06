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
  points: number;
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
  score: number;
  isReady?: boolean;
  connected: boolean;
  completedLap: boolean;
  laps: number;
  joinedAt?: number;
}

export interface CurrentQuestionState {
  squareId: number;
  questionIndex: number;
  questionText: string;
  officialAnswer: string;
  category: CategoryType;
  squareName: string;
  points: number;
  playerAnswer?: string;
  status: 'pending' | 'submitted' | 'resolved';
  result?: 'correct' | 'incorrect' | null;
  awardedPoints?: number;
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  hostName: string;
  hostIsPlayer: boolean;
  status: 'lobby' | 'playing' | 'rolling' | 'moving' | 'evaluating' | 'finished';
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  targetPosition?: number | null;
  currentQuestion: CurrentQuestionState | null;
  usedQuestionKeys: string[];
  winner: {
    id: string;
    name: string;
    score: number;
    avatar?: string;
    color?: string;
  } | null;
  isTieBreak?: boolean;
  tieBreakQuestion?: {
    text: string;
    answer: string;
    tiedPlayerIds: string[];
  } | null;
  createdAt: any;
  updatedAt: any;
}
