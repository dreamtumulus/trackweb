import React from 'react';
import { CrawlResult } from '../types';

interface FeedCardProps {
  item: CrawlResult;
  onMarkRead: (id: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ item, onMarkRead }) => {
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${item.isRead ? 'border-slate-100 bg-slate-50/50' : 'border-blue-200 border-l-4 border-l-blue-500'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600 mb-2">
            {item.sourceName}
          </span>
          <h3 className={`text-lg font-bold leading-tight ${item.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
            {item.title}
          </h3>
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="text-slate-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap font-sans">
        {item.summary}
      </div>

      <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
        <a 
          href={item.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
        >
          查看原文
          <svg className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>

        {!item.isRead && (
          <button 
            onClick={() => onMarkRead(item.id)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            标记为已读
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedCard;