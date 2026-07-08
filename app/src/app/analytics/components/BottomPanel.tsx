"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveFunnel } from "@nivo/funnel";
import {
  Search, X, Settings, Plus, Eye, Copy, ChevronDown, ExternalLink,
  Code2, FileText, Zap, ArrowUpDown,
} from "lucide-react";
import {
  goalData, funnelData, userData, journeyData,
} from "@/app/analytics/data";

// ─── Portal tooltip — renders into document.body, never clipped ─────────────

function PortalTooltip({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let first = true;
    function onMove(e: MouseEvent) {
      const w = ref.current?.offsetWidth || 240;
      const h = ref.current?.offsetHeight || 200;
      const clampedX = Math.min(e.clientX + 16, window.innerWidth - w - 12);
      const clampedY = Math.max(Math.min(e.clientY - 10, window.innerHeight - h - 12), 8);
      setPos({ x: clampedX, y: clampedY });
      if (first) {
        first = false;
        requestAnimationFrame(() => setReady(true));
      }
    }
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); };
  }, []);

  if (typeof document === "undefined" || !pos) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: ready ? 1 : 0,
        transition: ready ? "left 0.1s ease-out, top 0.1s ease-out, opacity 0.15s ease" : "none",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const totalGoalCount = goalData.reduce((s, g) => s + g.count, 0);

// Generate 30 days of data for each goal
const goalChartData = Array.from({ length: 30 }, (_, i) => {
  const entry: Record<string, any> = { date: `Jun ${String(i + 1).padStart(2, "0")}` };
  goalData.forEach((g, gi) => {
    const base = g.count / 30;
    const variation = seededRandom(i * 100 + gi * 7) * base * 0.6;
    const trend = Math.sin(i * 0.3 + gi) * base * 0.3;
    entry[g.name] = Math.max(5, Math.round(base + variation + trend));
  });
  return entry;
});

// ─── Goal Tab ───────────────────────────────────────────────────────────────

