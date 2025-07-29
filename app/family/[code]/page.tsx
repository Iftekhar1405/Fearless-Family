'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/client/components/Navbar';
import { Sidebar } from '@/client/components/Sidebar';
import { MessageList } from '@/client/components/MessageList';
import { MessageInput } from '@/client/components/MessageInput';
import { Button } from '@/client/components/ui/button';
import { Menu, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

import { useFamily, useFamilyMembers } from '@/client/hooks/useQueries';
import { Family, Member, Message } from '@/client/types';
import { useWebSocketWithQuery } from '@/client/hooks/useWebSocketWithClient';

interface FamilyChatPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function FamilyChatPage({ params }: FamilyChatPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const router = useRouter();

  // Get member ID and username from localStorage
  useEffect(() => {
    const storedMemberId = localStorage.getItem(`member_${resolvedParams.code}`);
    const storedUsername = localStorage.getItem(`username_${resolvedParams.code}`) || 'Anonymous';
    
    if (!storedMemberId) {
      router.push(`/join-family?code=${resolvedParams.code}`);
      return;
    }
    
    setMemberId(storedMemberId);
    setUsername(storedUsername);
  }, [resolvedParams.code, router]);

  // Use your custom hooks
  const { data: family, isLoading: familyLoading, error: familyError } = useFamily(resolvedParams.code);
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers(resolvedParams.code);

  // WebSocket integration
  const {
    isConnected,
    currentFamilyId,
    messages,
    typingUsers,
    onlineUsers,
    isLoadingMessages,
    messagesError,
    joinFamily,
    sendMessage,
    sendTypingIndicator,
    leaveFamily,
    isSendingMessage,
    isConnecting
  } = useWebSocketWithQuery(memberId || '', username);

  // Join family when component mounts and we have required data
  useEffect(() => {
    if (memberId && resolvedParams.code && !currentFamilyId) {
      joinFamily(resolvedParams.code);
    }
  }, [memberId, resolvedParams.code, currentFamilyId, joinFamily]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentFamilyId) {
        leaveFamily();
      }
    };
  }, [currentFamilyId, leaveFamily]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentFamilyId || isSendingMessage) return;
    await sendMessage(content.trim());
  };

  const isLoading = familyLoading || membersLoading || isLoadingMessages;
  const error = familyError || messagesError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-card rounded-2xl shadow-sm border border-border flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Loading family chat...</h3>
            <p className="text-muted-foreground">Setting up your conversation space</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !family) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <Button
              onClick={() => router.push('/join-family')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
              aria-label="Join Family"
            >
              Join Family
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Chat Header */}
          <div className="border-b-2 border-border/50 px-6 py-4 bg-card shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div>
                <h1 className="text-xl font-bold text-foreground">{family.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {onlineUsers.length > 0 ? `${onlineUsers.length} online` : `${members.length} members`}
                  </p>
                  <div className="flex items-center space-x-1">
                    {isConnected ? (
                      <>
                        <Wifi className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">Connected</span>
                      </>
                    ) : isConnecting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                        <span className="text-xs text-yellow-600">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors duration-200"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20 transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <p className="text-sm text-destructive flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error.message || 'Connection error occurred'}
                </p>
              </div>
            </div>
          )}

          {/* Messages and Input */}
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 pb-[92px]">
              <MessageList 
                messages={messages} 
                typingUsers={typingUsers}
                currentUserId={memberId}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <MessageInput 
                onSendMessage={handleSendMessage}
                onTyping={sendTypingIndicator}
                disabled={!isConnected || isSendingMessage}
                isLoading={isSendingMessage}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar
          familyName={family.name}
          familyCode={family.code || resolvedParams.code}
          members={members}
          onlineUsers={onlineUsers}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}