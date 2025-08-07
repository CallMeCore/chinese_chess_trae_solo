import React, { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import XiangqiBoard from './XiangqiBoard';
import { Position } from '../types/xiangqi';
import { Play, RotateCcw, Settings, HelpCircle, Volume2, VolumeX, Users } from 'lucide-react';
import { audioSystem, SoundType } from '../lib/audioSystem';

interface XiangqiGameProps {
  onShowSettings: () => void;
  onShowHelp: () => void;
}

const XiangqiGame: React.FC<XiangqiGameProps> = ({ onShowSettings, onShowHelp }) => {
  const {
    board,
    currentPlayer,
    status,
    selectedPiece,
    legalMoves,
    lastMove,
    moveHistory,
    settings,
    isThinking,
    playerSide,
    initializeGame,
    selectPiece,
    makeMove,
    undoMove,
    resetGame,
    updateSettings,
    setPlayerSide,
    getPieceAt,
    isGameOver,
    canUndo
  } = useGameStore();

  // 初始化游戏
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // 处理棋盘点击
  const handleSquareClick = useCallback((position: Position) => {
    console.log('🎯 handleSquareClick 被调用:', {
      position,
      selectedPiece: selectedPiece ? {
        type: selectedPiece.type,
        side: selectedPiece.side,
        position: selectedPiece.position
      } : null,
      currentPlayer,
      isGameOver: isGameOver()
    });
    
    const piece = getPieceAt(position);
    console.log('📍 点击位置的棋子:', piece ? {
      type: piece.type,
      side: piece.side,
      position: piece.position
    } : '空位置');
    
    if (selectedPiece) {
      console.log('✅ 已选择棋子，处理移动逻辑');
      // 如果已选择棋子，尝试移动
      if (selectedPiece.position.x === position.x && selectedPiece.position.y === position.y) {
        // 点击同一个棋子，取消选择
        console.log('🔄 点击同一棋子，取消选择');
        selectPiece(null);
      } else {
        // 尝试移动到目标位置
        console.log('🚀 尝试移动:', {
          from: selectedPiece.position,
          to: position
        });
        
        console.log('📋 当前合法移动:', legalMoves);
        
        const success = makeMove(selectedPiece.position, position);
        console.log('✨ 移动结果:', success ? '成功' : '失败');
        
        if (!success && piece && piece.side === currentPlayer) {
          // 移动失败但点击了己方棋子，选择新棋子
          console.log('🔄 移动失败，选择新棋子:', piece);
          selectPiece(piece);
        }
      }
    } else {
      console.log('❌ 未选择棋子，尝试选择棋子');
      // 没有选择棋子，选择点击的棋子
      if (piece && piece.side === currentPlayer && !isGameOver()) {
        console.log('✅ 选择棋子:', piece);
        selectPiece(piece);
      } else {
        console.log('❌ 无法选择棋子:', {
          hasPiece: !!piece,
          isCurrentPlayerPiece: piece ? piece.side === currentPlayer : false,
          gameOver: isGameOver()
        });
      }
    }
  }, [selectedPiece, currentPlayer, makeMove, selectPiece, getPieceAt, isGameOver, legalMoves]);

  // 处理新游戏
  const handleNewGame = () => {
    resetGame();
  };

  // 处理悔棋
  const handleUndo = () => {
    if (canUndo()) {
      undoMove();
    }
  };

  // 切换音效
  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (status) {
      case 'check':
        return `${currentPlayer === 'red' ? '红方' : '黑方'}被将军！`;
      case 'checkmate':
        return `${currentPlayer === 'red' ? '黑方' : '红方'}获胜！`;
      case 'stalemate':
        return '和棋！';
      case 'draw':
        return '平局！';
      default:
        return `${currentPlayer === 'red' ? '红方' : '黑方'}行棋`;
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (status) {
      case 'check':
        return 'text-yellow-600';
      case 'checkmate':
        return 'text-red-600';
      case 'stalemate':
      case 'draw':
        return 'text-gray-600';
      default:
        return currentPlayer === 'red' ? 'text-red-600' : 'text-gray-800';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* 左侧控制面板 */}
      <div className="lg:w-80 space-y-4">
        {/* 游戏状态 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">游戏状态</h2>
          <div className={`text-lg font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {isThinking && (
            <div className="text-sm text-blue-600 mt-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              AI思考中...
            </div>
          )}
        </div>

        {/* 阵营选择 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">阵营选择</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                audioSystem.playSound(SoundType.BUTTON_CLICK);
                setPlayerSide('red');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
                playerSide === 'red'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users size={16} />
              执红棋
            </button>
            <button
              onClick={() => {
                audioSystem.playSound(SoundType.BUTTON_CLICK);
                setPlayerSide('black');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
                playerSide === 'black'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users size={16} />
              执黑棋
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {playerSide === 'red' ? '您执红棋，AI执黑棋' : '您执黑棋，AI执红棋'}
          </div>
        </div>

        {/* 游戏控制 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">游戏控制</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                audioSystem.playSound(SoundType.BUTTON_CLICK);
                handleNewGame();
              }}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Play size={16} />
              新游戏
            </button>
            
            <button
              onClick={() => {
                audioSystem.playSound(SoundType.BUTTON_CLICK);
                handleUndo();
              }}
              disabled={!canUndo()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
            >
              <RotateCcw size={16} />
              悔棋
            </button>
            
            <button
              onClick={() => {
                toggleSound();
              }}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {settings.soundEnabled ? '关闭音效' : '开启音效'}
            </button>
            
            <button
              onClick={() => {
                audioSystem.playSound(SoundType.BUTTON_CLICK);
                onShowSettings();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Settings size={16} />
              设置
            </button>
            
            <button
              onClick={() => {
                audioSystem.playSound(SoundType.BUTTON_CLICK);
                onShowHelp();
              }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <HelpCircle size={16} />
              帮助
            </button>
          </div>
        </div>

        {/* 游戏信息 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">游戏信息</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>游戏模式:</span>
              <span>{settings.mode === 'human-vs-ai' ? '人机对战' : '双人对战'}</span>
            </div>
            <div className="flex justify-between">
              <span>难度等级:</span>
              <span>
                {settings.difficulty === 'easy' ? '简单' : 
                 settings.difficulty === 'medium' ? '中等' : '困难'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>步数:</span>
              <span>{moveHistory.length}</span>
            </div>
            <div className="flex justify-between">
              <span>音效:</span>
              <span>{settings.soundEnabled ? '开启' : '关闭'}</span>
            </div>
          </div>
        </div>

        {/* 最近移动 */}
        {lastMove && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">最近移动</h3>
            <div className="text-sm text-gray-600">
              <div>
                {lastMove.piece.side === 'red' ? '红方' : '黑方'} 
                {lastMove.piece.type === 'king' ? (lastMove.piece.side === 'red' ? '帅' : '将') :
                 lastMove.piece.type === 'advisor' ? (lastMove.piece.side === 'red' ? '仕' : '士') :
                 lastMove.piece.type === 'elephant' ? (lastMove.piece.side === 'red' ? '相' : '象') :
                 lastMove.piece.type === 'horse' ? '马' :
                 lastMove.piece.type === 'chariot' ? '车' :
                 lastMove.piece.type === 'cannon' ? '炮' :
                 lastMove.piece.side === 'red' ? '兵' : '卒'}
              </div>
              <div>
                从 {String.fromCharCode(97 + lastMove.from.x)}{lastMove.from.y + 1} 
                到 {String.fromCharCode(97 + lastMove.to.x)}{lastMove.to.y + 1}
              </div>
              {lastMove.capturedPiece && (
                <div className="text-red-600">
                  吃掉 {lastMove.capturedPiece.side === 'red' ? '红方' : '黑方'}
                  {lastMove.capturedPiece.type === 'king' ? (lastMove.capturedPiece.side === 'red' ? '帅' : '将') :
                   lastMove.capturedPiece.type === 'advisor' ? (lastMove.capturedPiece.side === 'red' ? '仕' : '士') :
                   lastMove.capturedPiece.type === 'elephant' ? (lastMove.capturedPiece.side === 'red' ? '相' : '象') :
                   lastMove.capturedPiece.type === 'horse' ? '马' :
                   lastMove.capturedPiece.type === 'chariot' ? '车' :
                   lastMove.capturedPiece.type === 'cannon' ? '炮' :
                   lastMove.capturedPiece.side === 'red' ? '兵' : '卒'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 右侧棋盘 */}
      <div className="flex-1 flex justify-center items-center">
        <XiangqiBoard
          board={board}
          selectedPiece={selectedPiece}
          legalMoves={settings.showLegalMoves ? legalMoves : []}
          lastMove={settings.showLastMove && lastMove ? { from: lastMove.from, to: lastMove.to } : null}
          onSquareClick={handleSquareClick}
        />
      </div>
    </div>
  );
};

export default XiangqiGame;