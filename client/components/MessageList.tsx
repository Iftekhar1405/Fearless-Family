'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/client/types';
import { Users } from 'lucide-react';

interface TypingUser {
  userId: string;
  username?: string;
}

interface MessageListProps {
  messages: Message[];
  typingUsers?: TypingUser[];
  currentUserId?: string | null;
}

export function MessageList({ messages, typingUsers = [], currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const formatTime = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitial = (message: Message) => {
    if (message.senderName) {
      return message.senderName.charAt(0).toUpperCase();
    }
    return 'A';
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === currentUserId;
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
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none hide-scrollbar">
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
            <>
              {messages.map((message) => {
                const isOwn = isOwnMessage(message);
                return (
                  <div key={message.id} className={`group mb-4 last:mb-0 ${isOwn ? 'flex justify-end' : ''}`}>
                    <div className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''} max-w-[80%]`}>
                      {!isOwn && (
                        <div className="w-9 h-9 bg-gradient-to-br from-muted to-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-accent-foreground text-sm font-medium">
                            {getInitial(message)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`border rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-card border-border'
                        }`}>
                          <p className={`leading-relaxed ${isOwn ? 'text-primary-foreground' : 'text-card-foreground'}`}>
                            {message.content}
                          </p>
                        </div>
                        <div className={`flex items-center mt-2 space-x-4 ${isOwn ? 'justify-end' : ''}`}>
                          {!isOwn && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {message.senderName || 'Anonymous'}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="group mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-muted to-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-foreground text-sm font-medium">
                        {typingUsers[0]?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {typingUsers.length === 1 
                              ? `${typingUsers[0]?.username || 'Someone'} is typing`
                              : `${typingUsers.length} people are typing`
                            }...
                          </span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}