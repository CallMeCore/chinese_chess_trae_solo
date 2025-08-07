/**
 * AI调试测试脚本
 * 测试AI移动请求的完整流程，包括详细的调试日志
 */

const API_BASE = 'http://localhost:3001/api/engine';

async function testAIDebugFlow() {
  console.log('🚀 开始AI调试测试流程');
  
  try {
    // 1. 初始化引擎
    console.log('\n1️⃣ 初始化引擎...');
    const initResponse = await fetch(`${API_BASE}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const initResult = await initResponse.json();
    console.log('初始化结果:', initResult);
    
    if (!initResult.success) {
      throw new Error('引擎初始化失败');
    }
    
    // 2. 设置棋盘位置（使用用户提供的FEN）
    console.log('\n2️⃣ 设置棋盘位置...');
    const testFen = '1nbakab1r/9/1r2c1n2/pCR5p/9/9/P1P3P1P/4B1N2/4A4/cNB1KA3 b - - 0 1';
    console.log('使用FEN:', testFen);
    
    const positionResponse = await fetch(`${API_BASE}/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: testFen })
    });
    const positionResult = await positionResponse.json();
    console.log('设置位置结果:', positionResult);
    
    if (!positionResult.success) {
      throw new Error('设置棋盘位置失败');
    }
    
    // 3. 请求AI移动（带详细调试）
    console.log('\n3️⃣ 请求AI移动...');
    const moveRequest = {
      timeLimit: 3000,
      depth: 8
    };
    console.log('移动请求参数:', moveRequest);
    
    const startTime = Date.now();
    console.log('发送时间:', new Date(startTime).toISOString());
    
    const moveResponse = await fetch(`${API_BASE}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moveRequest)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log('响应时间:', new Date(endTime).toISOString());
    console.log('请求耗时:', duration + 'ms');
    
    console.log('HTTP响应状态:', {
      status: moveResponse.status,
      statusText: moveResponse.statusText,
      ok: moveResponse.ok,
      headers: Object.fromEntries(moveResponse.headers.entries())
    });
    
    if (!moveResponse.ok) {
      const errorText = await moveResponse.text();
      console.error('HTTP错误响应:', errorText);
      throw new Error(`HTTP错误: ${moveResponse.status} ${moveResponse.statusText}`);
    }
    
    const moveResult = await moveResponse.json();
    console.log('\n✅ AI移动结果:', moveResult);
    
    if (moveResult.move) {
      console.log('🎯 成功获得AI移动:', {
        move: moveResult.move,
        from: moveResult.move.from,
        to: moveResult.move.to,
        uciString: moveResult.move.from + moveResult.move.to,
        score: moveResult.score,
        depth: moveResult.depth,
        time: moveResult.time
      });
    } else {
      console.error('❌ 响应中没有移动信息');
    }
    
    console.log('\n🎉 AI调试测试完成！');
    
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// 运行测试
testAIDebugFlow();