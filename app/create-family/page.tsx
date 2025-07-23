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

export default function CreateFamily() {
  const [familyName, setFamilyName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || !username.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.createFamily({
        name: familyName.trim(),
        username: username.trim(),
      });

      console.log({response})

      // Store member ID in localStorage for this session
      localStorage.setItem(`member_${response.family.code}`, response.member._id);
      
      // Navigate to the family chat
      router.push(`/family/${response.family.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
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
            <CardTitle className="text-2xl font-bold text-black">Create Family</CardTitle>
            <CardDescription>
              Start a new anonymous chat group for your family or friends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter family name"
                  required
                  disabled={isLoading}
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
                disabled={!familyName.trim() || !username.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Family'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}