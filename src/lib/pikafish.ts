/**
 * 皮卡鱼AI引擎集成模块
 * 通过后端API与真正的pikafish.exe进程通信
 */

export interface AIConfig {
  depth: number;
  timeLimit: number; // 毫秒
  threads: number;
}

export interface AIMove {
  from: string;
  to: string;
  promotion?: string;
  score?: number;
  depth?: number;
  time?: number;
}

export class PikafishEngine {
  private isReady = false;
  private apiBaseUrl = 'http://localhost:3001/api/engine';
  private config: AIConfig = {
    depth: 8,
    timeLimit: 3000,
    threads: 1
  };

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      console.log('正在初始化皮卡鱼引擎...');
      
      // 调用后端API初始化引擎
      const response = await fetch(`${this.apiBaseUrl}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`初始化引擎失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.isReady = result.success && result.ready;
      
      if (this.isReady) {
        console.log('皮卡鱼引擎初始化成功');
      } else {
        console.error('皮卡鱼引擎初始化失败');
      }
    } catch (error) {
      console.error('初始化AI引擎失败:', error);
      this.isReady = false;
    }
  }

  /**
   * 检查引擎状态
   */
  private async checkEngineStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/status`);
      if (!response.ok) {
        return false;
      }
      const result = await response.json();
      this.isReady = result.ready && result.processRunning;
      return this.isReady;
    } catch (error) {
      console.error('检查引擎状态失败:', error);
      return false;
    }
  }

  /**
   * 设置棋盘位置
   */
  async setPosition(fen: string): Promise<boolean> {
    try {
      console.log('设置棋盘位置:', fen);
      
      const response = await fetch(`${this.apiBaseUrl}/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fen })
      });
      
      if (!response.ok) {
        throw new Error(`设置位置失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('设置棋盘位置失败:', error);
      return false;
    }
  }

  /**
   * 请求AI移动
   */
  async requestMove(callback: (move: AIMove) => void): Promise<void> {
    try {
      console.log('🚀 [AI请求] 开始请求AI移动');
      console.log('📊 [AI请求] 配置参数:', {
        depth: this.config.depth,
        timeLimit: this.config.timeLimit,
        apiUrl: `${this.apiBaseUrl}/move`
      });
      
      const requestBody = {
        timeLimit: this.config.timeLimit,
        depth: this.config.depth
      };
      console.log('📤 [AI请求] 发送请求体:', requestBody);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏰ [AI请求] 请求超时，正在取消...');
        controller.abort();
      }, 10000); // 10秒超时
      
      console.log('⏳ [AI请求] 正在发送HTTP请求...');
      const response = await fetch(`${this.apiBaseUrl}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📨 [AI请求] 收到HTTP响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI请求] HTTP响应错误:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`请求移动失败: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('🔄 [AI请求] 正在解析响应JSON...');
      const result = await response.json();
      console.log('📋 [AI请求] 解析后的响应数据:', result);
      
      if (result.move) {
        console.log('✅ [AI请求] 成功收到AI移动:', {
          move: result.move,
          score: result.score,
          depth: result.depth,
          time: result.time
        });
        console.log('🎯 [AI请求] 正在调用回调函数...');
        callback(result.move);
        console.log('✨ [AI请求] 回调函数调用完成');
      } else {
        console.error('❌ [AI请求] 响应中没有有效移动:', result);
        throw new Error('未收到有效移动');
      }
    } catch (error) {
      console.error('💥 [AI请求] 请求过程中发生错误:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'AbortError') {
        console.error('⏰ [AI请求] 请求被超时取消');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 [AI请求] 网络连接错误，可能是后端服务未启动');
      }
      
      // 可以考虑调用callback传递错误信息
    }
  }

  /**
   * 停止AI思考
   */
  async stopThinking(): Promise<boolean> {
    try {
      console.log('停止AI思考');
      
      const response = await fetch(`${this.apiBaseUrl}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`停止思考失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('停止AI思考失败:', error);
      return false;
    }
  }

  /**
   * 更新AI配置
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * 检查引擎是否就绪
   */
  isEngineReady(): boolean {
    return this.isReady;
  }

  /**
   * 销毁引擎
   */
  async destroy(): Promise<void> {
    try {
      console.log('销毁AI引擎');
      
      const response = await fetch(`${this.apiBaseUrl}/quit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('关闭引擎请求失败:', response.statusText);
      }
      
      this.isReady = false;
      console.log('AI引擎已销毁');
    } catch (error) {
      console.error('销毁AI引擎失败:', error);
      this.isReady = false;
    }
  }
}

// 创建全局AI引擎实例
export const pikafishEngine = new PikafishEngine();