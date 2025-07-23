import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
            Anonymous Family Chat
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Create private chat groups where messages are completely anonymous.
            Perfect for honest conversations without judgment.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/create-family">
              <Button size="lg" className="px-8">
                Create Family
              </Button>
            </Link>
            <Link href="/join-family">
              <Button variant="outline" size="lg" className="px-8">
                Join Family
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-32 max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-black">
              Why Choose Fearless Family?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Simple, secure, and completely anonymous communication.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-gray-200">
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-black" />
                <CardTitle className="text-black">Anonymous Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All messages are completely anonymous. No one knows who said what.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader>
                <Users className="h-8 w-8 text-black" />
                <CardTitle className="text-black">Private Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create private family groups with unique secret codes.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader>
                <Shield className="h-8 w-8 text-black" />
                <CardTitle className="text-black">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your conversations are private and secure. No personal data stored.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader>
                <Zap className="h-8 w-8 text-black" />
                <CardTitle className="text-black">Easy to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simple interface. Just create or join a family and start chatting.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it works */}
        <div className="mx-auto mt-32 max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-black">
              How It Works
            </h2>
          </div>
          <div className="mt-16 space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Create or Join a Family</h3>
                <p className="mt-2 text-gray-600">
                  Create a new family group and get a unique secret code, or join an existing family with a code.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Choose Your Username</h3>
                <p className="mt-2 text-gray-600">
                  Pick a username to identify yourself to other members. This won't be shown with your messages.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Start Chatting Anonymously</h3>
                <p className="mt-2 text-gray-600">
                  Send messages that appear as anonymous to all family members. Express yourself freely!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}