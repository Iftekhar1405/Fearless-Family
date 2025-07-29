'use client';

import { Button } from '@/client/components/ui/button';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              <span className="text-xl hidden md:block font-bold text-foreground">Fearless Family</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/create-family">
              <Button variant="outline" size="sm">
                Create Family
              </Button>
            </Link>
            <Link href="/join-family">
              <Button size="sm">Join Family</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
