import React from 'react';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { centsToDollars } from '../../lib/utils/format';

export const WallOfFameStrip: React.FC = () => {
  const milestones = [
    { title: 'Inaugural #1', product: 'Buildfast', date: 'Active Champion', highlight: true },
    { title: 'Category Pioneer', product: 'Buildfast', date: 'AI Code & Dev', highlight: false },
    { title: 'Open Throne', product: 'Available', date: 'Claim for $51', highlight: false },
    { title: 'Next Flex Milestone', product: 'First $100', date: '$50 away', highlight: false },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0d1029] via-[#101432] to-[#0d1029] border border-dark-border shadow-xl p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-glow-purple">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Wall of Fame</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h3>
              <p className="text-xs text-gray-400">Legendary moments in FlexAI history</p>
            </div>
          </div>

          {/* Center Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {milestones.map((m, idx) => (
              <div key={idx} className="border-l border-dark-border/80 pl-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${m.highlight ? 'text-purple-400' : 'text-rose-400'}`}>
                  {m.title}
                </span>
                <span className="text-sm font-extrabold text-white block mt-0.5">{m.product}</span>
                <span className="text-xs text-gray-400 block font-mono">{m.date}</span>
              </div>
            ))}
          </div>

          {/* Right Action Button */}
          <div className="shrink-0">
            <a
              href="/hall-of-fame"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-dark-800 hover:bg-dark-700 border border-dark-border hover:border-purple-500/40 shadow-sm transition-all"
            >
              <span>View All Milestones</span>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
