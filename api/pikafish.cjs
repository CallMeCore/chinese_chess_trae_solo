/**
 * 皮卡鱼引擎后端API
 * 通过child_process启动pikafish.exe进程，实现UCI协议通信
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 皮卡鱼引擎进程管理
class PikafishEngineManager {
  constructor() {
    this.process = null;
    this.isReady = false;
    this.pendingCommands = [];
    this.moveCallback = null;
    
    // 检测操作系统平台
    const platform = process.platform;
    console.log('检测到操作系统平台:', platform);
    
    // 根据平台选择正确的引擎可执行文件
    let engineFileName;
    if (platform === 'win32') {
      engineFileName = 'pikafish.exe';
      console.log('使用Windows版本的Pikafish引擎');
    } else {
      engineFileName = 'pikafish';
      console.log('使用Linux版本的Pikafish引擎');
    }
    
    this.enginePath = path.join(__dirname, '..', 'engines', engineFileName);
    this.nnuePath = path.join(__dirname, '..', 'engines', 'pikafish.nnue');
    
    console.log('引擎路径:', this.enginePath);
  }

  async initialize() {
    try {
      console.log('启动皮卡鱼引擎:', this.enginePath);
      
      // 启动pikafish.exe进程
      this.process = spawn(this.enginePath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(this.enginePath)
      });

      // 处理引擎输出
      this.process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log('引擎输出:', output);
        this.handleEngineOutput(output);
      });

      // 处理引擎错误
      this.process.stderr.on('data', (data) => {
        console.error('引擎错误:', data.toString());
      });

      // 处理进程退出
      this.process.on('exit', (code) => {
        console.log('引擎进程退出，代码:', code);
        this.isReady = false;
        this.process = null;
      });

      // 初始化UCI协议
      await this.sendCommand('uci');
      
      // 等待引擎就绪
      await new Promise((resolve) => {
        const checkReady = () => {
          if (this.isReady) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      console.log('皮卡鱼引擎初始化完成');
      return true;
    } catch (error) {
      console.error('初始化皮卡鱼引擎失败:', error);
      return false;
    }
  }

  handleEngineOutput(output) {
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      console.log('处理引擎消息:', line);
      
      if (line === 'uciok') {
        this.sendCommand('isready');
      } else if (line === 'readyok') {
        this.isReady = true;
        // 发送待处理的命令
        this.pendingCommands.forEach(cmd => this.sendCommand(cmd));
        this.pendingCommands = [];
      } else if (line.startsWith('bestmove')) {
        const parts = line.split(' ');
        const moveStr = parts[1];
        
        if (moveStr && moveStr !== '(none)' && moveStr.length >= 4) {
          const move = {
            from: moveStr.substring(0, 2),
            to: moveStr.substring(2, 4),
            promotion: moveStr.length > 4 ? moveStr.substring(4) : undefined
          };
          
          if (this.moveCallback) {
            this.moveCallback(move);
            this.moveCallback = null;
          }
        }
      } else if (line.startsWith('info')) {
        // 处理引擎分析信息
        console.log('引擎分析信息:', line);
      }
    }
  }

  sendCommand(command) {
    if (!this.process || !this.process.stdin.writable) {
      console.error('引擎进程不可用');
      return false;
    }

    if (!this.isReady && command !== 'uci' && command !== 'isready') {
      this.pendingCommands.push(command);
      return true;
    }

    console.log('发送命令到引擎:', command);
    this.process.stdin.write(command + '\n');
    return true;
  }

  setPosition(fen) {
    return this.sendCommand(`position fen ${fen}`);
  }

  requestMove(timeLimit = 3000, depth = 8) {
    return new Promise((resolve, reject) => {
      this.moveCallback = resolve;
      
      const goCommand = `go movetime ${timeLimit} depth ${depth}`;
      if (!this.sendCommand(goCommand)) {
        reject(new Error('发送移动命令失败'));
      }
      
      // 设置超时
      setTimeout(() => {
        if (this.moveCallback) {
          this.moveCallback = null;
          reject(new Error('引擎响应超时'));
        }
      }, timeLimit + 5000);
    });
  }

  stop() {
    this.sendCommand('stop');
  }

  quit() {
    if (this.process) {
      this.sendCommand('quit');
      setTimeout(() => {
        if (this.process) {
          this.process.kill();
        }
      }, 1000);
    }
  }
}

// 创建引擎管理器实例
const engineManager = new PikafishEngineManager();

// API路由

// 初始化引擎
app.post('/api/engine/init', async (req, res) => {
  try {
    const success = await engineManager.initialize();
    res.json({ success, ready: engineManager.isReady });
  } catch (error) {
    console.error('初始化引擎API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 设置棋盘位置
app.post('/api/engine/position', (req, res) => {
  try {
    const { fen } = req.body;
    if (!fen) {
      return res.status(400).json({ error: 'FEN字符串是必需的' });
    }
    
    const success = engineManager.setPosition(fen);
    res.json({ success });
  } catch (error) {
    console.error('设置位置API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 请求AI移动
app.post('/api/engine/move', async (req, res) => {
  try {
    const { timeLimit = 3000, depth = 8 } = req.body;
    
    const move = await engineManager.requestMove(timeLimit, depth);
    res.json({ move });
  } catch (error) {
    console.error('请求移动API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 停止引擎思考
app.post('/api/engine/stop', (req, res) => {
  try {
    engineManager.stop();
    res.json({ success: true });
  } catch (error) {
    console.error('停止引擎API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取引擎状态
app.get('/api/engine/status', (req, res) => {
  res.json({ 
    ready: engineManager.isReady,
    processRunning: !!engineManager.process
  });
});

// 关闭引擎
app.post('/api/engine/quit', (req, res) => {
  try {
    engineManager.quit();
    res.json({ success: true });
  } catch (error) {
    console.error('关闭引擎API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`皮卡鱼引擎API服务器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  engineManager.quit();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  engineManager.quit();
  process.exit(0);
});