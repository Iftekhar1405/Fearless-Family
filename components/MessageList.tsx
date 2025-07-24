'use client';

import { Message } from '@/types';
import { Users } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const formatTime = (timestamp: string | number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="relative px-2 sm:px-6 py-2 sm:py-4 bg-background h-full flex-1 min-h-0"
      style={{ minHeight: '0' }}
    >
      <div
        className="max-w-4xl mx-auto h-full flex flex-col min-h-0"
        style={{ minHeight: '0' }}
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto scrollbar-none hide-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Start the conversation with your family members. Your messages will appear here.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="group mb-4 last:mb-0">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-muted to-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-foreground text-sm font-medium">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <p className="text-card-foreground leading-relaxed">{message.content}</p>
                    </div>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-xs font-medium text-muted-foreground">Anonymous</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(
                          typeof message.timestamp === 'string' || typeof message.timestamp === 'number'
                            ? message.timestamp
                            : message.timestamp.toISOString()
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
