/**
 * 测试真正的皮卡鱼引擎
 * 验证后端API和引擎通信是否正常
 */

// 使用Node.js 18+内置的fetch API

const API_BASE = 'http://localhost:3001/api/engine';

async function testEngine() {
  try {
    console.log('=== 测试真正的皮卡鱼引擎 ===');
    
    // 1. 检查引擎状态
    console.log('\n1. 检查引擎状态...');
    const statusResponse = await fetch(`${API_BASE}/status`);
    const status = await statusResponse.json();
    console.log('引擎状态:', status);
    
    if (!status.ready || !status.processRunning) {
      console.log('引擎未就绪，尝试初始化...');
      const initResponse = await fetch(`${API_BASE}/init`, { method: 'POST' });
      const initResult = await initResponse.json();
      console.log('初始化结果:', initResult);
      
      // 等待引擎就绪
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 2. 设置初始棋盘位置
    console.log('\n2. 设置初始棋盘位置...');
    const initialFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    const positionResponse = await fetch(`${API_BASE}/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: initialFen })
    });
    const positionResult = await positionResponse.json();
    console.log('设置位置结果:', positionResult);
    
    // 3. 请求AI移动
    console.log('\n3. 请求AI移动...');
    const moveResponse = await fetch(`${API_BASE}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeLimit: 3000, depth: 8 })
    });
    const moveResult = await moveResponse.json();
    console.log('AI移动结果:', moveResult);
    
    if (moveResult.move) {
      console.log('✅ 真正的皮卡鱼引擎工作正常！');
      console.log('AI建议移动:', moveResult.move);
      if (moveResult.score !== undefined) {
        console.log('评估分数:', moveResult.score);
      }
      if (moveResult.depth !== undefined) {
        console.log('搜索深度:', moveResult.depth);
      }
    } else {
      console.log('❌ AI移动失败:', moveResult.error || '未知错误');
      console.log('完整响应:', moveResult);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error.message);
  }
}

// 运行测试
testEngine();