import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
            Anonymous Family Chat
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Create private chat groups where messages are completely anonymous.
            Perfect for honest conversations without judgment.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-4">
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
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              Why Choose Fearless Family?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Simple, secure, and completely anonymous communication.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[{
              icon: MessageCircle,
              title: 'Anonymous Messages',
              description: 'All messages are completely anonymous. No one knows who said what.'
            }, {
              icon: Users,
              title: 'Private Groups',
              description: 'Create private family groups with unique secret codes.'
            }, {
              icon: Shield,
              title: 'Secure & Private',
              description: 'Your conversations are private and secure. No personal data stored.'
            }, {
              icon: Zap,
              title: 'Easy to Use',
              description: 'Simple interface. Just create or join a family and start chatting.'
            }].map(({ icon: Icon, title, description }, idx) => (
              <Card key={idx} className="border-border bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-primary">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">{description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mx-auto mt-32 max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              How It Works
            </h2>
          </div>
          <div className="mt-16 space-y-8">
            {[
              {
                step: 1,
                title: 'Create or Join a Family',
                description: 'Create a new family group and get a unique secret code, or join an existing family with a code.'
              },
              {
                step: 2,
                title: 'Choose Your Username',
                description: "Pick a username to identify yourself to other members. This won't be shown with your messages."
              },
              {
                step: 3,
                title: 'Start Chatting Anonymously',
                description: 'Send messages that appear as anonymous to all family members. Express yourself freely!'
              }
            ].map(({ step, title, description }, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
