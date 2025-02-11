'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ElizaChat from './ElizaChat';

export default function Sidebar() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <nav className="space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded hover:bg-gray-700 transition-colors ${
              pathname === item.href ? 'bg-gray-700' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-full px-4 py-2 text-left rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <span>Chat with Agent</span>
        </button>
      </nav>
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl">
          <ElizaChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
} 