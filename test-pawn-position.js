// 测试红方兵的初始位置
const { XiangqiEngine } = require('./src/lib/xiangqi-engine.ts');
const { INITIAL_BOARD_LAYOUT } = require('./src/types/xiangqi.ts');

console.log('INITIAL_BOARD_LAYOUT:');
INITIAL_BOARD_LAYOUT.forEach((row, y) => {
  console.log(`Row ${y}:`, row);
});

console.log('\n创建初始棋盘...');
const board = XiangqiEngine.createInitialBoard();

console.log('\n红方兵的位置:');
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 9; x++) {
    const piece = board[y][x];
    if (piece && piece.type === 'pawn' && piece.side === 'red') {
      console.log(`红兵在位置 (${x}, ${y}), position属性: (${piece.position.x}, ${piece.position.y})`);
    }
  }
}

console.log('\n测试红兵移动:');
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 9; x++) {
    const piece = board[y][x];
    if (piece && piece.type === 'pawn' && piece.side === 'red') {
      const legalMoves = XiangqiEngine.getLegalMoves(piece, board);
      console.log(`红兵 (${x}, ${y}) 的合法移动:`, legalMoves);
    }
  }
}