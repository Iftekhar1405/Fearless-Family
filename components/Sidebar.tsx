'use client';

import { Member } from '@/types';
import { Users, Clock, X, Check, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface SidebarProps {
  familyName: string;
  familyCode: string;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ familyName, familyCode, members, isOpen, onClose }: SidebarProps) {
  const [copied, setCopied] = useState(false);

  const copyFamilyCode = () => {
    navigator.clipboard.writeText(familyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInviteLink = () => {
    const inviteLink = `${window.location.origin}/join-family?code=${familyCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join My Family Group!',
        text: `Use this link to join my family group "${familyName}":`,
        url: inviteLink,
      }).catch((err) => {
        console.error('Share failed:', err);
      });
    } else {
      navigator.clipboard.writeText(inviteLink);
      alert('Sharing not supported on this browser. Link copied to clipboard instead.');
    }
  };


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 transform bg-white shadow-2xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:shadow-none lg:border-l-2 lg:border-gray-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{familyName}</h2>
              <button
                onClick={onClose}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <code className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-mono flex-1">
                {familyCode}
              </code>
              <button
                onClick={copyFamilyCode}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={shareInviteLink}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 12v2a4 4 0 004 4h8a4 4 0 004-4v-2" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Share Invite Link</span>
              </button>
            </div>

          </div>

          {/* Members */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Members ({members.length})</h3>
              </div>
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {member.username}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(member.joinedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
