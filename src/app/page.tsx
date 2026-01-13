'use client';

import { useRouter } from 'next/navigation';
import {
  Spade, Club, Dices, GraduationCap, BookOpen, Users,
  Target, Map, Calculator, BarChart3, TrendingUp
} from 'lucide-react';

export default function MainMenu() {
  const router = useRouter();

  return (
    <div className="min-h-screen gradient-bg px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16 animate-fadeIn">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#7C3AED] via-[#F43F5E] to-[#7C3AED] bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Casino Training Pro
        </h1>
        <p className="text-xl text-[#94A3B8]" style={{ fontFamily: 'var(--font-family-body)' }}>
          Master the Art of Card Games
        </p>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">

        {/* Blackjack Section */}
        <section className="bg-[rgba(26,26,46,0.8)] backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-slideIn">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center">
              <Spade className="w-10 h-10 text-[#7C3AED]" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Blackjack</h2>
              <p className="text-[#94A3B8]">Learn card counting & perfect strategy</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-3 mt-6">
            {/* Free Play */}
            <button
              onClick={() => router.push('/blackjack?mode=free')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#7C3AED]/10 border border-[#334155] hover:border-[#7C3AED]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#7C3AED]/10 group-hover:bg-[#7C3AED]/20 rounded-lg flex items-center justify-center transition-colors">
                <Dices className="w-7 h-7 text-[#7C3AED]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Free Play</h3>
                <p className="text-sm text-[#94A3B8]">Practice with standard rules</p>
              </div>
            </button>

            {/* Training Mode - Highlighted */}
            <button
              onClick={() => router.push('/blackjack?mode=training')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#7C3AED]/20 to-[#F43F5E]/20 border border-[#7C3AED] hover:border-[#A78BFA] rounded-xl transition-all duration-200 cursor-pointer group shadow-glow-primary"
            >
              <div className="w-12 h-12 bg-[#7C3AED]/30 group-hover:bg-[#7C3AED]/40 rounded-lg flex items-center justify-center transition-colors">
                <GraduationCap className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Training Mode</h3>
                <p className="text-sm text-[#94A3B8]">Card counting & strategy tips</p>
              </div>
            </button>

            {/* Tutorial */}
            <button
              onClick={() => router.push('/blackjack/tutorial')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#7C3AED]/10 border border-[#334155] hover:border-[#7C3AED]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#7C3AED]/10 group-hover:bg-[#7C3AED]/20 rounded-lg flex items-center justify-center transition-colors">
                <BookOpen className="w-7 h-7 text-[#7C3AED]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Tutorial</h3>
                <p className="text-sm text-[#94A3B8]">Learn the Hi-Lo system</p>
              </div>
            </button>

            {/* Multiplayer */}
            <button
              onClick={() => router.push('/blackjack/multiplayer')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#F43F5E]/10 border border-[#334155] hover:border-[#F43F5E]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#F43F5E]/10 group-hover:bg-[#F43F5E]/20 rounded-lg flex items-center justify-center transition-colors">
                <Users className="w-7 h-7 text-[#F43F5E]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Multiplayer</h3>
                <p className="text-sm text-[#94A3B8]">Play with friends online</p>
              </div>
            </button>
          </div>
        </section>

        {/* Poker GTO Section */}
        <section className="bg-[rgba(26,26,46,0.8)] backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-slideIn" style={{ animationDelay: '0.1s' }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#F43F5E]/20 rounded-xl flex items-center justify-center">
              <Club className="w-10 h-10 text-[#F43F5E]" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Poker GTO</h2>
              <p className="text-[#94A3B8]">Master Game Theory Optimal strategy</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-3 mt-6">
            {/* Preflop Training - Highlighted */}
            <button
              onClick={() => router.push('/poker/training')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#F43F5E]/20 to-[#7C3AED]/20 border border-[#F43F5E] hover:border-[#FB7185] rounded-xl transition-all duration-200 cursor-pointer group shadow-glow-cta"
            >
              <div className="w-12 h-12 bg-[#F43F5E]/30 group-hover:bg-[#F43F5E]/40 rounded-lg flex items-center justify-center transition-colors">
                <Target className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Preflop Training</h3>
                <p className="text-sm text-[#94A3B8]">Practice GTO open and defense</p>
              </div>
            </button>

            {/* Range Heatmap */}
            <button
              onClick={() => router.push('/poker/heatmap')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#F43F5E]/10 border border-[#334155] hover:border-[#F43F5E]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#F43F5E]/10 group-hover:bg-[#F43F5E]/20 rounded-lg flex items-center justify-center transition-colors">
                <Map className="w-7 h-7 text-[#F43F5E]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Range Heatmap</h3>
                <p className="text-sm text-[#94A3B8]">Visualize GTO ranges</p>
              </div>
            </button>

            {/* Custom Solutions */}
            <button
              onClick={() => router.push('/poker/builder')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#F43F5E]/10 border border-[#334155] hover:border-[#F43F5E]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#F43F5E]/10 group-hover:bg-[#F43F5E]/20 rounded-lg flex items-center justify-center transition-colors">
                <Calculator className="w-7 h-7 text-[#F43F5E]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Custom Solutions</h3>
                <p className="text-sm text-[#94A3B8]">Build & solve GTO scenarios</p>
              </div>
            </button>

            {/* Scenario Training */}
            <button
              onClick={() => router.push('/poker/scenarios')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#F43F5E]/10 border border-[#334155] hover:border-[#F43F5E]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#F43F5E]/10 group-hover:bg-[#F43F5E]/20 rounded-lg flex items-center justify-center transition-colors">
                <BarChart3 className="w-7 h-7 text-[#F43F5E]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Scenario Training</h3>
                <p className="text-sm text-[#94A3B8]">6 curated scenarios</p>
              </div>
            </button>

            {/* Statistics */}
            <button
              onClick={() => router.push('/poker/stats')}
              className="w-full flex items-center gap-4 p-4 bg-[#252542] hover:bg-[#F43F5E]/10 border border-[#334155] hover:border-[#F43F5E]/30 rounded-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-[#F43F5E]/10 group-hover:bg-[#F43F5E]/20 rounded-lg flex items-center justify-center transition-colors">
                <TrendingUp className="w-7 h-7 text-[#F43F5E]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Statistics</h3>
                <p className="text-sm text-[#94A3B8]">Track your progress</p>
              </div>
            </button>
          </div>
        </section>

        {/* Chinese Poker Section */}
        <section className="bg-[rgba(26,26,46,0.8)] backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-slideIn" style={{ animationDelay: '0.2s' }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#22C55E]/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-[#22C55E]" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>Chinese Poker</h2>
              <p className="text-[#94A3B8]">十三张训练与 EV 复盘</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-3 mt-6">
            <button
              onClick={() => router.push('/chinese-poker/training')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#22C55E]/20 to-[#7C3AED]/20 border border-[#22C55E] hover:border-[#86EFAC] rounded-xl transition-all duration-200 cursor-pointer group shadow-glow-success"
            >
              <div className="w-12 h-12 bg-[#22C55E]/30 group-hover:bg-[#22C55E]/40 rounded-lg flex items-center justify-center transition-colors">
                <GraduationCap className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold">Training Mode</h3>
                <p className="text-sm text-[#94A3B8]">发牌、排列、分析与复盘</p>
              </div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
