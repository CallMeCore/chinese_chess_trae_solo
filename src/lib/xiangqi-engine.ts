import {
  Piece,
  Position,
  Move,
  Side,
  PieceType,
  GameStatus,
  GameState,
  INITIAL_BOARD_LAYOUT
} from '../types/xiangqi';

/**
 * 中国象棋游戏引擎
 * 负责游戏规则验证、移动计算、将军检测等核心逻辑
 */
export class XiangqiEngine {
  /**
   * 创建初始棋盘
   */
  static createInitialBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(10).fill(null).map(() => Array(9).fill(null));
    
    // 直接按照INITIAL_BOARD_LAYOUT创建棋盘
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const pieceType = INITIAL_BOARD_LAYOUT[y][x];
        if (pieceType) {
          // 根据棋盘位置确定阵营：0-4行为红方，5-9行为黑方
          const side: Side = y <= 4 ? 'red' : 'black';
          board[y][x] = {
            type: pieceType,
            side: side,
            position: { x, y },
            id: `${side}-${pieceType}-${x}-${y}`
          };
        }
      }
    }
    
    console.log('DEBUG: 创建初始棋盘完成');
    console.log('DEBUG: 第0行(红方底线):', board[0].map(p => p ? `${p.side[0]}${p.type[0]}` : '·').join(' '));
    console.log('DEBUG: 第9行(黑方底线):', board[9].map(p => p ? `${p.side[0]}${p.type[0]}` : '·').join(' '));
    
    // 验证阵营分配
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = board[y][x];
        if (piece) {
          const expectedSide = y <= 4 ? 'red' : 'black';
          if (piece.side !== expectedSide) {
            console.error(`ERROR: 第${y}行第${x}列棋子阵营错误: 期望${expectedSide}, 实际${piece.side}`);
          }
        }
      }
    }
    
    return board;
  }

  /**
   * 检查位置是否在棋盘范围内
   */
  static isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x <= 8 && pos.y >= 0 && pos.y <= 9;
  }

  /**
   * 检查位置是否在九宫格内
   */
  static isInPalace(pos: Position, side: Side): boolean {
    const inPalaceX = pos.x >= 3 && pos.x <= 5;
    if (side === 'red') {
      return inPalaceX && pos.y >= 0 && pos.y <= 2; // 红方九宫格在0-2行
    } else {
      return inPalaceX && pos.y >= 7 && pos.y <= 9; // 黑方九宫格在7-9行
    }
  }

  /**
   * 检查位置是否在己方半场
   * 红方半场：y <= 4（第0-4行）
   * 黑方半场：y >= 5（第5-9行）
   */
  static isInOwnSide(pos: Position, side: Side): boolean {
    if (side === 'red') {
      return pos.y <= 4;
    } else {
      return pos.y >= 5;
    }
  }

  /**
   * 获取棋子的合法移动位置
   */
  static getLegalMoves(piece: Piece, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const { type, side, position } = piece;

    switch (type) {
      case 'king':
        moves.push(...this.getKingMoves(position, side, board));
        break;
      case 'advisor':
        moves.push(...this.getAdvisorMoves(position, side, board));
        break;
      case 'elephant':
        moves.push(...this.getElephantMoves(position, side, board));
        break;
      case 'horse':
        moves.push(...this.getHorseMoves(position, board));
        break;
      case 'chariot':
        moves.push(...this.getChariotMoves(position, board));
        break;
      case 'cannon':
        moves.push(...this.getCannonMoves(position, board));
        break;
      case 'pawn':
        moves.push(...this.getPawnMoves(position, side, board));
        break;
    }

    console.log(`DEBUG: ${type}(${side}) 移动数量:`, moves.length, moves);
    return moves;
  }

  /**
   * 帅/将的移动规则
   */
  private static getKingMoves(pos: Position, side: Side, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

    for (const dir of directions) {
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (this.isInPalace(newPos, side)) {
        const targetPiece = board[newPos.y][newPos.x];
        if (!targetPiece || targetPiece.side !== side) {
          moves.push(newPos);
        }
      }
    }

    // 检查飞将规则（帅将对面）
    const enemySide = side === 'red' ? 'black' : 'red';
    const enemyKing = this.findKing(enemySide, board);
    if (enemyKing && pos.x === enemyKing.x) {
      let blocked = false;
      const startY = Math.min(pos.y, enemyKing.y) + 1;
      const endY = Math.max(pos.y, enemyKing.y);
      for (let y = startY; y < endY; y++) {
        if (board[y][pos.x]) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        moves.push(enemyKing);
      }
    }

    return moves;
  }

  /**
   * 仕/士的移动规则
   */
  private static getAdvisorMoves(pos: Position, side: Side, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const directions = [{ x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }];

    for (const dir of directions) {
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (this.isInPalace(newPos, side)) {
        const targetPiece = board[newPos.y][newPos.x];
        if (!targetPiece || targetPiece.side !== side) {
          moves.push(newPos);
        }
      }
    }

    return moves;
  }

  /**
   * 相/象的移动规则
   */
  private static getElephantMoves(pos: Position, side: Side, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const directions = [{ x: 2, y: 2 }, { x: 2, y: -2 }, { x: -2, y: 2 }, { x: -2, y: -2 }];
    const blockPositions = [{ x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }];

    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      const blockPos = blockPositions[i];
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      const blockingPos = { x: pos.x + blockPos.x, y: pos.y + blockPos.y };

      if (this.isValidPosition(newPos) && this.isInOwnSide(newPos, side)) {
        // 检查是否被憋象眼
        if (!board[blockingPos.y][blockingPos.x]) {
          const targetPiece = board[newPos.y][newPos.x];
          if (!targetPiece || targetPiece.side !== side) {
            moves.push(newPos);
          }
        }
      }
    }

    return moves;
  }

  /**
   * 马的移动规则
   */
  private static getHorseMoves(pos: Position, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const horseMoves = [
      { move: { x: 2, y: 1 }, block: { x: 1, y: 0 } },
      { move: { x: 2, y: -1 }, block: { x: 1, y: 0 } },
      { move: { x: -2, y: 1 }, block: { x: -1, y: 0 } },
      { move: { x: -2, y: -1 }, block: { x: -1, y: 0 } },
      { move: { x: 1, y: 2 }, block: { x: 0, y: 1 } },
      { move: { x: -1, y: 2 }, block: { x: 0, y: 1 } },
      { move: { x: 1, y: -2 }, block: { x: 0, y: -1 } },
      { move: { x: -1, y: -2 }, block: { x: 0, y: -1 } }
    ];

    for (const { move, block } of horseMoves) {
      const newPos = { x: pos.x + move.x, y: pos.y + move.y };
      const blockPos = { x: pos.x + block.x, y: pos.y + block.y };

      if (this.isValidPosition(newPos)) {
        // 检查是否被憋马腿
        if (!board[blockPos.y][blockPos.x]) {
          const targetPiece = board[newPos.y][newPos.x];
          const piece = board[pos.y][pos.x];
          if (!targetPiece || (piece && targetPiece.side !== piece.side)) {
            moves.push(newPos);
          }
        }
      }
    }

    return moves;
  }

  /**
   * 车的移动规则
   */
  private static getChariotMoves(pos: Position, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
    const piece = board[pos.y][pos.x];

    for (const dir of directions) {
      for (let i = 1; i < 10; i++) {
        const newPos = { x: pos.x + dir.x * i, y: pos.y + dir.y * i };
        if (!this.isValidPosition(newPos)) break;

        const targetPiece = board[newPos.y][newPos.x];
        if (!targetPiece) {
          moves.push(newPos);
        } else {
          if (piece && targetPiece.side !== piece.side) {
            moves.push(newPos);
          }
          break;
        }
      }
    }

    return moves;
  }

  /**
   * 炮的移动规则
   */
  private static getCannonMoves(pos: Position, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
    const piece = board[pos.y][pos.x];

    for (const dir of directions) {
      let foundBarrier = false;
      for (let i = 1; i < 10; i++) {
        const newPos = { x: pos.x + dir.x * i, y: pos.y + dir.y * i };
        if (!this.isValidPosition(newPos)) break;

        const targetPiece = board[newPos.y][newPos.x];
        if (!foundBarrier) {
          if (!targetPiece) {
            moves.push(newPos);
          } else {
            foundBarrier = true;
          }
        } else {
          if (targetPiece) {
            if (piece && targetPiece.side !== piece.side) {
              moves.push(newPos);
            }
            break;
          }
        }
      }
    }

    return moves;
  }

  /**
   * 兵/卒的移动规则
   */
  private static getPawnMoves(pos: Position, side: Side, board: (Piece | null)[][]): Position[] {
    const moves: Position[] = [];
    const piece = board[pos.y][pos.x];

    if (side === 'red') {
      // 红兵向上移动（从下方0-4行向上到5-9行）
      const upPos = { x: pos.x, y: pos.y + 1 };
      if (this.isValidPosition(upPos)) {
        const targetPiece = board[upPos.y][upPos.x];
        if (!targetPiece || targetPiece.side !== side) {
          moves.push(upPos);
        }
      }

      // 红兵过河后（进入黑方半场y >= 5）可以左右移动
      if (pos.y >= 5) {
        const leftPos = { x: pos.x - 1, y: pos.y };
        const rightPos = { x: pos.x + 1, y: pos.y };
        
        if (this.isValidPosition(leftPos)) {
          const targetPiece = board[leftPos.y][leftPos.x];
          if (!targetPiece || targetPiece.side !== side) {
            moves.push(leftPos);
          }
        }
        
        if (this.isValidPosition(rightPos)) {
          const targetPiece = board[rightPos.y][rightPos.x];
          if (!targetPiece || targetPiece.side !== side) {
            moves.push(rightPos);
          }
        }
      }
    } else {
      // 黑卒向下移动（从上方5-9行向下到0-4行）
      const downPos = { x: pos.x, y: pos.y - 1 };
      if (this.isValidPosition(downPos)) {
        const targetPiece = board[downPos.y][downPos.x];
        if (!targetPiece || targetPiece.side !== side) {
          moves.push(downPos);
        }
      }

      // 黑卒过河后（进入红方半场y <= 4）可以左右移动
      if (pos.y <= 4) {
        const leftPos = { x: pos.x - 1, y: pos.y };
        const rightPos = { x: pos.x + 1, y: pos.y };
        
        if (this.isValidPosition(leftPos)) {
          const targetPiece = board[leftPos.y][leftPos.x];
          if (!targetPiece || targetPiece.side !== side) {
            moves.push(leftPos);
          }
        }
        
        if (this.isValidPosition(rightPos)) {
          const targetPiece = board[rightPos.y][rightPos.x];
          if (!targetPiece || targetPiece.side !== side) {
            moves.push(rightPos);
          }
        }
      }
    }

    return moves;
  }

  /**
   * 查找指定方的帅/将
   */
  private static findKing(side: Side, board: (Piece | null)[][]): Position | null {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = board[y][x];
        if (piece && piece.type === 'king' && piece.side === side) {
          return { x, y };
        }
      }
    }
    return null;
  }

  /**
   * 检查指定方是否被将军 (已禁用)
   */
  // static isInCheck(side: Side, board: (Piece | null)[][]): boolean {
  //   const kingPos = this.findKing(side, board);
  //   if (!kingPos) {
  //     console.log(`DEBUG: 找不到 ${side} 方的将/帅`);
  //     return false;
  //   }

  //   console.log(`DEBUG: 检查 ${side} 方是否被将军，将/帅位置:`, kingPos);
  //   const enemySide = side === 'red' ? 'black' : 'red';
    
  //   // 检查所有敌方棋子是否能攻击到己方帅/将
  //   for (let y = 0; y < 10; y++) {
  //     for (let x = 0; x < 9; x++) {
  //       const piece = board[y][x];
  //       if (piece && piece.side === enemySide) {
  //         const moves = this.getLegalMovesWithoutCheckValidation(piece, board);
  //         if (moves.some(move => move.x === kingPos.x && move.y === kingPos.y)) {
  //           console.log(`DEBUG: ${enemySide} 方的 ${piece.type} 在 (${x},${y}) 可以攻击到 ${side} 方的将/帅`);
  //           return true;
  //         }
  //       }
  //     }
  //   }

  //   console.log(`DEBUG: ${side} 方没有被将军`);
  //   return false;
  // }

  /**
   * 获取合法移动（不验证将军状态，避免递归）
   */
  private static getLegalMovesWithoutCheckValidation(piece: Piece, board: (Piece | null)[][]): Position[] {
    const { type, side, position } = piece;

    switch (type) {
      case 'king':
        return this.getKingMoves(position, side, board);
      case 'advisor':
        return this.getAdvisorMoves(position, side, board);
      case 'elephant':
        return this.getElephantMoves(position, side, board);
      case 'horse':
        return this.getHorseMoves(position, board);
      case 'chariot':
        return this.getChariotMoves(position, board);
      case 'cannon':
        return this.getCannonMoves(position, board);
      case 'pawn':
        return this.getPawnMoves(position, side, board);
      default:
        return [];
    }
  }

  /**
   * 检查是否将死 (已禁用)
   */
  // static isCheckmate(side: Side, board: (Piece | null)[][]): boolean {
  //   if (!this.isInCheck(side, board)) return false;

  //   // 检查是否有任何合法移动可以解除将军
  //   for (let y = 0; y < 10; y++) {
  //     for (let x = 0; x < 9; x++) {
  //       const piece = board[y][x];
  //       if (piece && piece.side === side) {
  //         const moves = this.getLegalMoves(piece, board);
  //         if (moves.length > 0) {
  //           return false;
  //         }
  //       }
  //     }
  //   }

  //   return true;
  // }

  /**
   * 检查是否和棋 (已禁用)
   */
  // static isStalemate(side: Side, board: (Piece | null)[][]): boolean {
  //   if (this.isInCheck(side, board)) return false;

  //   // 检查是否有任何合法移动
  //   for (let y = 0; y < 10; y++) {
  //     for (let x = 0; x < 9; x++) {
  //       const piece = board[y][x];
  //       if (piece && piece.side === side) {
  //         const moves = this.getLegalMoves(piece, board);
  //         if (moves.length > 0) {
  //           return false;
  //         }
  //       }
  //     }
  //   }

  //   return true;
  // }

  /**
   * 执行移动
   */
  static makeMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
    const newBoard = board.map(row => [...row]);
    const { from, to } = move;
    
    const piece = newBoard[from.y][from.x];
    if (piece) {
      // 关键修复：创建新的棋子对象并更新position属性
      // 确保棋子的position属性与其在棋盘数组中的位置保持同步
      const updatedPiece = {
        ...piece,
        position: { x: to.x, y: to.y }
      };
      
      console.log('DEBUG: 移动棋子位置更新', {
        pieceId: piece.id,
        oldPosition: piece.position,
        newPosition: { x: to.x, y: to.y },
        from,
        to
      });
      
      newBoard[to.y][to.x] = updatedPiece;
      newBoard[from.y][from.x] = null;
    }
    
    return newBoard;
  }

  /**
   * 验证移动是否合法
   */
  static isValidMove(piece: Piece, to: Position, board: (Piece | null)[][]): boolean {
    const legalMoves = this.getLegalMoves(piece, board);
    return legalMoves.some(move => move.x === to.x && move.y === to.y);
  }

  /**
   * 获取游戏状态
   */
  static getGameStatus(currentPlayer: Side, board: (Piece | null)[][]): GameStatus {
    // 检查红方将/帅是否还存在
    const redKing = this.findKing('red', board);
    if (!redKing) {
      return currentPlayer === 'red' ? 'checkmate' : 'playing';
    }
    
    // 检查黑方将/帅是否还存在
    const blackKing = this.findKing('black', board);
    if (!blackKing) {
      return currentPlayer === 'black' ? 'checkmate' : 'playing';
    }
    
    return 'playing';
  }

  /**
   * 获取所有合法移动
   */
  static getAllLegalMoves(side: Side, board: (Piece | null)[][]): Array<{ from: Position; to: Position; piece: Piece }> {
    const moves: Array<{ from: Position; to: Position; piece: Piece }> = [];
    
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = board[y][x];
        if (piece && piece.side === side) {
          const from: Position = { x, y };
          const legalMoves = this.getLegalMoves(piece, board);
          
          legalMoves.forEach(to => {
            moves.push({ from, to, piece });
          });
        }
      }
    }
    
    return moves;
  }

  /**
   * 将棋盘状态转换为FEN格式
   */
  static boardToFEN(board: (Piece | null)[][], currentPlayer: Side): string {
    let fen = '';
    
    // 根据新的棋盘布局：Row 0-4 = 红方，Row 5-9 = 黑方
    // FEN格式要求：从棋盘最高行(y=9)到最低行(y=0)
    // 红方棋子用大写，黑方棋子用小写
    for (let y = 9; y >= 0; y--) {
      let emptyCount = 0;
      
      for (let x = 0; x < 9; x++) {
        const piece = board[y][x];
        
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }
          
          // 转换棋子为FEN符号 - 使用与皮卡鱼引擎兼容的映射
          let pieceChar = '';
          switch (piece.type) {
            case 'king': pieceChar = 'k'; break;
            case 'advisor': pieceChar = 'a'; break;
            case 'elephant': pieceChar = 'b'; break; // 修正：使用'b'而不是'e'
            case 'horse': pieceChar = 'n'; break;    // 修正：使用'n'而不是'h'
            case 'chariot': pieceChar = 'r'; break;
            case 'cannon': pieceChar = 'c'; break;
            case 'pawn': pieceChar = 'p'; break;
          }
          
          // 红方棋子用大写，黑方棋子用小写
          if (piece.side === 'red') {
            pieceChar = pieceChar.toUpperCase();
          }
          
          fen += pieceChar;
        } else {
          emptyCount++;
        }
      }
      
      if (emptyCount > 0) {
        fen += emptyCount.toString();
      }
      
      if (y > 0) {
        fen += '/';
      }
    }
    
    // 添加当前玩家 - 注意：中国象棋FEN格式中，'w'表示红方，'b'表示黑方
    // 但有些AI引擎可能期望不同的格式，需要确认Pikafish引擎的期望格式
    fen += ' ' + (currentPlayer === 'red' ? 'w' : 'b');
    
    console.log('DEBUG: FEN生成详情（符合皮卡鱼Wiki标准）', {
      currentPlayer,
      fenPlayer: currentPlayer === 'red' ? 'w' : 'b',
      boardLayout: {
        row9_黑方底线: board[9].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row8: board[8].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row7: board[7].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row6: board[6].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row5: board[5].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row4: board[4].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row3: board[3].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row2: board[2].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row1: board[1].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join(''),
        row0_红方底线: board[0].map(p => p ? `${p.side[0]}${p.type[0]}` : '.').join('')
      },
      fenRows: fen.split(' ')[0].split('/'),
      fenMapping: {
        'FEN第1行(y=9黑方底线)': fen.split('/')[0],
        'FEN第2行(y=8)': fen.split('/')[1],
        'FEN第3行(y=7)': fen.split('/')[2],
        'FEN第4行(y=6)': fen.split('/')[3],
        'FEN第5行(y=5)': fen.split('/')[4],
        'FEN第6行(y=4)': fen.split('/')[5],
        'FEN第7行(y=3)': fen.split('/')[6],
        'FEN第8行(y=2)': fen.split('/')[7],
        'FEN第9行(y=1)': fen.split('/')[8],
        'FEN第10行(y=0红方底线)': fen.split('/')[9]
      },
      pieceMapping: {
        '大写=红方': 'KARNBCP',
        '小写=黑方': 'karnbcp',
        '映射规则': 'k帅将 a士 r车 n马 b象 c炮 p兵卒'
      },
      completeFEN: fen + ' - - 0 1'
    });
    
    // 添加其他FEN信息（简化版本）
    fen += ' - - 0 1';
    
    return fen;
  }
}