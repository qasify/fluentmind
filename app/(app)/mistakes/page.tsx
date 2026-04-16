"use client";

import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { motion } from "framer-motion";

export default function MistakesPage() {
  const { mistakes } = useAppStore();
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const toggleRule = (id: string) => {
    setExpandedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeMistakes = mistakes.filter(m => m.status === 'active');
  const fixedMistakes = mistakes.filter(m => m.status === 'fixed');

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">🎯 Weakness Tracking</h1>
        <p className="page-subtitle">
          Mistakes the AI is actively monitoring in your sessions
        </p>
      </div>

      <div className="card p-6 border-[rgba(244,63,94,0.1)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-5 flex items-center gap-2">Targeted Areas</h3>
          <div className="text-sm font-mono text-tertiary">
            <span className="text-warning-400">{activeMistakes.length} Active</span>
            <span className="opacity-50 mx-2">|</span>
            <span className="text-success-400">{fixedMistakes.length} Fixed</span>
          </div>
        </div>

        {activeMistakes.length === 0 && fixedMistakes.length === 0 ? (
          <div className="text-center py-10 text-[#6b6b80]">
            <div className="text-4xl mb-4">✨</div>
            No tracked mistakes yet. Start practicing and the AI will track recurring areas for improvement!
          </div>
        ) : (
          <>
            {/* Mobile (Single Column) */}
            <div className="flex flex-col gap-4 lg:hidden">
              {activeMistakes.map(mistake => {
                const isExpanded = !!expandedRules[mistake.id];
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={mistake.id}
                    className="bg-[rgba(244,63,94,0.03)] border border-[rgba(244,63,94,0.1)] rounded-xl relative overflow-hidden group transition-all duration-300"
                  >
                    <div
                      className="p-4 cursor-pointer flex flex-col hover:bg-[rgba(244,63,94,0.05)] transition-colors"
                      onClick={() => toggleRule(mistake.id)}
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-30 text-danger-400">⚠️</div>
                      <div className="text-[10px] uppercase font-bold text-danger-400 tracking-wider mb-2 flex items-center justify-between">
                        <span>{mistake.errorType.replace("_", " ")}</span>
                        <div className="flex gap-1 pr-6" title={`Avoided ${mistake.avoidanceCount || 0}/3 times to fix`}>
                          {[1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className={`w-3 h-1 rounded-full ${step <= (mistake.avoidanceCount || 0) ? "bg-success-400" : "bg-danger-400/20"
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="font-medium text-[#f0f0f5]">
                          <span className="text-[#a0a0b5] font-normal mr-2">Rule:</span>
                          {mistake.rule}
                        </div>
                        <div className="text-xs text-[#6b6b80] whitespace-nowrap mt-1">
                          {mistake.examples?.length || 0} examples {isExpanded ? "▲" : "▼"}
                        </div>
                      </div>
                    </div>

                    {isExpanded && mistake.examples && mistake.examples.length > 0 && (
                      <div className="px-4 pb-4 pt-1 border-t border-[rgba(244,63,94,0.05)] bg-[rgba(0,0,0,0.1)]">
                        <h4 className="text-xs font-semibold text-[#8b8b9d] uppercase tracking-wider mb-3 mt-2">
                          Captured Mistakes
                        </h4>
                        <div className="space-y-3">
                          {mistake.examples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col gap-1 text-sm bg-background-tertiary p-3 rounded-lg border border-[rgba(255,255,255,0.02)]"
                            >
                              <div>
                                <span className="text-danger-400 mr-2 text-xs">Said:</span>
                                <span className="line-through decoration-danger-400/50 text-[#c8c8d5]">
                                  {ex.originalText}
                                </span>
                              </div>
                              <div>
                                <span className="text-success-400 mr-2 text-xs">Better:</span>
                                <span className="text-[#f0f0f5]">{ex.suggestion}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop (True Masonry behavior with Left-to-Right Array Splitting) */}
            <div className="hidden lg:flex flex-row gap-4 items-start">
              <div className="flex-1 flex flex-col gap-4">
                {activeMistakes.filter((_, i) => i % 2 === 0).map(mistake => {
                  const isExpanded = !!expandedRules[mistake.id];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={mistake.id}
                      className="bg-[rgba(244,63,94,0.03)] border border-[rgba(244,63,94,0.1)] rounded-xl relative overflow-hidden group transition-all duration-300"
                    >
                      <div
                        className="p-4 cursor-pointer flex flex-col hover:bg-[rgba(244,63,94,0.05)] transition-colors"
                        onClick={() => toggleRule(mistake.id)}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-30 text-danger-400">⚠️</div>
                        <div className="text-[10px] uppercase font-bold text-danger-400 tracking-wider mb-2 flex items-center justify-between">
                          <span>{mistake.errorType.replace("_", " ")}</span>
                          <div className="flex gap-1 pr-6" title={`Avoided ${mistake.avoidanceCount || 0}/3 times to fix`}>
                            {[1, 2, 3].map((step) => (
                              <div
                                key={step}
                                className={`w-3 h-1 rounded-full ${step <= (mistake.avoidanceCount || 0) ? "bg-success-400" : "bg-danger-400/20"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="font-medium text-[#f0f0f5]">
                            <span className="text-[#a0a0b5] font-normal mr-2">Rule:</span>
                            {mistake.rule}
                          </div>
                          <div className="text-xs text-[#6b6b80] whitespace-nowrap mt-1">
                            {mistake.examples?.length || 0} examples {isExpanded ? "▲" : "▼"}
                          </div>
                        </div>
                      </div>

                      {isExpanded && mistake.examples && mistake.examples.length > 0 && (
                        <div className="px-4 pb-4 pt-1 border-t border-[rgba(244,63,94,0.05)] bg-[rgba(0,0,0,0.1)]">
                          <h4 className="text-xs font-semibold text-[#8b8b9d] uppercase tracking-wider mb-3 mt-2">
                            Captured Mistakes
                          </h4>
                          <div className="space-y-3">
                            {mistake.examples.map((ex, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col gap-1 text-sm bg-background-tertiary p-3 rounded-lg border border-[rgba(255,255,255,0.02)]"
                              >
                                <div>
                                  <span className="text-danger-400 mr-2 text-xs">Said:</span>
                                  <span className="line-through decoration-danger-400/50 text-[#c8c8d5]">
                                    {ex.originalText}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-success-400 mr-2 text-xs">Better:</span>
                                  <span className="text-[#f0f0f5]">{ex.suggestion}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex-1 flex flex-col gap-4">
                {activeMistakes.filter((_, i) => i % 2 !== 0).map(mistake => {
                  const isExpanded = !!expandedRules[mistake.id];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={mistake.id}
                      className="bg-[rgba(244,63,94,0.03)] border border-[rgba(244,63,94,0.1)] rounded-xl relative overflow-hidden group transition-all duration-300"
                    >
                      <div
                        className="p-4 cursor-pointer flex flex-col hover:bg-[rgba(244,63,94,0.05)] transition-colors"
                        onClick={() => toggleRule(mistake.id)}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-30 text-danger-400">⚠️</div>
                        <div className="text-[10px] uppercase font-bold text-danger-400 tracking-wider mb-2 flex items-center justify-between">
                          <span>{mistake.errorType.replace("_", " ")}</span>
                          <div className="flex gap-1 pr-6" title={`Avoided ${mistake.avoidanceCount || 0}/3 times to fix`}>
                            {[1, 2, 3].map((step) => (
                              <div
                                key={step}
                                className={`w-3 h-1 rounded-full ${step <= (mistake.avoidanceCount || 0) ? "bg-success-400" : "bg-danger-400/20"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="font-medium text-[#f0f0f5]">
                            <span className="text-[#a0a0b5] font-normal mr-2">Rule:</span>
                            {mistake.rule}
                          </div>
                          <div className="text-xs text-[#6b6b80] whitespace-nowrap mt-1">
                            {mistake.examples?.length || 0} examples {isExpanded ? "▲" : "▼"}
                          </div>
                        </div>
                      </div>

                      {isExpanded && mistake.examples && mistake.examples.length > 0 && (
                        <div className="px-4 pb-4 pt-1 border-t border-[rgba(244,63,94,0.05)] bg-[rgba(0,0,0,0.1)]">
                          <h4 className="text-xs font-semibold text-[#8b8b9d] uppercase tracking-wider mb-3 mt-2">
                            Captured Mistakes
                          </h4>
                          <div className="space-y-3">
                            {mistake.examples.map((ex, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col gap-1 text-sm bg-background-tertiary p-3 rounded-lg border border-[rgba(255,255,255,0.02)]"
                              >
                                <div>
                                  <span className="text-danger-400 mr-2 text-xs">Said:</span>
                                  <span className="line-through decoration-danger-400/50 text-[#c8c8d5]">
                                    {ex.originalText}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-success-400 mr-2 text-xs">Better:</span>
                                  <span className="text-[#f0f0f5]">{ex.suggestion}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {activeMistakes.length === 0 && fixedMistakes.length > 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-6 text-success-400 bg-success-500/10 rounded-xl border border-success-500/20 mt-4">
                🎉 Amazing job! You have successfully fixed all actively tracked mistakes.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
