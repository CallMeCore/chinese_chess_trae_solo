// 中国象棋游戏类型定义

// 棋子类型
export type PieceType = 
  | 'king'     // 帅/将
  | 'advisor'  // 仕/士
  | 'elephant' // 相/象
  | 'horse'    // 马
  | 'chariot'  // 车
  | 'cannon'   // 炮
  | 'pawn';    // 兵/卒

// 阵营
export type Side = 'red' | 'black';

// 棋盘位置
export interface Position {
  x: number; // 0-8 (列)
  y: number; // 0-9 (行)
}

// 棋子
export interface Piece {
  type: PieceType;
  side: Side;
  position: Position;
  id: string;
}

// 移动
export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  timestamp: number;
}

// 游戏状态
export type GameStatus = 
  | 'playing'    // 游戏进行中
  | 'check'      // 将军
  | 'checkmate'  // 将死
  | 'stalemate'  // 和棋
  | 'draw';      // 平局

// 游戏模式
export type GameMode = 'human-vs-human' | 'human-vs-ai';

// 难度等级
export type Difficulty = 'easy' | 'medium' | 'hard';

// 游戏设置
export interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty;
  soundEnabled: boolean;
  showLegalMoves: boolean;
  showLastMove: boolean;
  autoSave: boolean;
}

// 游戏状态
export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Side;
  status: GameStatus;
  selectedPiece: Piece | null;
  legalMoves: Position[];
  lastMove: Move | null;
  moveHistory: Move[];
  settings: GameSettings;
  isThinking: boolean; // AI思考中
  playerSide: Side; // 人类玩家选择的阵营，默认为red
}

// 音效类型
export type SoundType = 'move' | 'capture' | 'check' | 'checkmate' | 'illegal';

// UCI引擎命令
export interface UCICommand {
  command: string;
  params?: string[];
}

// UCI引擎响应
export interface UCIResponse {
  type: string;
  data: string;
}

// AI引擎状态
export interface AIEngineState {
  isReady: boolean;
  isThinking: boolean;
  bestMove: string | null;
  evaluation: number | null;
  depth: number;
}

// 棋谱格式
export interface GameRecord {
  id: string;
  date: string;
  redPlayer: string;
  blackPlayer: string;
  result: string;
  moves: Move[];
  settings: GameSettings;
}

// 统计信息
export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

// 棋子中文名称映射
export const PIECE_NAMES = {
  king: { red: '帅', black: '将' },
  advisor: { red: '仕', black: '士' },
  elephant: { red: '相', black: '象' },
  horse: { red: '马', black: '马' },
  chariot: { red: '车', black: '车' },
  cannon: { red: '炮', black: '炮' },
  pawn: { red: '兵', black: '卒' }
};

// 初始棋盘布局 - 传统中国象棋标准布局：红方在下方（0-4行），黑方在上方（5-9行）
// 第0行：红方底线，第9行：黑方底线
export const INITIAL_BOARD_LAYOUT: (PieceType | null)[][] = [
  // 红方底线 (Row 0) - 红方棋子
  ['chariot', 'horse', 'elephant', 'advisor', 'king', 'advisor', 'elephant', 'horse', 'chariot'],
  [null, null, null, null, null, null, null, null, null],
  // 红方炮线 (Row 2) - 红方棋子
  [null, 'cannon', null, null, null, null, null, 'cannon', null],
  // 红方兵线 (Row 3) - 红方棋子
  ['pawn', null, 'pawn', null, 'pawn', null, 'pawn', null, 'pawn'],
  // 楚河汉界 (Row 4)
  [null, null, null, null, null, null, null, null, null],
  // 楚河汉界 (Row 5)
  [null, null, null, null, null, null, null, null, null],
  // 黑方兵线 (Row 6) - 黑方棋子
  ['pawn', null, 'pawn', null, 'pawn', null, 'pawn', null, 'pawn'],
  // 黑方炮线 (Row 7) - 黑方棋子
  [null, 'cannon', null, null, null, null, null, 'cannon', null],
  [null, null, null, null, null, null, null, null, null],
  // 黑方底线 (Row 9) - 黑方棋子
  ['chariot', 'horse', 'elephant', 'advisor', 'king', 'advisor', 'elephant', 'horse', 'chariot']
];

// 默认游戏设置
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'human-vs-ai',
  difficulty: 'medium',
  soundEnabled: true,
  showLegalMoves: true,
  showLastMove: true,
  autoSave: true
};