'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { Button } from '@/components/ui/button';
import { Menu, Users, Loader2, AlertCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading family chat...</h3>
            <p className="text-gray-500">Setting up your conversation space</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !family) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/join-family')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-colors duration-200"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col ">
          {/* Chat Header */}
          <div className="border-b-2 border-gray-100 px-6 py-4 bg-white shadow-sm">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{family.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{members.length} members online</p>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100">
              <div className="max-w-4xl mx-auto">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </p>
              </div>
            </div>
          )}

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