function GoalTab() {
  const [search, setSearch] = useState("");
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [hiddenGoals, setHiddenGoals] = useState<Set<string>>(new Set());

  const filteredGoals = useMemo(() =>
    goalData.filter(g => g.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const activeGoal = selectedGoal || hoveredGoal;

  const visibleGoals = useMemo(() =>
    goalData.filter(g => !hiddenGoals.has(g.name)),
    [hiddenGoals]
  );

  const nivoLineData = useMemo(() =>
    visibleGoals.map(g => ({
      id: g.name,
      color: g.color,
      data: goalChartData.map(d => ({
        x: d.date,
        y: d[g.name] as number,
      })),
    })),
    [visibleGoals]
  );

  return (
    <div className="flex" style={{ minHeight: 420 }}>
      {/* Chart area — 75% */}
      <div className="flex-[3] p-5 border-r border-[#e5e5e5]">
        <div style={{ height: 380, position: "relative" }}>
          <ResponsiveLine
            data={nivoLineData}
            curve="catmullRom"
            margin={{ top: 10, right: 20, left: 50, bottom: 30 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
            axisBottom={{
              tickSize: 0,
              tickPadding: 8,
              tickValues: goalChartData.filter((_, i) => i % 5 === 0).map(d => d.date),
              format: (v: string) => v,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              tickValues: 5,
            }}
            theme={{
              axis: {
                ticks: {
                  text: { fontSize: 10, fill: "#999" },
                },
              },
              grid: {
                line: { stroke: "#f0f0f0", strokeDasharray: "3 3" },
              },
              crosshair: {
                line: { stroke: "#d4d4d4", strokeWidth: 1 },
              },
            }}
            colors={(serie: { id: string | number }) => {
              const goal = goalData.find(g => g.name === serie.id);
              if (!goal) return "#e5e5e5";
              if (activeGoal) {
                return activeGoal === goal.name ? goal.color : "#e5e5e5";
              }
              return goal.color;
            }}
            lineWidth={activeGoal ? 2.5 : 1.5}
            enableArea={false}
            enablePoints={false}
            enableGridX={false}
            enableGridY={true}
            crosshairType="bottom"
            useMesh={true}
            enableSlices="x"
            motionConfig="slow"
            sliceTooltip={({ slice }: any) => {
              const points = slice.points as any[];
              const total = points.reduce((s: number, p: any) => s + (p.data?.y || 0), 0);
              const sorted = [...points].sort((a: any, b: any) => (b.data?.y || 0) - (a.data?.y || 0));
              const top8 = sorted.slice(0, 8);
              const rest = sorted.slice(8);
              const restTotal = rest.reduce((s: number, p: any) => s + (p.data?.y || 0), 0);
              return (
                <PortalTooltip>
                  <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-2xl p-3 min-w-[200px]">
                    <p className="text-sm font-bold mb-2">{String(points[0]?.data?.x || "")}</p>
                    <div className="space-y-1">
                      {top8.map((p: any, i: number) => {
                        const name = p.serieId || p.serie?.id || p.id || `Goal ${i + 1}`;
                        const color = p.serieColor || p.serie?.color || p.color || "#ccc";
                        return (
                          <div key={i} className="flex items-center justify-between text-[11px] gap-3">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="truncate max-w-[120px]">{String(name)}</span>
                            </span>
                            <span className="font-bold tabular-nums">{p.data?.y || 0}</span>
                          </div>
                        );
                      })}
                      {rest.length > 0 && (
                        <div className="flex items-center justify-between text-[11px] gap-3 text-[#a3a3a3]">
                          <span>+{rest.length} more</span>
                          <span className="font-bold tabular-nums">{restTotal}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-[#e5e5e5] mt-1.5 pt-1.5 flex justify-between text-xs font-bold">
                      <span>Total</span>
                      <span>{total.toLocaleString()}</span>
                    </div>
                  </div>
                </PortalTooltip>
              );
            }}
          />
        </div>
      </div>

      {/* Goal list — 25% */}
      <div className="flex-[1] flex flex-col min-w-[220px]">
        {/* Search + action buttons */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#e5e5e5]">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a3a3a3]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search goals"
              className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-[#e5e5e5] text-xs focus:outline-none focus:border-[#f97316] transition-colors"
            />
          </div>
          <button
            onClick={() => setVisibilityModal(true)}
            className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#a3a3a3] hover:text-[#525252]"
            title="Goal visibility"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#a3a3a3] hover:text-[#525252]"
            title="Add goals"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Goal rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredGoals.map((g) => {
            const isActive = selectedGoal === g.name;
            const isHovered = hoveredGoal === g.name;
            const pct = ((g.count / totalGoalCount) * 100).toFixed(1);
            return (
              <button
                key={g.name}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-[#e5e5e5] last:border-0 transition-colors ${
                  isActive ? "bg-amber-50" : isHovered ? "bg-amber-50/60" : "hover:bg-[#fafafa]"
                }`}
                onMouseEnter={() => setHoveredGoal(g.name)}
                onMouseLeave={() => setHoveredGoal(null)}
                onClick={() => setSelectedGoal(prev => prev === g.name ? null : g.name)}
              >
                <span
                  className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                  style={{ backgroundColor: g.color }}
                >
                  {g.name.length > 12 ? g.name.slice(0, 12) + "..." : g.name}
                </span>
                <span className="flex-1" />
                <span className="text-xs font-semibold tabular-nums text-[#525252]">
                  {fmt(g.count)}
                  {(isActive || isHovered) && (
                    <span className="ml-1 text-[10px] text-[#a3a3a3] font-normal">{pct}%</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visibility Modal */}
      {visibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setVisibilityModal(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
              <div>
                <h3 className="font-bold text-sm">Goal visibility</h3>
                <p className="text-xs text-[#a3a3a3] mt-0.5">Choose which goals appear in this chart.</p>
              </div>
              <button onClick={() => setVisibilityModal(false)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#a3a3a3]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {goalData.map(g => {
                const visible = !hiddenGoals.has(g.name);
                return (
                  <div key={g.name} className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="text-sm">{g.name}</span>
                      <span className="text-xs text-[#a3a3a3]">{fmt(g.count)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setHiddenGoals(prev => {
                          const next = new Set(prev);
                          if (next.has(g.name)) next.delete(g.name);
                          else next.add(g.name);
                          return next;
                        });
                      }}
                      className={`w-10 h-5 rounded-full transition-colors relative ${visible ? "bg-[#f97316]" : "bg-[#d4d4d4]"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          visible ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Goals Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAddModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
              <h3 className="font-bold text-sm">Add goals</h3>
              <button onClick={() => setAddModal(false)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#a3a3a3]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#737373] mb-5">
                Track conversion goals by adding a small snippet to your website. Choose one of the methods below:
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Code2 className="w-5 h-5 text-[#f97316]" />, title: "JavaScript", desc: "Add a script tag and call trackGoal() when the event fires." },
                  { icon: <FileText className="w-5 h-5 text-[#3b82f6]" />, title: "HTML", desc: "Use a data-goal attribute on any clickable element." },
                  { icon: <Zap className="w-5 h-5 text-[#8b5cf6]" />, title: "API", desc: "Send a POST request to our REST endpoint with the goal name." },
                ].map(m => (
                  <div key={m.title} className="flex items-start gap-3 p-4 rounded-xl border border-[#e5e5e5] hover:border-[#f97316]/40 hover:bg-[#fff7ed] transition-colors cursor-pointer">
                    <div className="mt-0.5">{m.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="text-xs text-[#a3a3a3] mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#f97316] text-white text-sm font-medium hover:bg-[#ea580c] transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                Open documentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Funnel Tab ─────────────────────────────────────────────────────────────

function FunnelTab() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [funnelSelectorHover, setFunnelSelectorHover] = useState(false);
  const steps = funnelData.data;
  const maxVisitors = steps[0].visitors;

  // Top sources/countries for tooltip
  const topSources = [
    { name: "google.com", pct: "28%", icon: "🔍" },
    { name: "marclou.com", pct: "22%", icon: "🟧" },
    { name: "Direct", pct: "16%", icon: "⊕" },
  ];
  const topCountries = [
    { name: "United States", flag: "🇺🇸", pct: "19%" },
    { name: "France", flag: "🇫🇷", pct: "7%" },
    { name: "Germany", flag: "🇩🇪", pct: "5%" },
  ];

  const nivoFunnelData = useMemo(() =>
    steps.map((step, i) => ({
      id: step.name,
      value: step.visitors,
      label: step.name,
    })),
    []
  );

  const funnelColors = [
    "#1e3a8a", "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe",
  ];

  const stepIcons = ["🔥", "✅", "✅", "✅", "✅", "✅", "✅"];

  return (
    <div className="p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold">{funnelData.conversionRate}% conversion rate</p>
            <p className="text-[10px] text-[#a3a3a3]">Apr 28 → May 27</p>
          </div>
          <div
            className="relative"
            onMouseEnter={() => setFunnelSelectorHover(true)}
            onMouseLeave={() => setFunnelSelectorHover(false)}
          >
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-sm hover:bg-[#fafafa] transition-colors">
              <span className="text-[#f97316]">&#9632;</span>
              <span className="font-medium">{funnelData.name}</span>
              <ChevronDown className="w-3 h-3 text-[#a3a3a3]" />
            </button>
            {funnelSelectorHover && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#e5e5e5] rounded-lg shadow-xl p-3 min-w-[180px] pointer-events-none">
                <p className="text-xs font-bold">{funnelData.name}</p>
                <p className="text-[10px] text-[#a3a3a3] mt-0.5">{funnelData.steps} steps · {funnelData.conversionRate}% conv. rate</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nivo Funnel */}
      <div className="relative" style={{ height: 340 }}>
        <ResponsiveFunnel
          data={nivoFunnelData}
          margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
          direction="horizontal"
          interpolation="smooth"
          shapeBlending={0.82}
          spacing={2}
          valueFormat=" >-,.0f"
          colors={funnelColors}
          borderWidth={0}
          labelColor="#ffffff"
          enableBeforeSeparators={true}
          enableAfterSeparators={false}
          beforeSeparatorLength={100}
          beforeSeparatorOffset={0}
          currentPartSizeExtension={3}
          currentBorderWidth={0}
          motionConfig="molasses"
          onMouseEnter={(part: { data: { id: string } }) => setHoveredStep(part.data.id)}
          onMouseLeave={() => setHoveredStep(null)}
          tooltip={(props: { part: { data: { id: string; value: number; label: string } } }) => {
            const { part } = props;
            const stepIdx = steps.findIndex(s => s.name === part.data.id);
            const step = steps[stepIdx];
            if (!step) return null;
            const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;
            const nextStep = stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;
            const fromStart = ((step.visitors / maxVisitors) * 100).toFixed(1);
            const convToNext = nextStep ? ((nextStep.visitors / step.visitors) * 100).toFixed(1) : null;
            const stepValue = (step.visitors > 0 ? (step.visitors * 0.83) / step.visitors : 0).toFixed(2);
            const dropCount = prevStep ? prevStep.visitors - step.visitors : 0;

            return (
              <PortalTooltip>
              <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-2xl p-3 min-w-[260px]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold">{step.name}</p>
                  <span className="text-sm font-bold">{step.visitors.toLocaleString()}</span>
                </div>
                {dropCount > 0 && (
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>Dropoff</span>
                    <span className="text-red-500 font-semibold">-{dropCount.toLocaleString()}</span>
                  </div>
                )}
                {nextStep && (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#a3a3a3]">→ {nextStep.name}</span>
                    <span className="font-semibold">{nextStep.visitors.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[#e5e5e5] mt-1.5 pt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                  {convToNext && <><span className="text-[#a3a3a3]">Conversion</span><span className="text-right text-green-600 font-medium">{convToNext}%</span></>}
                  <span className="text-[#a3a3a3]">From start</span><span className="text-right">{fromStart}%</span>
                  <span className="text-[#a3a3a3]">Step value</span><span className="text-right">${stepValue}/visitor</span>
                </div>
                <div className="border-t border-[#e5e5e5] mt-1.5 pt-1.5 grid grid-cols-2 gap-x-6">
                  <div>
                    <p className="text-[9px] text-[#a3a3a3] uppercase font-medium mb-0.5">Top Sources</p>
                    {topSources.map(s => <div key={s.name} className="flex justify-between text-[10px]"><span>{s.icon} {s.name}</span><span className="text-[#a3a3a3]">{s.pct}</span></div>)}
                  </div>
                  <div>
                    <p className="text-[9px] text-[#a3a3a3] uppercase font-medium mb-0.5">Top Countries</p>
                    {topCountries.map(c => <div key={c.name} className="flex justify-between text-[10px]"><span>{c.flag} {c.name}</span><span className="text-[#a3a3a3]">{c.pct}</span></div>)}
                  </div>
                </div>
              </div>
              </PortalTooltip>
            );
          }}
        />
        {/* Drop-off pills — positioned near the top of each separator */}
        <div className="absolute inset-x-5 flex pointer-events-none" style={{ zIndex: 2, top: "22%" }}>
          {steps.slice(0, -1).map((step, i) => {
            const pct = ((1 - steps[i + 1].visitors / step.visitors) * 100).toFixed(1);
            return (
              <div key={i} className="flex-1 flex items-center justify-end">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap" style={{ background: "rgba(107,114,128,0.45)", color: "white", backdropFilter: "blur(4px)" }}>
                  -{pct}% →
                </span>
              </div>
            );
          })}
          <div className="flex-1" />
        </div>
      </div>

      {/* Step labels below the funnel */}
      <div className="flex px-5 mt-2">
        {steps.map((step, i) => (
          <div key={step.name} className="flex-1 text-center px-1">
            <p className="text-[13px] font-bold text-[#171717]">{fmt(step.visitors)} visitors</p>
            <p className="text-[11px] text-[#a3a3a3] flex items-center justify-center gap-1 mt-1">
              {i === 0 ? (
                <span className="text-xs">👆</span>
              ) : (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded bg-[#14b8a6] text-white text-[8px]">✓</span>
              )}
              <span className="truncate max-w-[80px]">{step.name}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── User Drawer ────────────────────────────────────────────────────────────

function UserDrawer({ user, onClose, highlightGoal }: {
  user: typeof userData[number];
  onClose: () => void;
  highlightGoal?: string | null;
}) {
  const [sortOldest, setSortOldest] = useState(false);
  const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // Build mock event timeline
  const events = useMemo(() => {
    const evts: { time: string; icon: string; text: string; type: string }[] = [
      { time: "10:32 AM", icon: "🔍", text: `Found site via referrer ${user.referrer}`, type: "referrer" },
      { time: "10:33 AM", icon: "👁", text: "Viewed page /", type: "page" },
      { time: "10:34 AM", icon: "👁", text: "Viewed page /pricing", type: "page" },
    ];
    // Add goal events from dots
    const goalNames = ["Scroll > Problem", "scroll_to_solution", "scroll_to_jainil_review", "scroll_to_pricing", "scroll_to_what_you_will_get", "scroll_to_adsy_review", "scroll_to_matthieu_review"];
    user.goalDots.forEach((dot, i) => {
      if (dot > 0) {
        const gName = goalNames[i] || `goal_${i}`;
        evts.push({
          time: `10:${35 + i} AM`,
          icon: "⊙",
          text: `Triggered event: ${gName} (${dot}) parameters`,
          type: "event",
        });
      }
    });
    if (user.isCustomer) {
      evts.push({ time: "10:45 AM", icon: "💰", text: "Completed payment", type: "event" });
    }
    return sortOldest ? evts : [...evts].reverse();
  }, [user, sortOldest]);

  // Activity grid (6 months x ~4 weeks)
  const activityGrid = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const v = seededRandom(i * 31 + user.name.length);
      return v > 0.7 ? 3 : v > 0.4 ? 2 : v > 0.2 ? 1 : 0;
    });
  }, [user.name]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const pageviews = 3 + user.goalDots.filter(d => d > 0).length;
  const spent = user.revenue;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-[#e5e5e5] shadow-2xl rounded-t-2xl"
      style={{ height: "60vh", minHeight: 400 }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1 cursor-pointer" onClick={onClose}>
        <div className="w-10 h-1 rounded-full bg-[#d4d4d4]" />
      </div>

      <div className="flex h-full overflow-hidden" style={{ height: "calc(100% - 20px)" }}>
        {/* Left sidebar */}
        <div className="w-64 border-r border-[#e5e5e5] p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-lg font-bold mb-2">
              {initials}
            </div>
            <p className="text-sm font-bold">{user.name}</p>
            {user.isCustomer && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 mt-1">
                Customer
              </span>
            )}
          </div>
          <div className="space-y-2 text-xs text-[#525252]">
            <div><span className="text-[#a3a3a3]">Location</span><p className="font-medium">{user.country}</p></div>
            <div><span className="text-[#a3a3a3]">Device</span><p className="font-medium">{user.device}</p></div>
            <div><span className="text-[#a3a3a3]">Resolution</span><p className="font-medium">1920 x 1080</p></div>
          </div>
          <button className="text-xs text-[#f97316] hover:underline text-left">+ Add parameters</button>
        </div>

        {/* Center: event log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="flex items-center gap-2 px-5 py-2 border-b border-[#e5e5e5] shrink-0">
            <button
              onClick={() => setSortOldest(s => !s)}
              className="flex items-center gap-1 text-[10px] font-medium text-[#a3a3a3] hover:text-[#525252] uppercase"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortOldest ? "OLDEST FIRST" : "NEWEST FIRST"}
            </button>
            <button
              onClick={() => {
                const text = events.map(e => `${e.time} ${e.text}`).join("\n");
                navigator.clipboard.writeText(text).catch(() => {});
              }}
              className="flex items-center gap-1 text-[10px] font-medium text-[#a3a3a3] hover:text-[#525252] uppercase ml-auto"
            >
              <Copy className="w-3 h-3" />
              COPY
            </button>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-[10px] font-medium text-[#a3a3a3] uppercase mb-3">Today</p>
            <div className="space-y-1">
              {events.map((evt, i) => {
                const isHighlighted = highlightGoal && evt.text.includes(highlightGoal);
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isHighlighted ? "bg-amber-50 border border-amber-200" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <span className="text-xs mt-0.5 shrink-0">{evt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{evt.text}</p>
                    </div>
                    <span className="text-[10px] text-[#a3a3a3] shrink-0">{evt.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 border-l border-[#e5e5e5] p-5 overflow-y-auto shrink-0">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-[#a3a3a3] uppercase font-medium">Pageviews</p>
              <p className="text-xl font-bold">{pageviews}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#a3a3a3] uppercase font-medium">Spent</p>
              <p className="text-xl font-bold">{spent}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#a3a3a3] uppercase font-medium">Time to completion</p>
              <p className="text-xl font-bold">17m</p>
            </div>
            <div>
              <p className="text-[10px] text-[#a3a3a3] uppercase font-medium mb-2">Activity</p>
              <div className="grid grid-cols-6 gap-1">
                {activityGrid.map((v, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      v === 3 ? "bg-[#f97316]" : v === 2 ? "bg-[#fdba74]" : v === 1 ? "bg-[#fed7aa]" : "bg-[#f5f5f5]"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#a3a3a3] uppercase font-medium">Summary</p>
              <p className="text-xs text-[#a3a3a3] italic mt-1">coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Tab ───────────────────────────────────────────────────────────────

function UserTab() {
  const [selectedUser, setSelectedUser] = useState<typeof userData[number] | null>(null);

  return (
    <>
      <div className="grid grid-cols-[1fr_140px_80px_160px] px-4 py-2 border-b border-[#e5e5e5] bg-[#fafafa] text-xs text-[#a3a3a3] font-medium">
        <span>Visitor</span><span>Source</span><span>Spent</span><span>Last seen</span>
      </div>
      {userData.map((u, i) => {
        const initials = u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div
            key={i}
            onClick={() => setSelectedUser(u)}
            className="grid grid-cols-[1fr_140px_80px_160px] px-4 py-3 border-b border-[#e5e5e5] last:border-0 hover:bg-blue-50/30 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium group-hover:text-[#f97316] transition-colors truncate">{u.name}</span>
                  {u.isCustomer && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shrink-0">
                      Customer
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#a3a3a3]">
                  <span>{u.country}</span>
                  <span className="text-[#d4d4d4]">|</span>
                  <span>{u.device}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-[#737373]">
              <span>{u.refIcon}</span><span className="truncate">{u.referrer}</span>
            </div>
            <div className={`flex items-center text-sm font-semibold ${u.revenue !== "$0" ? "text-[#f97316]" : "text-[#a3a3a3]"}`}>
              {u.revenue === "$0" ? "–" : u.revenue}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a3a3a3]">{u.time}</span>
              <div className="flex gap-0.5">
                {u.goalDots.map((dot, di) => (
                  <div key={di} className={`w-2 h-2 rounded-full ${dot === 2 ? "bg-[#f97316]" : dot === 1 ? "bg-blue-400" : "bg-[#e5e5e5]"}`} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {selectedUser && (
        <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}

// ─── Journey Tab ────────────────────────────────────────────────────────────

function JourneyTab() {
  const [selectedJourney, setSelectedJourney] = useState<typeof journeyData[number] | null>(null);
  const [goalDD, setGoalDD] = useState(false);
  const [selectedGoalName, setSelectedGoalName] = useState("Payment");
  const [goalSearch, setGoalSearch] = useState("");

  const filteredGoals = useMemo(() =>
    goalData.filter(g => g.name.toLowerCase().includes(goalSearch.toLowerCase())),
    [goalSearch]
  );

  // Map journey user to a userData-like shape for the drawer
  const journeyToUser = useCallback((j: typeof journeyData[number]) => {
    return {
      name: j.visitor,
      country: j.country,
      device: j.device,
      referrer: j.source,
      refIcon: j.sourceIcon,
      revenue: `$${j.spent}`,
      time: j.completed,
      goalDots: j.steps,
      isCustomer: j.tag === "Customer",
    };
  }, []);

  return (
    <>
      {/* Goal selector in header area */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e5e5e5] bg-[#fafafa]">
        <div className="relative">
          <button
            onClick={() => setGoalDD(!goalDD)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-xs font-medium hover:bg-white transition-colors"
          >
            <span>Goal: 💰 {selectedGoalName}</span>
            <span className="text-[#a3a3a3]">26</span>
            <ChevronDown className="w-3 h-3 text-[#a3a3a3]" />
          </button>
          {goalDD && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-[#e5e5e5] rounded-lg shadow-xl min-w-[240px] overflow-hidden">
              <div className="p-2 border-b border-[#e5e5e5]">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a3a3a3]" />
                  <input
                    value={goalSearch}
                    onChange={e => setGoalSearch(e.target.value)}
                    placeholder="Search goals..."
                    className="w-full pl-7 pr-2 py-1.5 rounded-md border border-[#e5e5e5] text-xs focus:outline-none focus:border-[#f97316]"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[240px] overflow-y-auto py-1">
                {filteredGoals.map(g => (
                  <button
                    key={g.name}
                    onClick={() => { setSelectedGoalName(g.name); setGoalDD(false); setGoalSearch(""); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f5f5f5] flex items-center justify-between ${
                      selectedGoalName === g.name ? "bg-[#f5f5f5] font-semibold" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.name}
                    </span>
                    <span className="text-[#a3a3a3]">{fmt(g.count)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-[1fr_140px_80px_120px_160px] text-xs text-[#a3a3a3] font-medium">
          <span>Visitor</span><span>Source</span><span>Spent</span><span>Time to complete</span><span>Completed at</span>
        </div>
      </div>

      {journeyData.map((j, i) => (
        <div
          key={i}
          onClick={() => setSelectedJourney(j)}
          className="grid grid-cols-[1fr_140px_80px_120px_160px] px-4 py-3 border-b border-[#e5e5e5] last:border-0 hover:bg-blue-50/30 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f97316]/20 to-purple-300/20 flex items-center justify-center text-xs font-bold shrink-0">
              {j.visitor.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium group-hover:text-[#f97316] transition-colors">{j.visitor}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20">
                  {j.tag}
                </span>
              </div>
              <span className="text-[10px] text-[#a3a3a3]">{j.country} &middot; {j.device}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-[#737373]">
            <span>{j.sourceIcon}</span><span className="truncate">{j.source}</span>
          </div>
          <div className="flex items-center text-sm font-semibold text-[#f97316]">${j.spent}</div>
          <div className="flex items-center text-sm text-[#737373]">{j.time}</div>
          <div className="flex items-center">
            <div>
              <p className="text-xs text-[#525252]">{j.completed}</p>
              <div className="flex gap-0.5 mt-1">
                {j.steps.map((s, si) => (
                  <div key={si} className={`w-2 h-2 rounded-full ${s === 2 ? "bg-[#f97316]" : s === 1 ? "bg-blue-400" : "bg-[#e5e5e5]"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {selectedJourney && (
        <UserDrawer
          user={journeyToUser(selectedJourney)}
          onClose={() => setSelectedJourney(null)}
          highlightGoal={selectedGoalName}
        />
      )}
    </>
  );
}

// ─── Main BottomPanel ───────────────────────────────────────────────────────

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<"Goal" | "Funnel" | "User" | "Journey">("Goal");

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-[#e5e5e5]">
        {(["Goal", "Funnel", "User", "Journey"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeTab === t
                ? "font-bold text-[#171717]"
                : "font-normal text-[#a3a3a3] hover:text-[#525252]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Goal" && <GoalTab />}
      {activeTab === "Funnel" && <FunnelTab />}
      {activeTab === "User" && <UserTab />}
      {activeTab === "Journey" && <JourneyTab />}
    </div>
  );
}
