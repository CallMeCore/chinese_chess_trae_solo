import { create } from 'zustand';
import {
  GameState,
  Piece,
  Position,
  Move,
  Side,
  GameStatus,
  DEFAULT_GAME_SETTINGS
} from '../types/xiangqi';
import { XiangqiEngine } from '../lib/xiangqi-engine';
import { audioSystem, SoundType } from '../lib/audioSystem';
import { pikafishEngine, AIMove } from '../lib/pikafish';

interface GameStore extends GameState {
  // 游戏控制方法
  initializeGame: () => void;
  selectPiece: (piece: Piece | null) => void;
  makeMove: (from: Position, to: Position) => boolean;
  undoMove: () => boolean;
  resetGame: () => void;
  switchSides: () => void;
  
  // 设置方法
  updateSettings: (settings: Partial<typeof DEFAULT_GAME_SETTINGS>) => void;
  
  // 阵营选择方法
  setPlayerSide: (side: Side) => void;
  getAISide: () => Side;
  
  // AI相关
  setAIThinking: (thinking: boolean) => void;
  makeAIMove: (move: string) => void;
  requestAIMove: () => void;
  
  // 辅助方法
  getPieceAt: (position: Position) => Piece | null;
  isGameOver: () => boolean;
  canUndo: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  board: XiangqiEngine.createInitialBoard(),
  currentPlayer: 'red',
  status: 'playing',
  selectedPiece: null,
  legalMoves: [],
  lastMove: null,
  moveHistory: [],
  settings: DEFAULT_GAME_SETTINGS,
  isThinking: false,
  playerSide: 'red', // 默认人类执红棋

  // 初始化游戏
  initializeGame: () => {
    const state = get();
    set({
      board: XiangqiEngine.createInitialBoard(),
      currentPlayer: 'red',
      status: 'playing',
      selectedPiece: null,
      legalMoves: [],
      lastMove: null,
      moveHistory: [],
      isThinking: false
      // 保持playerSide不变
    });
    audioSystem.playSound(SoundType.GAME_START);
    
    // 如果人类执黑棋，需要让AI先手
    if (state.playerSide === 'black' && state.settings.mode === 'human-vs-ai') {
      setTimeout(() => {
        get().requestAIMove();
      }, 1000); // 延迟1秒让用户看到棋盘
    }
  },

