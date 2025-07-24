'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t-2 border-border bg-background px-6 py-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center space-x-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 border-2 border-border bg-input text-foreground rounded-2xl resize-none 
                         placeholder:text-muted-foreground focus:border-primary focus:ring-0 focus:outline-none 
                         transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
              disabled={disabled}
            />
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className="w-12 h-12 bg-primary hover:bg-primary/90 disabled:bg-muted rounded-full flex items-center justify-center 
                         transition-colors duration-200 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
