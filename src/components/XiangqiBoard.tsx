import React from 'react';
import { Piece, Position } from '../types/xiangqi';
import { PIECE_NAMES } from '../types/xiangqi';

interface XiangqiBoardProps {
  board: (Piece | null)[][];
  selectedPiece: Piece | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  onSquareClick: (position: Position) => void;
}

const XiangqiBoard: React.FC<XiangqiBoardProps> = ({
  board,
  selectedPiece,
  legalMoves,
  lastMove,
  onSquareClick
}) => {
  const BOARD_SIZE = 560;
  const CELL_SIZE = BOARD_SIZE / 9;
  const PIECE_SIZE = CELL_SIZE * 0.8;
  const MARGIN = 40; // 添加边距以确保棋子完全显示

  // 渲染棋盘线条
  const renderBoardLines = () => {
    const lines = [];
    
    // 横线
    for (let y = 0; y <= 9; y++) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={MARGIN}
          y1={y * CELL_SIZE + MARGIN}
          x2={8 * CELL_SIZE + MARGIN}
          y2={y * CELL_SIZE + MARGIN}
          stroke="#8B4513"
          strokeWidth="2"
        />
      );
    }
    
    // 竖线
    for (let x = 0; x <= 8; x++) {
      if (x === 0 || x === 8) {
        // 最左边和最右边的竖线需要完全连通
        lines.push(
          <line
            key={`v-${x}-full`}
            x1={x * CELL_SIZE + MARGIN}
            y1={MARGIN}
            x2={x * CELL_SIZE + MARGIN}
            y2={9 * CELL_SIZE + MARGIN}
            stroke="#8B4513"
            strokeWidth="2"
          />
        );
      } else {
        // 中间的竖线在楚河汉界处断开
        // 上半部分
        lines.push(
          <line
            key={`v-${x}-top`}
            x1={x * CELL_SIZE + MARGIN}
            y1={MARGIN}
            x2={x * CELL_SIZE + MARGIN}
            y2={4 * CELL_SIZE + MARGIN}
            stroke="#8B4513"
            strokeWidth="2"
          />
        );
        
        // 下半部分
        lines.push(
          <line
            key={`v-${x}-bottom`}
            x1={x * CELL_SIZE + MARGIN}
            y1={5 * CELL_SIZE + MARGIN}
            x2={x * CELL_SIZE + MARGIN}
            y2={9 * CELL_SIZE + MARGIN}
            stroke="#8B4513"
            strokeWidth="2"
          />
        );
      }
    }
    
    return lines;
  };

  // 渲染九宫格对角线
  const renderPalaceLines = () => {
    const lines = [];
    
    // 上方九宫格
    lines.push(
      <line
        key="palace-top-1"
        x1={3 * CELL_SIZE + MARGIN}
        y1={MARGIN}
        x2={5 * CELL_SIZE + MARGIN}
        y2={2 * CELL_SIZE + MARGIN}
        stroke="#8B4513"
        strokeWidth="2"
      />
    );
    lines.push(
      <line
        key="palace-top-2"
        x1={5 * CELL_SIZE + MARGIN}
        y1={MARGIN}
        x2={3 * CELL_SIZE + MARGIN}
        y2={2 * CELL_SIZE + MARGIN}
        stroke="#8B4513"
        strokeWidth="2"
      />
    );
    
    // 下方九宫格
    lines.push(
      <line
        key="palace-bottom-1"
        x1={3 * CELL_SIZE + MARGIN}
        y1={7 * CELL_SIZE + MARGIN}
        x2={5 * CELL_SIZE + MARGIN}
        y2={9 * CELL_SIZE + MARGIN}
        stroke="#8B4513"
        strokeWidth="2"
      />
    );
    lines.push(
      <line
        key="palace-bottom-2"
        x1={5 * CELL_SIZE + MARGIN}
        y1={7 * CELL_SIZE + MARGIN}
        x2={3 * CELL_SIZE + MARGIN}
        y2={9 * CELL_SIZE + MARGIN}
        stroke="#8B4513"
        strokeWidth="2"
      />
    );
    
    return lines;
  };

  // 渲染楚河汉界
  const renderRiverText = () => {
    return (
      <g>
        <text
          x={2 * CELL_SIZE + MARGIN}
          y={4.7 * CELL_SIZE + MARGIN}
          fontSize="24"
          fontWeight="bold"
          fill="#8B4513"
          textAnchor="middle"
        >
          楚河
        </text>
        <text
          x={6 * CELL_SIZE + MARGIN}
          y={4.7 * CELL_SIZE + MARGIN}
          fontSize="24"
          fontWeight="bold"
          fill="#8B4513"
          textAnchor="middle"
        >
          汉界
        </text>
      </g>
    );
  };

  // 渲染棋子
  const renderPiece = (piece: Piece, x: number, y: number) => {
    const displayX = x;
    const displayY = 9 - y; // 翻转Y坐标，确保第0行在底部
    const centerX = displayX * CELL_SIZE + MARGIN;
    const centerY = displayY * CELL_SIZE + MARGIN;
    
    const isSelected = selectedPiece?.id === piece.id;
    const isLastMoveFrom = lastMove?.from.x === x && lastMove?.from.y === y;
    const isLastMoveTo = lastMove?.to.x === x && lastMove?.to.y === y;
    
    const pieceColor = piece.side === 'red' ? '#DC2626' : '#1F2937';
    const backgroundColor = piece.side === 'red' ? '#FEF3C7' : '#F3F4F6';
    
    return (
      <g 
        key={piece.id}
        style={{ cursor: 'pointer' }}
        onClick={() => onSquareClick({ x, y })}
      >
        {/* 选中高亮 */}
        {isSelected && (
          <circle
            cx={centerX}
            cy={centerY}
            r={PIECE_SIZE / 2 + 4}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
          />
        )}
        
        {/* 上一步移动高亮 */}
        {(isLastMoveFrom || isLastMoveTo) && (
          <circle
            cx={centerX}
            cy={centerY}
            r={PIECE_SIZE / 2 + 2}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
          />
        )}
        
        {/* 棋子背景 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={PIECE_SIZE / 2}
          fill={backgroundColor}
          stroke="#374151"
          strokeWidth="2"
        />
        
        {/* 棋子文字 */}
        <text
          x={centerX}
          y={centerY + 6}
          fontSize="20"
          fontWeight="bold"
          fill={pieceColor}
          textAnchor="middle"
          style={{ userSelect: 'none' }}
        >
          {PIECE_NAMES[piece.type][piece.side]}
        </text>
      </g>
    );
  };

  // 渲染合法移动提示
  const renderLegalMoveHints = () => {
    return legalMoves.map((move, index) => {
      const displayX = move.x;
      const displayY = 9 - move.y; // 翻转Y坐标，确保第0行在底部
      const centerX = displayX * CELL_SIZE + MARGIN;
      const centerY = displayY * CELL_SIZE + MARGIN;
      
      const targetPiece = board[move.y][move.x];
      
      return (
        <g key={`legal-${index}`}>
          {targetPiece ? (
            // 可吃子位置 - 红色圆环
            <circle
              cx={centerX}
              cy={centerY}
              r={PIECE_SIZE / 2 + 6}
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          ) : (
            // 可移动位置 - 绿色圆点
            <circle
              cx={centerX}
              cy={centerY}
              r={8}
              fill="#10B981"
              opacity={0.8}
            />
          )}
        </g>
      );
    });
  };

  // 渲染交点
  const renderIntersections = () => {
    const intersections = [];
    
    for (let y = 0; y <= 9; y++) {
      for (let x = 0; x <= 8; x++) {
        const displayX = x;
        const displayY = 9 - y; // 翻转Y坐标，确保第0行在底部
        const centerX = displayX * CELL_SIZE + MARGIN;
        const centerY = displayY * CELL_SIZE + MARGIN;
        
        intersections.push(
          <circle
            key={`intersection-${x}-${y}`}
            cx={centerX}
            cy={centerY}
            r={2}
            fill="#8B4513"
            style={{ cursor: 'pointer' }}
            onClick={() => onSquareClick({ x, y })}
          />
        );
      }
    }
    
    return intersections;
  };

  // 渲染点击区域（透明的大圆圈，用于点击检测）
  const renderClickAreas = () => {
    const clickAreas = [];
    
    for (let y = 0; y <= 9; y++) {
      for (let x = 0; x <= 8; x++) {
        const displayX = x;
        const displayY = 9 - y; // 翻转Y坐标，确保第0行在底部
        const centerX = displayX * CELL_SIZE + MARGIN;
        const centerY = displayY * CELL_SIZE + MARGIN;
        
        clickAreas.push(
          <circle
            key={`click-area-${x}-${y}`}
            cx={centerX}
            cy={centerY}
            r={CELL_SIZE / 2}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => onSquareClick({ x, y })}
          />
        );
      }
    }
    
    return clickAreas;
  };

  const SVG_WIDTH = BOARD_SIZE + MARGIN * 2;
  const SVG_HEIGHT = BOARD_SIZE + MARGIN * 2;
  const COORD_MARGIN = 35; // 坐标标识的边距
  const COORD_WIDTH = 25; // 左侧坐标区域宽度
  const BOTTOM_COORD_HEIGHT = 30; // 底部坐标区域高度
  
  // 计算整个棋盘组件的总尺寸（包括坐标）
  const TOTAL_WIDTH = COORD_WIDTH + SVG_WIDTH;
  const TOTAL_HEIGHT = SVG_HEIGHT + BOTTOM_COORD_HEIGHT;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <div 
        className="relative"
        style={{
          width: `${TOTAL_WIDTH}px`,
          height: `${TOTAL_HEIGHT}px`
        }}
      >
        {/* 左侧数字坐标 */}
        <div 
          className="absolute text-sm text-amber-800 font-semibold flex flex-col justify-center"
          style={{
            left: '0px',
            top: `${MARGIN}px`,
            width: `${COORD_WIDTH}px`,
            height: `${BOARD_SIZE}px`
          }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div 
              key={i} 
              className="flex items-center justify-center"
              style={{ 
                height: `${CELL_SIZE}px`,
                width: '100%'
              }}
            >
              {9 - i}
            </div>
          ))}
        </div>
        
        {/* 主棋盘SVG */}
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          className="border-2 border-amber-800 rounded shadow-lg"
          style={{ 
            backgroundColor: '#FEF7CD',
            position: 'absolute',
            left: `${COORD_WIDTH}px`,
            top: '0px'
          }}
        >
          {/* 棋盘线条 */}
          {renderBoardLines()}
          
          {/* 九宫格对角线 */}
          {renderPalaceLines()}
          
          {/* 楚河汉界 */}
          {renderRiverText()}
          
          {/* 交点（用于点击检测） */}
          {renderIntersections()}
          
          {/* 合法移动提示 */}
          {renderLegalMoveHints()}
          
          {/* 棋子 */}
          {board.map((row, y) =>
            row.map((piece, x) => {
              if (piece) {
                return renderPiece(piece, x, y);
              }
              return null;
            })
          )}
          
          {/* 点击区域（放在最后，确保能接收点击事件） */}
          {renderClickAreas()}
        </svg>
        
        {/* 底部字母坐标 */}
        <div 
          className="absolute text-sm text-amber-800 font-semibold flex justify-center"
          style={{
            left: `${COORD_WIDTH + MARGIN}px`,
            top: `${SVG_HEIGHT + 10}px`,
            width: `${BOARD_SIZE}px`,
            height: `${BOTTOM_COORD_HEIGHT - 10}px`
          }}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <div 
              key={i} 
              className="flex items-center justify-center"
              style={{ 
                width: `${CELL_SIZE}px`,
                height: '100%'
              }}
            >
              {String.fromCharCode(97 + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XiangqiBoard;