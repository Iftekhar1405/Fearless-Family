'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function JoinFamily() {
  const [familyCode, setFamilyCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyCode.trim() || !username.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.joinFamily({
        code: familyCode.trim().toUpperCase(),
        username: username.trim(),
      });

      // Store member ID in localStorage for this session
      localStorage.setItem(`member_${response.family.code}`, response.member._id);
      
      // Navigate to the family chat
      router.push(`/family/${response.family.code}`);
    } catch (err:any) {
      setError(err instanceof Error ? err.message : 'Failed to join family');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-black">Join Family</CardTitle>
            <CardDescription>
              Enter the secret code to join an existing family chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyCode">Family Code</Label>
                <Input
                  id="familyCode"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  placeholder="Enter family code"
                  required
                  disabled={isLoading}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Your Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Other members will see your username in the member list, but not with your messages.
                </p>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={!familyCode.trim() || !username.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Family'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}