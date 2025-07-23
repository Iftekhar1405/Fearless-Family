'use client';

import { Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const formatTime = (timestamp: string | number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start the conversation with your family members. Your messages will appear here.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id} className="group">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-gray-900 leading-relaxed">{message.content}</p>
                  </div>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-xs font-medium text-gray-500">Anonymous</span>
                    <span className="text-xs text-gray-400">{formatTime(typeof message.timestamp === 'string' || typeof message.timestamp === 'number' ? message.timestamp : message.timestamp.toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}