// 分析走法序列：红方炮二平五，黑方马八进七

// 初始局面FEN: rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1

// 棋盘坐标系统：
// - x轴：0-8 (从左到右)
// - y轴：0-9 (从上到下，第0行是黑方底线，第9行是红方底线)

// 中国象棋记谱法坐标转换：
// 红方视角（从下往上看）：右边是第一列，从右到左编号1-9
// 黑方视角（从上往下看）：右边是第一列，从右到左编号1-9
// 棋盘x坐标转换：
// - 红方：列号n -> x坐标 = 9-n (例如：二路 -> x=7, 五路 -> x=4)
// - 黑方：列号n -> x坐标 = 9-n (例如：八路 -> x=1, 七路 -> x=2)

// 走法分析：
// 1. 红方炮二平五
//    - 红方视角："二路"(右边第2列) -> x=9-2=7，"五路"(右边第5列) -> x=9-5=4
//    - 红方炮在初始局面位于第7行（y=7）
//    - 从(7,7)移动到(4,7)
//    - UCI表示法：h2e2

// 2. 黑方马八进七
//    - 黑方视角："八路"(右边第8列) -> x=9-8=1，"七路"(右边第7列) -> x=9-7=2
//    - 黑方马在初始局面位于第0行（y=0）
//    - 马的移动：从(1,0)到(2,2) - 马走日字
//    - UCI表示法：b10c8

// 验证走法合法性
function analyzeMove() {
    console.log('=== 走法分析 ===');
    
    // 初始局面棋盘状态
    const initialBoard = [
        ['r','n','b','a','k','a','b','n','r'], // 第0行：黑方底线
        [null,null,null,null,null,null,null,null,null], // 第1行：空
        [null,'c',null,null,null,null,null,'c',null], // 第2行：黑方炮线
        ['p',null,'p',null,'p',null,'p',null,'p'], // 第3行：黑方兵线
        [null,null,null,null,null,null,null,null,null], // 第4行：空
        [null,null,null,null,null,null,null,null,null], // 第5行：空
        ['P',null,'P',null,'P',null,'P',null,'P'], // 第6行：红方兵线
        [null,'C',null,null,null,null,null,'C',null], // 第7行：红方炮线
        [null,null,null,null,null,null,null,null,null], // 第8行：空
        ['R','N','B','A','K','A','B','N','R']  // 第9行：红方底线
    ];
    
    console.log('初始局面：');
    printBoard(initialBoard);
    
    // 第1步：红方炮二平五 (7,7) -> (4,7)
    console.log('\n第1步：红方炮二平五');
    console.log('从位置 (7,7) 移动到 (4,7)');
    console.log('移动前 (7,7):', initialBoard[7][7]); // 应该是 'C'
    console.log('移动后 (4,7):', initialBoard[7][4]); // 应该是 null
    
    // 执行第1步移动
    const boardAfterMove1 = JSON.parse(JSON.stringify(initialBoard));
    boardAfterMove1[7][4] = boardAfterMove1[7][7]; // 炮移动到新位置
    boardAfterMove1[7][7] = null; // 原位置清空
    
    console.log('\n执行第1步后的棋盘：');
    printBoard(boardAfterMove1);
    
    // 第2步：黑方马八进七 (1,0) -> (2,2)
    console.log('\n第2步：黑方马八进七');
    console.log('从位置 (1,0) 移动到 (2,2)');
    console.log('移动前 (1,0):', boardAfterMove1[0][1]); // 应该是 'n'
    console.log('移动后 (2,2):', boardAfterMove1[2][2]); // 应该是 null
    
    // 验证马的移动是否合法（马走日字）
    const dx = Math.abs(2 - 1); // |2-1| = 1
    const dy = Math.abs(2 - 0); // |2-0| = 2
    const isValidHorseMove = (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
    console.log('马的移动是否合法:', isValidHorseMove);
    
    // 执行第2步移动
    const boardAfterMove2 = JSON.parse(JSON.stringify(boardAfterMove1));
    boardAfterMove2[2][2] = boardAfterMove2[0][1]; // 马移动到新位置
    boardAfterMove2[0][1] = null; // 原位置清空
    
    console.log('\n执行第2步后的棋盘：');
    printBoard(boardAfterMove2);
    
    // 生成最终FEN
    const finalFEN = boardToFEN(boardAfterMove2, 'red'); // 轮到红方
    console.log('\n最终FEN字符串:', finalFEN);
    
    return {
        initialBoard,
        boardAfterMove1,
        boardAfterMove2,
        finalFEN
    };
}

// 打印棋盘
function printBoard(board) {
    for (let y = 0; y < 10; y++) {
        const row = board[y].map(piece => piece || '·').join(' ');
        console.log(`第${y}行: ${row}`);
    }
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
                fen += piece;
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

// 执行分析
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { analyzeMove };
} else {
    analyzeMove();
}