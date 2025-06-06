"use client";
import React from 'react';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-8">
          Project Orbit Launch!
        </h1>
        <Dashboard />
      </div>
    </main>
  );
}