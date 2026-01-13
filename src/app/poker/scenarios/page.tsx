'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingUp, Zap, Trophy } from 'lucide-react';
import { SCENARIOS } from '@/poker/data/strategies';
import { Button, Card } from '@/components/ui';

export default function ScenariosPage() {
  const router = useRouter();

  const beginnerScenarios = SCENARIOS.filter(s => s.difficulty === 'beginner');
  const intermediateScenarios = SCENARIOS.filter(s => s.difficulty === 'intermediate');
  const advancedScenarios = SCENARIOS.filter(s => s.difficulty === 'advanced');

  const handleScenarioClick = (scenarioId: string) => {
    router.push(`/poker/training?scenario=${scenarioId}`);
  };

  const difficultyConfig = {
    beginner: {
      icon: Target,
      color: '#22c55e',
      bgColor: 'bg-[#22c55e]/10',
      borderColor: 'border-[#22c55e]/30',
      textColor: 'text-[#22c55e]',
    },
    intermediate: {
      icon: TrendingUp,
      color: '#eab308',
      bgColor: 'bg-[#eab308]/10',
      borderColor: 'border-[#eab308]/30',
      textColor: 'text-[#eab308]',
    },
    advanced: {
      icon: Zap,
      color: '#F43F5E',
      bgColor: 'bg-[#F43F5E]/10',
      borderColor: 'border-[#F43F5E]/30',
      textColor: 'text-[#F43F5E]',
    },
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="flex items-center gap-5 px-5 py-4 bg-black/20">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push('/')}
        >
          Back
        </Button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Scenario Training
        </h1>
      </header>

      {/* Intro */}
      <div className="px-5 py-6 text-center max-w-3xl mx-auto">
        <Trophy className="w-16 h-16 text-[#7C3AED] mx-auto mb-4" strokeWidth={1.5} />
        <p className="text-lg mb-2" style={{ fontFamily: 'var(--font-family-body)' }}>
          选择一个训练场景来练习特定的GTO策略。每个场景都有明确的学习目标。
        </p>
        <p className="text-sm text-[#94A3B8]">
          Choose a training scenario to practice specific GTO strategies. Each scenario has clear learning objectives.
        </p>
      </div>

      <div className="px-5 pb-8 space-y-8">
        {/* Beginner */}
        {beginnerScenarios.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-[#22c55e]" strokeWidth={2} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
                Beginner
              </h2>
              <span className="text-sm text-[#94A3B8]">基础入门</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beginnerScenarios.map(scenario => {
                const config = difficultyConfig.beginner;
                const Icon = config.icon;

                return (
                  <Card
                    key={scenario.id}
                    variant="glass"
                    className="cursor-pointer hover:border-[#22c55e]/50 transition-all duration-300"
                    onClick={() => handleScenarioClick(scenario.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-family-heading)' }}>
                          {scenario.name}
                        </h3>
                        <p className="text-sm text-[#94A3B8]">{scenario.nameZh}</p>
                      </div>
                      <div className={`${config.bgColor} ${config.borderColor} border px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
                        <Icon className={`w-3.5 h-3.5 ${config.textColor}`} strokeWidth={2} />
                        <span className={`text-xs font-semibold ${config.textColor}`}>
                          {scenario.position}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#E2E8F0]/80 mb-4">
                      {scenario.description}
                    </p>

                    {/* Learning Objectives */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-[#94A3B8] uppercase mb-2">
                        Learning Objectives:
                      </h4>
                      <ul className="space-y-1.5">
                        {scenario.learningObjectives.map((obj, i) => (
                          <li key={i} className="text-xs text-[#E2E8F0]/70 flex items-start gap-2">
                            <span className={`${config.textColor} mt-0.5`}>•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Start Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScenarioClick(scenario.id);
                      }}
                    >
                      Start Training →
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Intermediate */}
        {intermediateScenarios.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-[#eab308]" strokeWidth={2} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
                Intermediate
              </h2>
              <span className="text-sm text-[#94A3B8]">进阶提升</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {intermediateScenarios.map(scenario => {
                const config = difficultyConfig.intermediate;
                const Icon = config.icon;

                return (
                  <Card
                    key={scenario.id}
                    variant="glass"
                    className="cursor-pointer hover:border-[#eab308]/50 transition-all duration-300"
                    onClick={() => handleScenarioClick(scenario.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-family-heading)' }}>
                          {scenario.name}
                        </h3>
                        <p className="text-sm text-[#94A3B8]">{scenario.nameZh}</p>
                      </div>
                      <div className={`${config.bgColor} ${config.borderColor} border px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
                        <Icon className={`w-3.5 h-3.5 ${config.textColor}`} strokeWidth={2} />
                        <span className={`text-xs font-semibold ${config.textColor}`}>
                          {scenario.position}{scenario.vsPosition && ` vs ${scenario.vsPosition}`}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#E2E8F0]/80 mb-4">
                      {scenario.description}
                    </p>

                    {/* Learning Objectives */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-[#94A3B8] uppercase mb-2">
                        Learning Objectives:
                      </h4>
                      <ul className="space-y-1.5">
                        {scenario.learningObjectives.map((obj, i) => (
                          <li key={i} className="text-xs text-[#E2E8F0]/70 flex items-start gap-2">
                            <span className={`${config.textColor} mt-0.5`}>•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Start Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScenarioClick(scenario.id);
                      }}
                    >
                      Start Training →
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Advanced */}
        {advancedScenarios.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-[#F43F5E]" strokeWidth={2} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
                Advanced
              </h2>
              <span className="text-sm text-[#94A3B8]">高级进阶</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedScenarios.map(scenario => {
                const config = difficultyConfig.advanced;
                const Icon = config.icon;

                return (
                  <Card
                    key={scenario.id}
                    variant="glass"
                    className="cursor-pointer hover:border-[#F43F5E]/50 transition-all duration-300"
                    onClick={() => handleScenarioClick(scenario.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-family-heading)' }}>
                          {scenario.name}
                        </h3>
                        <p className="text-sm text-[#94A3B8]">{scenario.nameZh}</p>
                      </div>
                      <div className={`${config.bgColor} ${config.borderColor} border px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
                        <Icon className={`w-3.5 h-3.5 ${config.textColor}`} strokeWidth={2} />
                        <span className={`text-xs font-semibold ${config.textColor}`}>
                          {scenario.position}{scenario.vsPosition && ` vs ${scenario.vsPosition}`}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#E2E8F0]/80 mb-4">
                      {scenario.description}
                    </p>

                    {/* Learning Objectives */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-[#94A3B8] uppercase mb-2">
                        Learning Objectives:
                      </h4>
                      <ul className="space-y-1.5">
                        {scenario.learningObjectives.map((obj, i) => (
                          <li key={i} className="text-xs text-[#E2E8F0]/70 flex items-start gap-2">
                            <span className={`${config.textColor} mt-0.5`}>•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Start Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScenarioClick(scenario.id);
                      }}
                    >
                      Start Training →
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
