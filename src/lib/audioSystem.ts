/**
 * 中国象棋音效系统
 * 使用Web Audio API实现游戏音效
 */

export interface AudioSystemConfig {
  enabled: boolean;
  volume: number; // 0-1
}

export enum SoundType {
  MOVE = 'move',
  CAPTURE = 'capture',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  GAME_START = 'gameStart',
  GAME_END = 'gameEnd',
  BUTTON_CLICK = 'buttonClick',
  PIECE_SELECT = 'pieceSelect',
  INVALID_MOVE = 'invalidMove'
}

class AudioSystem {
  private audioContext: AudioContext | null = null;
  private config: AudioSystemConfig = {
    enabled: true,
    volume: 0.7
  };
  private soundBuffers: Map<SoundType, AudioBuffer> = new Map();
  private initialized = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * 初始化音频系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 生成音效
      await this.generateSounds();
      
      this.initialized = true;
      console.log('音效系统初始化成功');
    } catch (error) {
      console.warn('音效系统初始化失败:', error);
      this.config.enabled = false;
    }
  }

  /**
   * 生成各种音效
   */
  private async generateSounds(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;

    // 走子音效 - 清脆的点击声
    this.soundBuffers.set(SoundType.MOVE, this.generateClickSound(sampleRate, 0.1, 800));
    
    // 吃子音效 - 较重的撞击声
    this.soundBuffers.set(SoundType.CAPTURE, this.generateCaptureSound(sampleRate, 0.15));
    
    // 将军音效 - 警告音
    this.soundBuffers.set(SoundType.CHECK, this.generateCheckSound(sampleRate, 0.3));
    
    // 将死音效 - 胜利音
    this.soundBuffers.set(SoundType.CHECKMATE, this.generateCheckmateSound(sampleRate, 0.5));
    
    // 游戏开始音效
    this.soundBuffers.set(SoundType.GAME_START, this.generateGameStartSound(sampleRate, 0.4));
    
    // 游戏结束音效
    this.soundBuffers.set(SoundType.GAME_END, this.generateGameEndSound(sampleRate, 0.6));
    
    // 按钮点击音效
    this.soundBuffers.set(SoundType.BUTTON_CLICK, this.generateClickSound(sampleRate, 0.05, 1000));
    
    // 棋子选择音效
    this.soundBuffers.set(SoundType.PIECE_SELECT, this.generateClickSound(sampleRate, 0.08, 1200));
    
    // 无效移动音效
    this.soundBuffers.set(SoundType.INVALID_MOVE, this.generateInvalidMoveSound(sampleRate, 0.2));
  }

  /**
   * 生成点击音效
   */
  private generateClickSound(sampleRate: number, duration: number, frequency: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10); // 快速衰减
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }
    
    return buffer;
  }

  /**
   * 生成吃子音效
   */
  private generateCaptureSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      // 混合多个频率创造撞击感
      const sound1 = Math.sin(2 * Math.PI * 400 * t);
      const sound2 = Math.sin(2 * Math.PI * 600 * t);
      const noise = (Math.random() - 0.5) * 0.1;
      data[i] = (sound1 + sound2 + noise) * envelope * 0.4;
    }
    
    return buffer;
  }

  /**
   * 生成将军音效
   */
  private generateCheckSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(Math.PI * t / duration); // 钟形包络
      // 警告音 - 高频震荡
      const frequency = 1000 + Math.sin(2 * Math.PI * 10 * t) * 200;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5;
    }
    
    return buffer;
  }

  /**
   * 生成将死音效
   */
  private generateCheckmateSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      // 胜利和弦
      const freq1 = 523.25; // C5
      const freq2 = 659.25; // E5
      const freq3 = 783.99; // G5
      const sound = (Math.sin(2 * Math.PI * freq1 * t) + 
                    Math.sin(2 * Math.PI * freq2 * t) + 
                    Math.sin(2 * Math.PI * freq3 * t)) / 3;
      data[i] = sound * envelope * 0.6;
    }
    
    return buffer;
  }

  /**
   * 生成游戏开始音效
   */
  private generateGameStartSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(Math.PI * t / duration);
      // 上升音调
      const frequency = 400 + (t / duration) * 400;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }
    
    return buffer;
  }

  /**
   * 生成游戏结束音效
   */
  private generateGameEndSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.5);
      // 下降音调
      const frequency = 800 - (t / duration) * 400;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5;
    }
    
    return buffer;
  }

  /**
   * 生成无效移动音效
   */
  private generateInvalidMoveSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15);
      // 低沉的错误音
      data[i] = Math.sin(2 * Math.PI * 200 * t) * envelope * 0.3;
    }
    
    return buffer;
  }

  /**
   * 播放音效
   */
  async playSound(soundType: SoundType): Promise<void> {
    if (!this.config.enabled || !this.audioContext || !this.initialized) {
      return;
    }

    try {
      // 确保音频上下文处于运行状态
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.soundBuffers.get(soundType);
      if (!buffer) {
        console.warn(`音效 ${soundType} 未找到`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.config.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('播放音效失败:', error);
    }
  }

  /**
   * 设置音效配置
   */
  setConfig(config: Partial<AudioSystemConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  /**
   * 获取音效配置
   */
  getConfig(): AudioSystemConfig {
    return { ...this.config };
  }

  /**
   * 切换音效开关
   */
  toggleSound(): boolean {
    this.config.enabled = !this.config.enabled;
    this.saveConfig();
    return this.config.enabled;
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  /**
   * 保存配置到本地存储
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('xiangqi_audio_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('保存音效配置失败:', error);
    }
  }

  /**
   * 从本地存储加载配置
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('xiangqi_audio_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('加载音效配置失败:', error);
    }
  }

  /**
   * 销毁音频系统
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundBuffers.clear();
    this.initialized = false;
  }
}

// 导出单例实例
export const audioSystem = new AudioSystem();

// 自动初始化（在用户首次交互时）
let autoInitialized = false;
const autoInitialize = async () => {
  if (!autoInitialized) {
    autoInitialized = true;
    await audioSystem.initialize();
    // 移除事件监听器
    document.removeEventListener('click', autoInitialize);
    document.removeEventListener('keydown', autoInitialize);
  }
};

// 监听用户首次交互
document.addEventListener('click', autoInitialize);
document.addEventListener('keydown', autoInitialize);