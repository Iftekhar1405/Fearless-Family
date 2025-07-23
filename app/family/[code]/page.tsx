'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
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
      router.push('/join-family');
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
        router.push('/join-family');
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
      }, 3000); // Poll every 3 seconds
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

      // Add the new message to the local state immediately
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading family chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !family) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => router.push('/join-family')} 
              className="mt-4"
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col lg:mr-80">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-black">{family.name}</h1>
              <p className="text-sm text-gray-500">{members.length} members</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <MessageList messages={messages} />

          {/* Message Input */}
          <MessageInput onSendMessage={handleSendMessage} />
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