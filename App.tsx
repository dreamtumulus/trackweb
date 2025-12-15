import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SourceItem from './components/SourceItem';
import FeedCard from './components/FeedCard';
import { Source, SourceType, CrawlStatus, CrawlResult, ApiKeys } from './types';
import { crawlSource } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'settings'>('dashboard');
  
  // API Keys State (Persisted)
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const saved = localStorage.getItem('app_api_keys');
    if (saved) {
      return JSON.parse(saved);
    }
    // Backward compatibility check
    const oldGemini = localStorage.getItem('gemini_api_key');
    return {
      gemini: oldGemini || process.env.API_KEY || '',
      openrouter: '',
      tavily: ''
    };
  });

  const [sources, setSources] = useState<Source[]>(() => {
    const saved = localStorage.getItem('monitor_sources');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: '1', 
        name: 'TechCrunch', 
        url: 'https://techcrunch.com', 
        type: SourceType.WEBSITE, 
        intervalHours: 2, 
        lastChecked: null,
        nextCheck: Date.now(), 
        status: CrawlStatus.IDLE 
      }
    ];
  });

  const [results, setResults] = useState<CrawlResult[]>(() => {
    const saved = localStorage.getItem('monitor_results');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Source Form State
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState(''); // Textarea content
  const [newSourceType, setNewSourceType] = useState<SourceType>(SourceType.WEBSITE);
  const [newSourceInterval, setNewSourceInterval] = useState<number>(2);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('monitor_sources', JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem('monitor_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('app_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // --- Logic ---

  const handleTriggerCrawl = useCallback(async (sourceId: string) => {
    const hasValidKey = apiKeys.gemini || apiKeys.tavily;
    if (!hasValidKey) {
      alert("请先在【系统设置】中配置 Gemini API Key 或 Tavily API Key");
      return;
    }

    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: CrawlStatus.CRAWLING, errorMessage: undefined } : s));

    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    try {
      const newItems = await crawlSource(source, apiKeys);
      
      setResults(prev => {
        const filteredNew = newItems.filter(newItem => 
          !prev.some(existing => existing.title === newItem.title && existing.sourceId === newItem.sourceId)
        );
        return [...filteredNew, ...prev];
      });

      setSources(prev => prev.map(s => 
        s.id === sourceId ? { 
          ...s, 
          status: CrawlStatus.SUCCESS, 
          lastChecked: Date.now(),
          nextCheck: Date.now() + (s.intervalHours * 3600000)
        } : s
      ));

    } catch (err) {
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { 
          ...s, 
          status: CrawlStatus.ERROR, 
          errorMessage: err instanceof Error ? err.message : '未知错误'
        } : s
      ));
    }
  }, [sources, apiKeys]);

  // Scheduler Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      sources.forEach(source => {
        if (source.status !== CrawlStatus.CRAWLING && now >= source.nextCheck) {
          handleTriggerCrawl(source.id);
        }
      });
    }, 10000); 

    return () => clearInterval(interval);
  }, [sources, handleTriggerCrawl]);

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;

    // Batch Process URLs (Split by new line)
    const urlList = newSourceUrl.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    const newSourcesList: Source[] = urlList.map((url, index) => ({
      id: crypto.randomUUID(),
      name: urlList.length > 1 ? `${newSourceName} (${index + 1})` : newSourceName,
      url: url,
      type: newSourceType,
      intervalHours: newSourceInterval,
      lastChecked: null,
      nextCheck: Date.now() + (index * 2000), // Stagger checks slightly
      status: CrawlStatus.IDLE
    }));

    setSources([...sources, ...newSourcesList]);
    
    // Reset form
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceInterval(2);
    setNewSourceType(SourceType.WEBSITE);
    setIsModalOpen(false);
    
    // Auto start first batch
    setTimeout(() => {
       newSourcesList.forEach((s, idx) => {
          setTimeout(() => handleTriggerCrawl(s.id), idx * 1000);
       });
    }, 500);
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const markAsRead = (id: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r));
  };

  const unreadCount = results.filter(r => !r.isRead).length;

  // --- Views ---

  const renderDashboard = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">最新舆情动态</h2>
        <div className="text-sm text-slate-500">
          {!(apiKeys.gemini || apiKeys.tavily) ? <span className="text-red-500 font-bold">⚠️ 请先配置 API Key</span> : "系统自动监控中"}
        </div>
      </div>
      
      {results.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <svg className="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          <p className="text-slate-500">暂无消息。请前往“监控目标管理”添加订阅。</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {results.map(item => (
            <FeedCard key={item.id} item={item} onMarkRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );

  const renderSources = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">监控目标列表</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          添加订阅
        </button>
      </div>

      <div className="grid gap-4">
        {sources.map(source => (
          <SourceItem 
            key={source.id} 
            source={source} 
            onDelete={handleDeleteSource}
            onTrigger={handleTriggerCrawl}
          />
        ))}
        {sources.length === 0 && (
          <div className="text-center text-slate-400 py-10">暂无监控目标</div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">系统设置</h2>
      
      <div className="space-y-8">
        
        {/* Gemini Section */}
        <section className="bg-blue-50/50 border border-blue-100 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">G</div>
             <h3 className="font-bold text-slate-900">方案 A：Google Gemini (推荐)</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">使用 Google 官方 API，内置实时搜索 (Grounding)，效果最佳，配置最简单。</p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
            <input 
              type="password" 
              value={apiKeys.gemini}
              onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
              placeholder="AIzaSy..."
              className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            />
          </div>
        </section>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">或者</span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Alternative Stack */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-5">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">M</div>
             <h3 className="font-bold text-slate-900">方案 B：组合模式 (Tavily + OpenRouter)</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">如果您没有 Gemini Key，可以使用 Tavily 进行搜索，搭配 OpenRouter 进行总结。</p>
          
          <div className="grid gap-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tavily API Key (用于搜索/爬取)</label>
                <input 
                type="password" 
                value={apiKeys.tavily}
                onChange={(e) => setApiKeys({...apiKeys, tavily: e.target.value})}
                placeholder="tvly-..."
                className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">OpenRouter API Key (可选，用于增强总结)</label>
                <input 
                type="password" 
                value={apiKeys.openrouter}
                onChange={(e) => setApiKeys({...apiKeys, openrouter: e.target.value})}
                placeholder="sk-or-..."
                className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                />
                <p className="text-xs text-slate-400 mt-1">如果不填写 OpenRouter，将仅显示 Tavily 的简要搜索结果。</p>
            </div>
          </div>
        </section>

        
        <div className="pt-6 border-t border-slate-100">
           <p className="text-sm text-slate-500 leading-relaxed">
             注意：所有 API Key 均存储在本地浏览器中，请确保您的网络环境安全。
           </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />
      
      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'sources' && renderSources()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Add Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">添加监控目标</h3>
            <form onSubmit={handleAddSource}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">目标名称 / 备注</label>
                  <input 
                    type="text" 
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="例如: 竞品公司动态, 科技新闻"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">链接地址 (支持批量)</label>
                  <textarea 
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="请输入网址，每行一个。例如：&#10;https://example.com&#10;https://another-site.com"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">支持批量添加，每行一条链接。</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">监控频率 (小时)</label>
                        <input 
                            type="number"
                            min="1"
                            max="168"
                            value={newSourceInterval}
                            onChange={(e) => setNewSourceInterval(Number(e.target.value))}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                        <select 
                            value={newSourceType}
                            onChange={(e) => setNewSourceType(e.target.value as SourceType)}
                            className="w-full border rounded-lg p-2 bg-white"
                        >
                            <option value={SourceType.WEBSITE}>网站 / 通用</option>
                            <option value={SourceType.FACEBOOK}>Facebook</option>
                            <option value={SourceType.TWITTER}>Twitter / X</option>
                        </select>
                    </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;