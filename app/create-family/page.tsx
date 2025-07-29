'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/client/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/client/components/ui/card';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { Navbar } from '@/client/components/Navbar';
import { api } from '@/client/lib/api';
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

      console.log({ response });

      // Store member ID in localStorage for this session
      localStorage.setItem(`member_${response.family.code}`, response.member._id);

      // Navigate to the family chat
      router.push(`/family/${response.family.code}`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
        <Card className="bg-card border-border text-card-foreground shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Create Family</CardTitle>
            <CardDescription className="text-muted-foreground">
              Start a new anonymous chat group for your family or friends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <Label htmlFor="familyName" className="text-foreground">
                  Family Name
                </Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter family name"
                  required
                  disabled={isLoading}
                  className="border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="username" className="text-foreground">
                  Your Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                  className="border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Other members will see your username in the member list, but not with your messages.
                </p>
              </div>

              {error && (
                <div className="text-sm text-destructive-foreground bg-destructive border border-destructive rounded-md p-3">
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
