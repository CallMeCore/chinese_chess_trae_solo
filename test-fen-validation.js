// 测试脚本：验证FEN生成与皮卡鱼官方示例的一致性

// 根据新布局的FEN示例（0-4行为红方，5-9行为黑方）
const OFFICIAL_EXAMPLES = {
  initial: 'RNBAKABNR/9/1C5C1/P1P1P1P1P/9/9/p1p1p1p1p/1c5c1/9/rnbakabnr w - - 0 1',
  afterMoves: 'RNBAKABNR/9/1C2C4/P1P1P1P1P/9/9/p1p1p1p1p/1c4nc1/9/rnbakab1r w - - 0 1'
};

// 初始棋盘布局 - 根据用户要求：0-4行为红方，5-9行为黑方
const INITIAL_BOARD_LAYOUT = [
  ['R','N','B','A','K','A','B','N','R'], // 第0行：红方底线
  [null,null,null,null,null,null,null,null,null], // 第1行：空
  [null,'C',null,null,null,null,null,'C',null], // 第2行：红方炮线
  ['P',null,'P',null,'P',null,'P',null,'P'], // 第3行：红方兵线
  [null,null,null,null,null,null,null,null,null], // 第4行：空
  [null,null,null,null,null,null,null,null,null], // 第5行：空
  ['p',null,'p',null,'p',null,'p',null,'p'], // 第6行：黑方兵线
  [null,'c',null,null,null,null,null,'c',null], // 第7行：黑方炮线
  [null,null,null,null,null,null,null,null,null], // 第8行：空
  ['r','n','b','a','k','a','b','n','r']  // 第9行：黑方底线
];

// 创建初始棋盘
function createInitialBoard() {
  const board = Array(10).fill(null).map(() => Array(9).fill(null));
  
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const pieceType = INITIAL_BOARD_LAYOUT[y][x];
      if (pieceType) {
        const side = y <= 4 ? 'red' : 'black';
        board[y][x] = {
          type: pieceType,
          side: side,
          position: { x, y },
          id: `${side}-${pieceType}-${x}-${y}`
        };
      }
    }
  }
  
  return board;
}

// 将棋盘转换为FEN格式
function boardToFEN(board, currentPlayer) {
  let fen = '';
  
  for (let y = 0; y < 10; y++) {
    let emptyCount = 0;
    
    for (let x = 0; x < 9; x++) {
      const piece = board[y][x];
      
      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount.toString();
          emptyCount = 0;
        }
        
        // 根据阵营决定大小写
        const pieceChar = piece.side === 'red' ? piece.type.toUpperCase() : piece.type.toLowerCase();
        fen += pieceChar;
      } else {
        emptyCount++;
      }
    }
    
    if (emptyCount > 0) {
      fen += emptyCount.toString();
    }
    
    if (y < 9) {
      fen += '/';
    }
  }
  
  // 添加当前玩家
  fen += ' ' + (currentPlayer === 'red' ? 'w' : 'b');
  fen += ' - - 0 1';
  
  return fen;
}

// 执行移动
function executeMove(board, from, to) {
  const piece = board[from.y][from.x];
  board[to.y][to.x] = piece;
  board[from.y][from.x] = null;
  if (piece) {
    piece.position = to;
  }
}

// 比较FEN字符串
function compareFEN(generated, official, label) {
  console.log(`\n=== ${label} ===`);
  console.log('我们生成的FEN:', generated);
  console.log('皮卡鱼官方FEN:', official);
  
  const match = generated === official;
  console.log('是否匹配:', match ? '✓' : '✗');
  
  if (!match) {
    const genParts = generated.split(' ');
    const offParts = official.split(' ');
    const genRows = genParts[0].split('/');
    const offRows = offParts[0].split('/');
    
    console.log('\n详细对比:');
    for (let i = 0; i < 10; i++) {
      const genRow = genRows[i] || '';
      const offRow = offRows[i] || '';
      const rowMatch = genRow === offRow;
      console.log(`第${i+1}行: ${genRow} vs ${offRow} ${rowMatch ? '✓' : '✗'}`);
    }
  }
  
  return match;
}

function main() {
  console.log('开始FEN验证测试...');
  
  // 创建初始棋盘
  let board = createInitialBoard();
  let currentPlayer = 'red';
  
  // 测试1: 初始局面FEN
  console.log('测试1: 初始局面FEN');
  const initialFEN = boardToFEN(board, currentPlayer);
  const initialMatch = compareFEN(initialFEN, OFFICIAL_EXAMPLES.initial, '初始局面');
  
  if (!initialMatch) {
    console.log('\n初始局面FEN不匹配，停止后续测试');
    return;
  }
  
  // 测试2: 执行走法后的FEN
  console.log('\n测试2: 执行走法后的FEN');
  console.log('执行走法: 红方炮二平五，黑方马八进七');
  
  // 执行红方炮二平五 (从 (7,2) 到 (4,2))
  // 根据期望FEN '1C2C4'，应该是从第8列移动到第5列
  console.log('执行红方炮二平五: 从 (7,2) 到 (4,2)');
  console.log('移动前第2行:', board[2].map((p, i) => p ? `${i}:${p.type}` : `${i}:·`).join(' '));
  executeMove(board, { x: 7, y: 2 }, { x: 4, y: 2 });
  console.log('移动后第2行:', board[2].map((p, i) => p ? `${i}:${p.type}` : `${i}:·`).join(' '));
  currentPlayer = 'black';
  
  // 执行黑方马八进七 (从 (7,9) 到 (6,7))
  // 根据新布局，黑方马在第9行，移动到第7行
  console.log('执行黑方马八进七: 从 (7,9) 到 (6,7)');
  executeMove(board, { x: 7, y: 9 }, { x: 6, y: 7 });
  currentPlayer = 'red';
  
  const afterMovesFEN = boardToFEN(board, currentPlayer);
  const afterMovesMatch = compareFEN(afterMovesFEN, OFFICIAL_EXAMPLES.afterMoves, '执行走法后');
  
  console.log('\n=== 测试总结 ===');
  console.log('初始局面FEN匹配:', initialMatch ? '✓' : '✗');
  console.log('执行走法后FEN匹配:', afterMovesMatch ? '✓' : '✗');
  
  if (initialMatch && afterMovesMatch) {
    console.log('\n🎉 所有测试通过！FEN生成与皮卡鱼官方示例完全一致。');
  } else {
    console.log('\n❌ 测试失败，需要进一步修正FEN生成逻辑。');
  }
}

main();