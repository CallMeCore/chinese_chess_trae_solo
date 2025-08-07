import React, { useState, useEffect } from 'react';
import XiangqiGame from './components/XiangqiGame';
import { Settings, HelpCircle, X } from 'lucide-react';
import { audioSystem, SoundType } from './lib/audioSystem';
import { useGameStore } from './store/gameStore';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { settings, updateSettings } = useGameStore();
  
  // 临时设置状态（用于设置弹窗）
  const [tempSettings, setTempSettings] = useState(settings);
  
  // 同步设置状态
  useEffect(() => {
    setTempSettings(settings);
  }, [settings, showSettings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* 标题栏 */}
      <header className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-amber-800">中国象棋</h1>
            <div className="text-sm text-amber-600">
              传统象棋游戏 · 支持人机对战
            </div>
          </div>
        </div>
      </header>

      {/* 主游戏区域 */}
      <main>
        <XiangqiGame
          onShowSettings={() => setShowSettings(true)}
          onShowHelp={() => setShowHelp(true)}
        />
      </main>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-90vw">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">游戏设置</h2>
              <button
                onClick={() => {
                  audioSystem.playSound(SoundType.BUTTON_CLICK);
                  setShowSettings(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  游戏模式
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={tempSettings.mode}
                  onChange={(e) => setTempSettings({...tempSettings, mode: e.target.value as any})}
                >
                  <option value="human-vs-ai">人机对战</option>
                  <option value="human-vs-human">双人对战</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI难度
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={tempSettings.difficulty}
                  onChange={(e) => setTempSettings({...tempSettings, difficulty: e.target.value as any})}
                  disabled={tempSettings.mode !== 'human-vs-ai'}
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">显示合法移动</span>
                <input 
                  type="checkbox" 
                  checked={tempSettings.showLegalMoves}
                  onChange={(e) => setTempSettings({...tempSettings, showLegalMoves: e.target.checked})}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">显示上一步移动</span>
                <input 
                  type="checkbox" 
                  checked={tempSettings.showLastMove}
                  onChange={(e) => setTempSettings({...tempSettings, showLastMove: e.target.checked})}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">音效开关</span>
                <input 
                  type="checkbox" 
                  checked={tempSettings.soundEnabled}
                  onChange={(e) => setTempSettings({...tempSettings, soundEnabled: e.target.checked})}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">自动保存</span>
                <input 
                  type="checkbox" 
                  checked={tempSettings.autoSave}
                  onChange={(e) => setTempSettings({...tempSettings, autoSave: e.target.checked})}
                  className="rounded" 
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  audioSystem.playSound(SoundType.BUTTON_CLICK);
                  setTempSettings(settings); // 恢复原设置
                  setShowSettings(false);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  audioSystem.playSound(SoundType.BUTTON_CLICK);
                  updateSettings(tempSettings); // 保存设置
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 帮助弹窗 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-90vw max-h-80vh overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">游戏帮助</h2>
              <button
                onClick={() => {
                  audioSystem.playSound(SoundType.BUTTON_CLICK);
                  setShowHelp(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">基本操作</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>点击棋子选择，再点击目标位置移动</li>
                  <li>绿色圆点表示可移动位置</li>
                  <li>红色虚线圆圈表示可吃子位置</li>
                  <li>蓝色圆圈表示当前选中的棋子</li>
                  <li>黄色圆圈表示上一步移动轨迹</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">棋子走法</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>帅/将:</strong> 只能在九宫格内移动，每次一格</li>
                  <li><strong>仕/士:</strong> 只能在九宫格内斜着移动</li>
                  <li><strong>相/象:</strong> 斜着走两格，不能过河，不能被憋象眼</li>
                  <li><strong>马:</strong> 走"日"字，不能被憋马腿</li>
                  <li><strong>车:</strong> 横竖直线移动，不能跳子</li>
                  <li><strong>炮:</strong> 移动同车，吃子需要跳过一个棋子</li>
                  <li><strong>兵/卒:</strong> 只能向前，过河后可左右移动</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">胜负规则</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>将死对方帅/将获胜</li>
                  <li>无子可动为和棋</li>
                  <li>长将、长捉等为和棋</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  audioSystem.playSound(SoundType.BUTTON_CLICK);
                  setShowHelp(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
