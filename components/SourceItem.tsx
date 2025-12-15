import React from 'react';
import { Source, SourceType, CrawlStatus } from '../types';

interface SourceItemProps {
  source: Source;
  onDelete: (id: string) => void;
  onTrigger: (id: string) => void;
}

const SourceItem: React.FC<SourceItemProps> = ({ source, onDelete, onTrigger }) => {
  const getIcon = () => {
    switch (source.type) {
      case SourceType.FACEBOOK:
        return <span className="text-blue-600 font-bold">f</span>;
      case SourceType.TWITTER:
        return <span className="text-sky-500 font-bold">X</span>;
      default:
        return <span className="text-emerald-500 font-bold">W</span>;
    }
  };

  const getStatusBadge = () => {
    switch (source.status) {
      case CrawlStatus.CRAWLING:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">运行中</span>;
      case CrawlStatus.ERROR:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">错误</span>;
      case CrawlStatus.SUCCESS:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">活跃</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">空闲</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 text-xl">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{source.name}</h3>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-blue-500 truncate max-w-[200px] block">
              {source.url}
            </a>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge()}
              <span className="text-xs text-slate-400">每 {source.intervalHours} 小时</span>
              {source.lastChecked && (
                <span className="text-xs text-slate-400">
                  更新: {new Date(source.lastChecked).toLocaleTimeString()}
                </span>
              )}
            </div>
            {source.errorMessage && (
              <p className="text-xs text-red-500 mt-1">{source.errorMessage}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onTrigger(source.id)}
            disabled={source.status === CrawlStatus.CRAWLING}
            className={`p-2 rounded-md transition-colors ${source.status === CrawlStatus.CRAWLING ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            title="立即运行"
          >
            <svg className={`w-4 h-4 ${source.status === CrawlStatus.CRAWLING ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button
            onClick={() => onDelete(source.id)}
            className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            title="删除订阅"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceItem;