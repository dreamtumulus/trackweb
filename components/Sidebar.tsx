import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'sources' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'sources' | 'settings') => void;
  unreadCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, unreadCount }) => {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">舆情</span>监控系统
        </h1>
        <p className="text-xs text-slate-400 mt-1">全网信息自动聚合</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            最新动态
          </span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
            activeTab === 'sources' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          监控目标管理
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
            activeTab === 'settings' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          系统设置
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        &copy; 2024 InfoMonitor Inc.
      </div>
    </div>
  );
};

export default Sidebar;