  // 选择棋子
  selectPiece: (piece: Piece | null) => {
    const state = get();
    
    if (!piece) {
      set({ selectedPiece: null, legalMoves: [] });
      return;
    }
    
    // 只能选择当前玩家的棋子
    if (piece.side !== state.currentPlayer) {
      console.log('DEBUG: 尝试选择非当前玩家的棋子', { pieceType: piece.type, pieceSide: piece.side, currentPlayer: state.currentPlayer });
      return;
    }
    
    // 如果游戏结束，不能选择棋子
    if (state.status === 'checkmate' || state.status === 'stalemate') {
      console.log('DEBUG: 游戏已结束，无法选择棋子', { status: state.status });
      return;
    }
    
    // 关键修复：确保selectedPiece的position与棋盘数组中的实际位置一致
    // 通过棋子ID在棋盘中查找实际位置
    let actualPiece = piece;
    let foundPosition: Position | null = null;
    
    // 在棋盘中查找该棋子的实际位置
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const boardPiece = state.board[y][x];
        if (boardPiece && boardPiece.id === piece.id) {
          foundPosition = { x, y };
          // 创建一个新的棋子对象，确保position属性正确
          actualPiece = {
            ...boardPiece,
            position: { x, y }
          };
          break;
        }
      }
      if (foundPosition) break;
    }
    
    if (!foundPosition) {
      console.error('DEBUG: 无法在棋盘中找到选择的棋子', { pieceId: piece.id, piecePosition: piece.position });
      return;
    }
    
    console.log('DEBUG: 选择棋子', { 
      type: actualPiece.type, 
      side: actualPiece.side, 
      originalPosition: piece.position,
      actualPosition: actualPiece.position,
      positionMatch: piece.position.x === actualPiece.position.x && piece.position.y === actualPiece.position.y
    });
    
    const legalMoves = XiangqiEngine.getLegalMoves(actualPiece, state.board);
    console.log('DEBUG: 棋子合法移动数量', { type: actualPiece.type, movesCount: legalMoves.length, moves: legalMoves });
    set({ selectedPiece: actualPiece, legalMoves });
    audioSystem.playSound(SoundType.PIECE_SELECT);
  },

  // 执行移动
  makeMove: (from: Position, to: Position) => {
    const state = get();
    console.log('DEBUG: makeMove调用', { from, to, currentPlayer: state.currentPlayer });
    
    // 详细的棋盘状态调试信息
    console.log('DEBUG: 棋盘状态检查');
    console.log(`DEBUG: 起始位置 (${from.x},${from.y}) 的棋子:`, state.board[from.y] ? state.board[from.y][from.x] : 'undefined row');
    console.log(`DEBUG: 目标位置 (${to.x},${to.y}) 的棋子:`, state.board[to.y] ? state.board[to.y][to.x] : 'undefined row');
    
    // 检查坐标是否有效
    if (from.y < 0 || from.y >= 10 || from.x < 0 || from.x >= 9) {
      console.error('DEBUG: 起始坐标超出范围', { from, boardSize: '10x9' });
      return false;
    }
    
    if (to.y < 0 || to.y >= 10 || to.x < 0 || to.x >= 9) {
      console.error('DEBUG: 目标坐标超出范围', { to, boardSize: '10x9' });
      return false;
    }
    
    const piece = state.board[from.y][from.x];
    const toPiece = state.board[to.y][to.x];
    console.log('DEBUG: 起始棋子', piece ? `${piece.type}(${piece.side}) id:${piece.id} pos:(${piece.position.x},${piece.position.y})` : '无棋子');
    console.log('DEBUG: 目标棋子', toPiece ? `${toPiece.type}(${toPiece.side}) id:${toPiece.id}` : '无棋子');
    
    if (!piece) {
      console.error('DEBUG: 移动失败 - 起始位置无棋子', { 
        from, 
        boardRow: state.board[from.y],
        selectedPiece: state.selectedPiece ? {
          id: state.selectedPiece.id,
          position: state.selectedPiece.position,
          type: state.selectedPiece.type,
          side: state.selectedPiece.side
        } : null
      });
      return false;
    }
    
    if (piece.side !== state.currentPlayer) {
      console.log('DEBUG: 移动失败 - 棋子归属不匹配', { pieceSide: piece.side, currentPlayer: state.currentPlayer });
      return false;
    }
    
    // 验证移动是否合法
    const isValid = XiangqiEngine.isValidMove(piece, to, state.board);
    console.log('DEBUG: 移动合法性验证', { isValid, piece: piece.type, from, to });
    
    if (!isValid) {
      console.log('DEBUG: 移动失败 - 移动不合法');
      audioSystem.playSound(SoundType.INVALID_MOVE);
      return false;
    }
    
    // 创建移动记录
    const capturedPiece = state.board[to.y][to.x];
    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      timestamp: Date.now()
    };
    
    // 执行移动
    const newBoard = XiangqiEngine.makeMove(state.board, move);
    const nextPlayer: Side = state.currentPlayer === 'red' ? 'black' : 'red';
    const newStatus = XiangqiEngine.getGameStatus(nextPlayer, newBoard);
    
    set({
      board: newBoard,
      currentPlayer: nextPlayer,
      status: newStatus,
      selectedPiece: null,
      legalMoves: [],
      lastMove: move,
      moveHistory: [...state.moveHistory, move]
    });
    
    // 播放音效
    if (capturedPiece) {
      audioSystem.playSound(SoundType.CAPTURE);
    } else {
      audioSystem.playSound(SoundType.MOVE);
    }
    
    // 检查将军状态
    if (newStatus === 'check') {
      audioSystem.playSound(SoundType.CHECK);
    }
    
    // 检查游戏结束
    if (newStatus === 'checkmate') {
      audioSystem.playSound(SoundType.CHECKMATE);
    }
    
    // 如果是AI模式且轮到AI，请求AI移动
    const currentState = get();
    const aiSide = currentState.getAISide();
    if (currentState.settings.mode === 'human-vs-ai' && nextPlayer === aiSide && newStatus === 'playing') {
      setTimeout(() => {
        get().requestAIMove();
      }, 500); // 短暂延迟让用户看到移动效果
    }
    
    return true;
  },

  // 悔棋
  undoMove: () => {
    const state = get();
    
    if (state.moveHistory.length === 0) {
      return false;
    }
    
    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    const newBoard = state.board.map(row => [...row]);
    
    // 恢复移动
    const piece = newBoard[lastMove.to.y][lastMove.to.x];
    if (piece) {
      // 创建新的棋子对象并更新position属性
      const restoredPiece = {
        ...piece,
        position: lastMove.from
      };
      
      console.log('DEBUG: 悔棋恢复棋子位置', {
        pieceId: piece.id,
        currentPosition: piece.position,
        restoredPosition: lastMove.from
      });
      
      newBoard[lastMove.from.y][lastMove.from.x] = restoredPiece;
      
      // 恢复被吃的棋子（如果有的话）
      if (lastMove.capturedPiece) {
        const restoredCapturedPiece = {
          ...lastMove.capturedPiece,
          position: lastMove.to
        };
        newBoard[lastMove.to.y][lastMove.to.x] = restoredCapturedPiece;
      } else {
        newBoard[lastMove.to.y][lastMove.to.x] = null;
      }
    }
    
    const previousPlayer: Side = state.currentPlayer === 'red' ? 'black' : 'red';
    const newStatus = XiangqiEngine.getGameStatus(previousPlayer, newBoard);
    const newMoveHistory = state.moveHistory.slice(0, -1);
    const newLastMove = newMoveHistory.length > 0 ? newMoveHistory[newMoveHistory.length - 1] : null;
    
    set({
      board: newBoard,
      currentPlayer: previousPlayer,
      status: newStatus,
      selectedPiece: null,
      legalMoves: [],
      lastMove: newLastMove,
      moveHistory: newMoveHistory
    });
    
    return true;
  },

  // 重置游戏
  resetGame: () => {
    get().initializeGame();
  },

  // 交换双方
  switchSides: () => {
    const state = get();
    set({
      currentPlayer: state.currentPlayer === 'red' ? 'black' : 'red'
    });
  },

  // 更新设置
  updateSettings: (newSettings) => {
    const state = get();
    set({
      settings: { ...state.settings, ...newSettings }
    });
    if ('soundEnabled' in newSettings) {
      audioSystem.toggleSound();
      audioSystem.playSound(SoundType.BUTTON_CLICK);
    }
  },

  // 设置人类玩家阵营
  setPlayerSide: (side: Side) => {
    set({ playerSide: side });
    // 重新初始化游戏以应用新的阵营设置
    get().initializeGame();
  },

  // 获取AI阵营
  getAISide: () => {
    const state = get();
    return state.playerSide === 'red' ? 'black' : 'red';
  },

  // 设置AI思考状态
  setAIThinking: (thinking: boolean) => {
    set({ isThinking: thinking });
  },

  // AI移动
  makeAIMove: (moveString: string) => {
    console.log('DEBUG: AI移动字符串', moveString);
    // 解析中国象棋UCI格式的移动字符串 (例如: "e6e5")
    if (moveString.length !== 4) {
      console.error('无效的移动字符串长度:', moveString);
      return;
    }
    
    // UCI坐标解析
    const fromFile = moveString.charCodeAt(0) - 97; // a=0, b=1, ..., i=8
    const fromRank = parseInt(moveString[1]); // 0-9 (修正：皮卡鱼实际使用0-9范围)
    const toFile = moveString.charCodeAt(2) - 97;
    const toRank = parseInt(moveString[3]); // 0-9
    
    console.log('DEBUG: UCI原始坐标', { fromFile, fromRank, toFile, toRank });
    
    // 验证UCI坐标范围 - 修正：rank范围是0-9
    if (fromFile < 0 || fromFile > 8 || fromRank < 0 || fromRank > 9 ||
        toFile < 0 || toFile > 8 || toRank < 0 || toRank > 9) {
      console.error('UCI坐标超出范围:', { fromFile, fromRank, toFile, toRank });
      return;
    }
    
    // 关键修正：UCI坐标转换为游戏坐标
    // 根据实际测试，AI引擎返回的UCI坐标直接对应游戏坐标：
    // UCI标准：rank 0是棋盘顶部(黑方底线)，rank 9是棋盘底部(红方底线)
    // FEN标准：第一行是棋盘顶部(黑方底线)，最后一行是棋盘底部(红方底线)
    // 游戏坐标：y=0是棋盘顶部(黑方底线)，y=9是棋盘底部(红方底线)
    // 因此正确转换公式：y = rank (直接对应)
    const fromX = fromFile;
    const fromY = fromRank; // 修正：直接使用rank值
    const toX = toFile;
    const toY = toRank; // 修正：直接使用rank值
    
    console.log('DEBUG: 坐标转换', {
      uci: { fromFile, fromRank, toFile, toRank },
      game: { fromX, fromY, toX, toY }
    });
    
    // 验证转换后的游戏坐标范围
    if (fromX < 0 || fromX > 8 || fromY < 0 || fromY > 9 ||
        toX < 0 || toX > 8 || toY < 0 || toY > 9) {
      console.error('转换后游戏坐标超出范围:', { fromX, fromY, toX, toY });
      return;
    }
    
    // 使用转换后的游戏坐标
    const from: Position = { x: fromX, y: fromY };
    const to: Position = { x: toX, y: toY };
    
    console.log('DEBUG: UCI坐标转换', { 
      uciMove: moveString,
      from: { x: fromX, y: fromY }, 
      to: { x: toX, y: toY } 
    });
    
    // 验证转换后的棋子归属
    const state = get();
    const piece = state.board[from.y][from.x];
    console.log('DEBUG: 转换后棋子检查', {
      position: from,
      piece: piece ? { type: piece.type, side: piece.side } : '无棋子',
      currentPlayer: state.currentPlayer
    });
    
    // 详细分析：AI返回的移动与实际棋盘状态的对应关系
    // FEN字符串分析：rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C2C4/9/RHEAKAEHR
    // FEN第一行'rheakaehr'对应棋盘Row 0，其中h在位置1应该是黑方马
    // 但AI返回b9c7，意味着从(1,9)移动到(2,7)
    // 需要检查FEN坐标系统与游戏坐标系统的对应关系
    console.log('DEBUG: FEN坐标系统分析', {
      aiMove: moveString,
      fenString: 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C2C4/9/RHEAKAEHR',
      aiFromCoord: { x: fromX, y: fromY },
      aiToCoord: { x: toX, y: toY },
      gameFromCoord: from,
      gameToCoord: to,
      actualPiece: piece ? `${piece.side}方${piece.type}` : '空位置'
    });
    
    // 执行移动并设置AI思考状态为false
    const success = get().makeMove(from, to);
    if (success) {
      console.log('✨ AI移动成功');
    } else {
      console.error('❌ AI移动失败');
    }
    
    get().setAIThinking(false);
  },

  // 请求AI移动
  requestAIMove: () => {
    const state = get();
    
    console.log('🤖 [AI流程] requestAIMove被调用');
    console.log('🔍 [AI流程] 当前游戏状态检查:', {
      mode: state.settings.mode,
      status: state.status,
      isThinking: state.isThinking,
      currentPlayer: state.currentPlayer
    });
    
    // 只有在AI模式且游戏进行中且轮到AI时才请求移动
    if (state.settings.mode !== 'human-vs-ai' || state.status !== 'playing' || state.isThinking) {
      console.log('❌ [AI流程] 不满足AI移动条件，退出:', {
        isHumanVsAI: state.settings.mode === 'human-vs-ai',
        isPlaying: state.status === 'playing',
        notThinking: !state.isThinking
      });
      return;
    }
    
    // 检查是否轮到AI
    const aiSide = state.getAISide();
    console.log('🎯 [AI流程] AI方检查:', {
      aiSide,
      currentPlayer: state.currentPlayer,
      isAITurn: state.currentPlayer === aiSide
    });
    
    if (state.currentPlayer !== aiSide) {
      console.log('⏸️ [AI流程] 不是AI回合，退出');
      return;
    }
    
    console.log('✅ [AI流程] 开始AI移动流程');
    set((state) => ({ ...state, isThinking: true }));
    console.log('🧠 [AI流程] AI思考状态已设置为true');
    
    // 将当前棋盘状态转换为FEN格式
    console.log('🔄 [AI流程] 开始生成FEN字符串...');
    const fen = XiangqiEngine.boardToFEN(state.board, state.currentPlayer);
    
    // 调试：输出当前棋盘状态
    console.log('📋 [AI流程] 当前棋盘状态 (currentPlayer:', state.currentPlayer, ')');
    for (let y = 0; y < 10; y++) {
      const row = state.board[y].map((piece, x) => {
        if (piece) {
          return `${piece.side[0]}${piece.type[0]}@(${x},${y})`;
        }
        return '.';
      }).join(' ');
      console.log(`Row ${y}:`, row);
    }
    console.log('📝 [AI流程] 生成的FEN字符串:', fen);
    
    // 设置AI引擎位置并请求移动
    console.log('🎯 [AI流程] 开始设置AI引擎位置...');
    pikafishEngine.setPosition(fen).then((success) => {
      console.log('📍 [AI流程] 设置AI引擎位置结果:', success);
      
      if (success) {
        console.log('🚀 [AI流程] 开始请求AI移动...');
        // 请求AI移动
        pikafishEngine.requestMove((move: AIMove) => {
          console.log('🎉 [AI流程] 收到AI移动回调:', move);
          const uciMove = move.from + move.to;
          console.log('🔄 [AI流程] 转换为UCI移动字符串:', uciMove);
          console.log('⚡ [AI流程] 开始执行AI移动...');
          get().makeAIMove(uciMove);
          console.log('✨ [AI流程] AI移动流程完成');
        }).catch((error) => {
          console.error('💥 [AI流程] AI移动请求失败:', error);
          console.log('🔄 [AI流程] 重置AI思考状态');
          get().setAIThinking(false);
        });
      } else {
        console.error('❌ [AI流程] 设置AI引擎位置失败');
        console.log('🔄 [AI流程] 重置AI思考状态');
        get().setAIThinking(false);
      }
    }).catch((error) => {
      console.error('💥 [AI流程] 设置AI引擎位置出错:', error);
      console.log('🔄 [AI流程] 重置AI思考状态');
      get().setAIThinking(false);
    });
  },

  // 获取指定位置的棋子
  getPieceAt: (position: Position) => {
    const state = get();
    return state.board[position.y][position.x];
  },

  // 检查游戏是否结束
  isGameOver: () => {
    const state = get();
    return state.status === 'checkmate' || state.status === 'stalemate';
  },

  // 检查是否可以悔棋
  canUndo: () => {
    const state = get();
    return state.moveHistory.length > 0 && !state.isThinking;
  }
}));

// 本地存储相关
export const saveGameToStorage = (gameState: GameState) => {
  try {
    localStorage.setItem('xiangqi-game-state', JSON.stringify(gameState));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

export const loadGameFromStorage = (): Partial<GameState> | null => {
  try {
    const saved = localStorage.getItem('xiangqi-game-state');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
};

export const clearGameStorage = () => {
  try {
    localStorage.removeItem('xiangqi-game-state');
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
};