'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { Button } from '@/components/ui/button';
import { Menu, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Family, Member, Message } from '@/types';

interface FamilyChatPageProps {
  params: {
    code: string;
  };
}

export default function FamilyChatPage({ params }: FamilyChatPageProps) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  // Get member ID from localStorage
  useEffect(() => {
    const storedMemberId = localStorage.getItem(`member_${params.code}`);
    if (!storedMemberId) {
      router.push(`/join-family?code=${params.code}`);
      return;
    }
    setMemberId(storedMemberId);
  }, [params.code, router]);

  // Load family details and messages
  const loadData = async () => {
    if (!memberId) return;

    try {
      const [familyData, messagesData] = await Promise.all([
        api.getFamilyDetails(params.code, memberId),
        api.getMessages(params.code, memberId),
      ]);

      setFamily(familyData.family);
      setMembers(familyData.members);
      setMessages(messagesData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family data');
      if (err instanceof Error && err.message.includes('not found')) {
        router.push(`/join-family?code=${params.code}`);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (memberId) {
      loadData().finally(() => setIsLoading(false));
    }
  }, [memberId]);

  // Set up polling for new messages
  useEffect(() => {
    if (!memberId || !family) return;

    const startPolling = () => {
      pollingRef.current = setInterval(() => {
        loadData();
      }, 3000);
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [memberId, family]);

  const handleSendMessage = async (content: string) => {
    if (!family || !memberId) return;

    try {
      const newMessage = await api.sendMessage({
        content,
        familyCode: family.code,
        memberId,
      });

      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

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
            <p className="text-muted-foreground mb-6">{error}</p>
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
      {/* <Navbar /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Chat Header */}
          <div className="border-b-2 border-border/50 px-6 py-4 bg-card shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div>
                <h1 className="text-xl font-bold text-foreground">{family.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{members.length} members online</p>
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
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Messages and Input: make MessageInput fixed at bottom */}
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 pb-[92px]"> {/* 92px = height of input + padding */}
              <MessageList messages={messages} />
              <MessageInput onSendMessage={handleSendMessage} />

            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar
          familyName={family.name}
          familyCode={family.code}
          members={members}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
