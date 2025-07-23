'use client';

import { Member } from '@/types';
import { Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  familyName: string;
  familyCode: string;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ familyName, familyCode, members, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col border-l border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">{familyName}</h2>
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {familyCode}
              </Badge>
            </div>
          </div>

          {/* Members */}
          <div className="flex-1 overflow-y-auto p-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-medium">
                  <Users className="mr-2 h-4 w-4" />
                  Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">
                      {member.username}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}