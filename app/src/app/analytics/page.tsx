"use client";

import { Button } from "@/components/Button";
import {
  BarChart3, Users, DollarSign, ArrowUpRight, ArrowDownRight,
  MousePointer, Clock, Download, Code2, ChevronDown, Maximize2,
  ChevronLeft, ChevronRight, Filter, RefreshCw, Search, X,
  ExternalLink, Target, CreditCard, ShoppingCart, Trophy, Globe,
} from "lucide-react";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveChoropleth } from "@nivo/geo";
import {
  AreaChart, Area, ComposedChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  dailyData, channelData, referrerData, campaignData, campaignFilterOptions,
  keywordData, countryData, regionData, cityData,
  hostnameData, pageViewData, entryPageData, exitLinkData,
  browserData, osData, deviceData,
  goalData, funnelData, userData, journeyData,
  METRICS,
  type MetricKey, type SortMode, type FilterType, type ActiveFilter,
} from "@/app/analytics/data";
import { BottomPanel } from "@/app/analytics/components/BottomPanel";

// ---- helpers ---------------------------------------------------------------

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function srt<T extends { visitors: number; revenue: number }>(d: T[], s: SortMode): T[] {
  return [...d].sort((a, b) => s === "revenue" ? b.revenue - a.revenue : b.visitors - a.visitors);
}
const isLinkType = (t: FilterType) => t === "referrer" || t === "campaign";

// ---- small components ------------------------------------------------------

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative rounded-full h-2 w-2 bg-green-500" />
    </span>
  );
}

function FilterPill({ f, onRemove }: { f: ActiveFilter; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium">
      <span className="capitalize text-muted-foreground">{f.type} is</span>
      {f.icon && <span>{f.icon}</span>}
      <span className="font-semibold">{f.value}</span>
      <button onClick={onRemove} className="ml-0.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ---- KPI metric card -------------------------------------------------------

function TopMetric({ k, active, onClick, filterCount }: { k: MetricKey; active: boolean; onClick: () => void; filterCount: number }) {
  const m = METRICS[k];
  const [hov, setHov] = useState(false);
  const isRevenue = k === "revenue";
  // Revenue hover popover data
  const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);
  const totalRefunds = dailyData.reduce((s, d) => s + d.refunds, 0);
  const totalNew = totalRevenue - totalRefunds;

  return (
    <div className="relative flex-1 min-w-[110px]"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button onClick={onClick}
        className={`w-full px-3 py-3 text-left transition-all border-b-[3px] ${active ? "border-accent" : "border-transparent hover:bg-surface/50"}`}>
        <p className={`text-[10px] mb-0.5 ${active ? "text-accent font-semibold underline underline-offset-2 decoration-accent" : "text-muted-foreground"}`}>
          {m.label}
        </p>
        <div className="flex items-center gap-1.5">
          <p className={`text-xl font-bold ${active ? "text-accent" : ""}`}>{m.val}</p>
          {filterCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">
              {filterCount} filter{filterCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium ${m.up ? "text-success" : "text-error"}`}>
          {m.up ? "↑" : "↓"} {m.change}
        </span>
      </button>
      {/* Revenue hover popover */}
      {isRevenue && hov && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-border rounded-xl shadow-2xl p-3.5 min-w-[200px] pointer-events-none">
          <p className="text-xs font-bold mb-2">Revenue breakdown</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-300" />Refunds</span>
              <span className="font-bold text-error">${totalRefunds.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-accent" />New revenue</span>
              <span className="font-bold text-accent">${totalNew.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-1.5 flex justify-between text-xs font-bold">
              <span>Total</span>
              <span>${totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- neon cursor for chart hover -------------------------------------------

function NeonCursor({ color, points, height }: any) {
  if (!points || !points.length) return null;
  const x = points[0]?.x;
  if (x == null) return null;
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
      <line x1={x} y1={0} x2={x} y2={height} stroke={color} strokeWidth={2} strokeOpacity={0.15} filter="url(#neonCursorGlow)" />
      <circle cx={x} cy={points[0]?.y ?? 0} r={5} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} />
      <circle cx={x} cy={points[0]?.y ?? 0} r={5} fill="none" stroke={color} strokeWidth={4} strokeOpacity={0.1} />
      <defs>
        <filter id="neonCursorGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor={color} floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </g>
  );
}

// ---- chart tooltips --------------------------------------------------------

function ChartTip({ active, payload, mk }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const m = METRICS[mk as MetricKey];
  if (mk === "revenue") {
    const np = d.newV ? Math.round((d.newV / d.visitors) * 100) : 0;
    return (
      <div className="bg-white border border-border rounded-xl shadow-2xl p-4 min-w-[240px]">
        <p className="text-sm font-bold mb-3">{d.date}</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />Visitors</span>
          <span className="font-bold">{d.visitors}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${np}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
          <span>{d.newV} new</span><span>{d.ret} returning</span>
        </div>
        <div className="border-t border-border pt-2 space-y-1">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">REVENUE</span><span className="font-bold text-accent">${d.revenue}</span></div>
          {d.refunds > 0 && <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-300/50" />Refunds</span><span className="text-error">${d.refunds}</span></div>}
          <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" />New</span><span className="font-semibold">${d.newRevenue}</span></div>
          <div className="border-t border-border pt-1 mt-1">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Revenue/visitor</span><span>${d.rpv}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Conversion rate</span><span>{d.convRate}%</span></div>
          </div>
        </div>
      </div>
    );
  }
  if (mk === "visitors") {
    return (
      <div className="bg-white border border-border rounded-xl shadow-2xl p-4 min-w-[220px]">
        <p className="text-sm font-bold mb-2">{d.date}</p>
        <div className="flex justify-between text-xs mb-0.5"><span>Pageviews</span><span className="font-bold">{d.pageviews}</span></div>
        <div className="text-[10px] text-muted-foreground mb-2">Pages/visitor: {(d.pageviews / d.visitors).toFixed(1)}</div>
        <div className="border-t border-border pt-2">
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Unique visitors</p>
          <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-300" />New</span><span className="font-bold">{d.newV}</span></div>
          <div className="flex justify-between text-xs mt-0.5"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" />Returning</span><span className="font-bold">{d.ret}</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">Returning rate: {d.ret > 0 ? Math.round(d.ret / d.visitors * 100) : 0}%</div>
        </div>
      </div>
    );
  }
  const val = mk === "rpv" ? `$${d.rpv}` : mk === "bounceRate" ? `${d.bounceRate}%` : mk === "sessionTime" ? d.sessionLabel : mk === "convRate" ? `${d.convRate}%` : d[mk];
  return (
    <div className="bg-white border border-border rounded-xl shadow-2xl p-4 min-w-[200px]">
      <p className="text-sm font-bold mb-2">{d.date}</p>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: m?.color }} />{m?.label}</span>
        <span className="text-sm font-bold">{val}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{m?.desc}</p>
    </div>
  );
}

// ---- panel-level tooltip ---------------------------------------------------

function PanelTooltip({ item, isKeyword, isExitLink, cursorRef, rowRef, panelBoundsRef }: {
  item: any | null; isKeyword?: boolean; isExitLink?: boolean;
  cursorRef: React.MutableRefObject<{ x: number; y: number }>;
  rowRef: React.MutableRefObject<{ top: number; bottom: number }>;
  panelBoundsRef: React.MutableRefObject<{ left: number; right: number; top: number; bottom: number }>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });   // current rendered position
  const fresh = useRef(true);           // snap (don't glide) on first appearance

  // Mark for a snap whenever the tooltip is hidden, so it never flies across
  // the screen from a stale spot when it reappears on a far-away row.
  if (!item) fresh.current = true;

  useEffect(() => {
    let raf = 0;
    const gap = 14;
    const margin = 12;   // min distance the tooltip keeps from the panel edges
    const tick = () => {
      const el = ref.current;
      if (el) {
        const w = el.offsetWidth || 210;
        const h = el.offsetHeight || 140;
        const { left: pl, right: pr, bottom: pb, top: pt } = panelBoundsRef.current;
        // X is a continuous, clamped function of the cursor X: as the cursor
        // sweeps panel-left → panel-right, the tooltip glides left-aligned →
        // right-aligned *inside* the panel (never past its borders). Because it
        // travels slower than the cursor, the cursor appears to slide across it.
        const minLeft = pl + margin;
        const maxLeft = pr - margin - w;
        let tx: number;
        if (maxLeft <= minLeft) {
          tx = (pl + pr) / 2 - w / 2;            // panel narrower than tooltip → center
        } else {
          const t = Math.max(0, Math.min(1, (cursorRef.current.x - pl) / (pr - pl)));
          tx = minLeft + t * (maxLeft - minLeft);
        }
        // Y is anchored to the active row's edges so the cursor (which sits
        // inside the row) always keeps a real gap from the tooltip once it
        // settles. It sits a gap *below the row's bottom* by default, and only
        // flips to a gap *above the row's top* when its actual height would
        // crowd the panel bottom — so a short tooltip can stay below even on the
        // lower rows, while a tall one flips earlier.
        const { top: rowTop, bottom: rowBottom } = rowRef.current;
        const fitsBelow = rowBottom + gap + h <= pb - margin;
        const fitsAbove = rowTop - gap - h >= pt + margin;
        const ty = (!fitsBelow && fitsAbove) ? rowTop - h - gap : rowBottom + gap;
        if (fresh.current) {
          pos.current.x = tx; pos.current.y = ty;
          fresh.current = false;
          el.style.opacity = "0";
          requestAnimationFrame(() => { if (ref.current) ref.current.style.opacity = "1"; });
        } else {
          // Exponential ease toward the target — low factor = slow, gliding,
          // never dashy (especially the vertical step when rows change).
          const ease = 0.1;
          pos.current.x += (tx - pos.current.x) * ease;
          pos.current.y += (ty - pos.current.y) * ease;
        }
        el.style.transform = `translate3d(${Math.round(pos.current.x)}px, ${Math.round(pos.current.y)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item, cursorRef, rowRef, panelBoundsRef]);

  if (!item) return null;

  return (
    <div ref={ref} className="fixed top-0 left-0 z-[100] bg-white border border-border rounded-xl shadow-2xl p-3.5 min-w-[200px] pointer-events-none"
      style={{ opacity: 0, transition: "opacity 0.3s ease", willChange: "transform" }}>
      <p className="text-sm font-bold flex items-center gap-1.5 mb-2">{item.icon || item.flag || ""} {item.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs gap-6">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400" />Visitors</span>
          <span className="font-bold">{fmt(item.visitors)}</span>
        </div>
        {isExitLink ? (
          <div className="flex justify-between text-xs gap-6">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" />Exits</span>
            <span className="font-bold text-red-500">{item.exits}</span>
          </div>
        ) : (
          <div className="flex justify-between text-xs gap-6">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" />{isKeyword ? "Revenue (est.)" : "Revenue"}</span>
            <span className="font-bold text-accent">${item.revenue.toLocaleString()}</span>
          </div>
        )}
      </div>
      {isKeyword && item.position && (
        <div className="border-t border-border mt-2 pt-2 space-y-0.5">
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Position</span><span>{(item.position === "1st" || item.position === "2nd") ? "🏆" : "🏅"} {item.position}</span></div>
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Impressions</span><span>{item.impressions?.toLocaleString()}</span></div>
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>CTR</span><span>{item.ctr}</span></div>
        </div>
      )}
      {!isKeyword && !isExitLink && item.rpv && (
        <div className="border-t border-border mt-2 pt-1.5 space-y-0.5">
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Revenue/visitor</span><span>{item.rpv}</span></div>
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Conversion rate</span><span>{item.conv}</span></div>
        </div>
      )}
    </div>
  );
}

// ---- data row --------------------------------------------------------------

function DataRow({ item, maxVal, sort, type, onFilter, isGeo, isKeyword, isExitLink, selected, dimmed, onClick, onHoverItem, rowIdx }: {
  item: any; maxVal: number; sort: SortMode; type: FilterType; onFilter: (f: ActiveFilter) => void;
  isGeo?: boolean; isKeyword?: boolean; isExitLink?: boolean; selected?: boolean; dimmed?: boolean; onClick?: () => void;
  onHoverItem?: (item: any | null, idx?: number, enterX?: number, panelRect?: DOMRect, rowBounds?: { top: number; bottom: number }) => void; rowIdx?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const pctV = Math.min((item.visitors / maxVal) * 70, 70);
  const showGoTo = isLinkType(type) || isExitLink;

  // For exit link, show exits instead of revenue
  const displayValue = () => {
    if (isExitLink && sort === "revenue") {
      return <span className="text-red-500 font-semibold">{item.exits}</span>;
    }
    if (sort === "revenue") {
      return <span className={item.revenue > 0 ? "text-accent font-semibold" : "text-muted-foreground"}>${item.revenue.toLocaleString()}</span>;
    }
    return <span>{fmt(item.visitors)}</span>;
  };

  return (
    <div className="relative"
      onMouseEnter={(e) => {
        setHovered(true);
        const rowEl = e.currentTarget as HTMLElement;
        const panel = rowEl.closest("[data-panel]");
        const rect = panel?.getBoundingClientRect();
        // Anchor Y to this row's edges (not the cursor Y) — the tooltip sits a
        // gap below/above the whole row, so the cursor (which lives inside the
        // row) always keeps clearance from it once it settles.
        const rowRect = rowEl.getBoundingClientRect();
        onHoverItem?.(item, rowIdx, e.clientX, rect as DOMRect, { top: rowRect.top, bottom: rowRect.bottom });
      }}
      onMouseLeave={() => { setHovered(false); }}>
      <div onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 transition-colors cursor-pointer border-b border-border last:border-0 group ${
          selected ? "bg-accent-light/60" : dimmed ? "opacity-40 hover:opacity-70" : "hover:bg-blue-50/40"
        }`}>
        {isGeo ? (
          <span className={`w-6 text-[10px] font-bold uppercase shrink-0 ${selected ? "text-accent" : "text-muted-foreground"}`}>{item.code}</span>
        ) : (
          <span className="w-5 text-center text-xs shrink-0">{item.icon}</span>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="relative h-[22px] flex items-center overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-blue-400/12 rounded-sm transition-all" style={{ width: `${pctV}%` }} />
            <span className="relative z-10 text-sm pl-2 group-hover:text-accent transition-colors truncate">{item.name}</span>
          </div>
        </div>
        <span className="text-sm w-14 text-right shrink-0 tabular-nums">{displayValue()}</span>
        <div className={`flex items-center gap-0 shrink-0 transition-opacity duration-100 ${hovered && !dimmed ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {showGoTo && (
            <button onClick={(e) => { e.stopPropagation(); window.open(`https://${item.name}`, "_blank"); }}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Go to site">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onFilter({ type, value: item.name, icon: isGeo ? item.code : item.icon }); }}
            className="p-1.5 rounded-md hover:bg-accent-light text-muted-foreground hover:text-accent" title="Filter by this">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- SVG donut with labels -------------------------------------------------

function DonutWithLabels({ data, sort }: { data: typeof channelData; sort: SortMode }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const sorted = sort === "revenue" ? [...data].sort((a, b) => b.revenue - a.revenue) : data;
  const blueColors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff", "#f0f0f0"];
  const orangeColors = ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5", "#fff7ed", "#fafafa"];
  const colors = sort === "revenue" ? orangeColors : blueColors;

  const total = sorted.reduce((s, d) => s + (sort === "revenue" ? d.revenue : d.visitors), 0);
  const cx = 160, cy = 140, innerR = 58, outerR = 95;
  const RADIAN = Math.PI / 180;

  let cumAngle = -90;
  const arcs = sorted.map((d, i) => {
    const val = sort === "revenue" ? d.revenue : d.visitors;
    const angle = total > 0 ? (val / total) * 360 : 0;
    const startAngle = cumAngle;
    cumAngle += angle;
    const midAngle = startAngle + angle / 2;

    const hovered = activeIdx === i;
    const ir = hovered ? innerR - 3 : innerR;
    const or = hovered ? outerR + 6 : outerR;

    const startRad = startAngle * RADIAN;
    const endRad = (startAngle + angle) * RADIAN;
    const largeArc = angle > 180 ? 1 : 0;

    const x1o = cx + or * Math.cos(startRad);
    const y1o = cy + or * Math.sin(startRad);
    const x2o = cx + or * Math.cos(endRad);
    const y2o = cy + or * Math.sin(endRad);
    const x1i = cx + ir * Math.cos(endRad);
    const y1i = cy + ir * Math.sin(endRad);
    const x2i = cx + ir * Math.cos(startRad);
    const y2i = cy + ir * Math.sin(startRad);

    const path = `M ${x1o} ${y1o} A ${or} ${or} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${ir} ${ir} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;

    const labelR = or + 18;
    const elbowR = or + 6;
    const midRad = midAngle * RADIAN;
    const elbowX = cx + elbowR * Math.cos(midRad);
    const elbowY = cy + elbowR * Math.sin(midRad);
    const labelX = cx + labelR * Math.cos(midRad);
    const labelY = cy + labelR * Math.sin(midRad);
    const textAnchor: "start" | "end" = labelX > cx ? "start" : "end";
    const lineEndX = labelX + (labelX > cx ? -4 : 4);

    return { path, color: colors[i] || "#e5e5e5", midAngle, labelX, labelY, elbowX, elbowY, textAnchor, lineEndX, d, i, angle };
  });

  return (
    <div className="relative py-4 flex items-center justify-center">
      <svg width={320} height={280} className="overflow-visible">
        {arcs.map(a => (
          <path key={a.i} d={a.path} fill={a.color} stroke="white" strokeWidth={2}
            className="transition-all duration-150 cursor-pointer"
            style={{ filter: activeIdx !== null && activeIdx !== a.i ? "opacity(0.5)" : "none" }}
            onMouseEnter={() => setActiveIdx(a.i)}
            onMouseLeave={() => setActiveIdx(null)} />
        ))}
        {arcs.filter(a => a.angle > 15).map(a => (
          <g key={`label-${a.i}`} style={{ pointerEvents: "none" }}>
            <line x1={a.elbowX} y1={a.elbowY} x2={a.lineEndX} y2={a.labelY} stroke="#d4d4d4" strokeWidth={1} />
            <text x={a.labelX} y={a.labelY} textAnchor={a.textAnchor} dominantBaseline="central" fontSize={11} fill="#737373" className="select-none">
              {a.d.name}
            </text>
          </g>
        ))}
      </svg>
      {activeIdx !== null && (
        <div className="absolute top-2 right-2 z-30 bg-white border border-border rounded-xl shadow-xl p-3 min-w-[190px] pointer-events-none">
          <p className="text-sm font-bold mb-2">{sorted[activeIdx].name}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400" />Visitors</span><span className="font-bold">{fmt(sorted[activeIdx].visitors)}</span></div>
            <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" />Revenue</span><span className="font-bold text-accent">${sorted[activeIdx].revenue.toLocaleString()}</span></div>
          </div>
          {sorted[activeIdx].sources.length > 0 && (
            <div className="border-t border-border mt-2 pt-1.5">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Top sources</p>
              {sorted[activeIdx].sources.map((s: any) => (
                <div key={s.n} className="flex justify-between text-[10px]"><span>{s.n}</span><span className="text-muted-foreground">{s.p}%</span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- panel header ----------------------------------------------------------

function PanelHeader({ tabs, active, onTab, sort, onSort, onExpand, label, onLabelClick, labelOpen, labelDropdown }: {
  tabs: string[]; active: string; onTab: (t: string) => void; sort: SortMode; onSort: () => void; onExpand: () => void;
  label?: string; onLabelClick?: () => void; labelOpen?: boolean; labelDropdown?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <div className="flex items-center gap-0.5">
        {tabs.map(t => (
          <button key={t} onClick={() => onTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {label && (
          <div className="relative">
            <button onClick={onLabelClick}
              className="text-xs text-muted-foreground px-2 py-1 rounded-md border border-border hover:bg-muted flex items-center gap-1">
              {label} <ChevronDown className="w-3 h-3" />
            </button>
            {labelOpen && labelDropdown}
          </div>
        )}
        <button onClick={onSort}
          className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${sort === "revenue" ? "border-accent text-accent bg-accent-light" : "border-border text-muted-foreground hover:text-foreground"}`}>
          {sort === "revenue" ? "Revenue ↕" : "Visitors ↕"}
        </button>
        <button onClick={onExpand} className="p-1 rounded hover:bg-muted text-muted-foreground">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---- detail modal (generic) ------------------------------------------------

function DetailModal({ title, onClose, search, onSearch, children }: {
  title: string; onClose: () => void; search: string; onSearch: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <h3 className="font-bold">{title}</h3>
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-[1fr_80px_80px] px-5 py-2 border-b border-border text-xs text-muted-foreground font-medium">
          <span>{title}</span><span className="text-right">Visitors</span><span className="text-right">Revenue</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ---- keyword detail modal (Google Search Console style) --------------------

function KeywordDetailModal({ onClose, search, onSearch }: { onClose: () => void; search: string; onSearch: (v: string) => void }) {
  const filtered = keywordData.filter(k => k.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold">Google Search Console</h3>
          </div>
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search terms..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-[1fr_70px_90px_70px_60px_90px] px-5 py-2 border-b border-border text-xs text-muted-foreground font-medium">
          <span>Search Term</span><span className="text-right">Position</span><span className="text-right">Impressions</span>
          <span className="text-right">Visitors</span><span className="text-right">CTR</span><span className="text-right">Revenue (est.)</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map(k => (
            <div key={k.name} className="grid grid-cols-[1fr_70px_90px_70px_60px_90px] px-5 py-3 border-b border-border last:border-0 hover:bg-blue-50/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-xs">{k.icon}</span>
                <span className="text-sm font-medium">{k.name}</span>
              </div>
              <div className="flex items-center justify-end gap-1 text-sm">
                {(k.position === "1st" || k.position === "2nd") && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                <span className="font-medium">{k.position}</span>
              </div>
              <span className="text-sm text-right">{k.impressions.toLocaleString()}</span>
              <span className="text-sm text-right">{fmt(k.visitors)}</span>
              <span className="text-sm text-right">{k.ctr}</span>
              <span className={`text-sm text-right font-semibold ${k.revenue > 0 ? "text-accent" : "text-muted-foreground"}`}>${k.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- exit link detail modal ------------------------------------------------

function ExitLinkDetailModal({ onClose, search, onSearch }: { onClose: () => void; search: string; onSearch: (v: string) => void }) {
  const filtered = exitLinkData.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <h3 className="font-bold">Exit Links</h3>
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-[1fr_80px_80px] px-5 py-2 border-b border-border text-xs text-muted-foreground font-medium">
          <span>Exit Link</span><span className="text-right">Visitors</span><span className="text-right">Exits</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map(e => (
            <div key={e.name} className="grid grid-cols-[1fr_80px_80px] px-5 py-3 border-b border-border last:border-0 hover:bg-accent-light/30 cursor-pointer">
              <div className="flex items-center gap-2"><span className="text-xs">{e.icon}</span><span className="text-sm font-medium">{e.name}</span></div>
              <span className="text-sm text-right">{fmt(e.visitors)}</span>
              <span className="text-sm text-right font-semibold text-red-500">{e.exits}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalRow({ icon, label, visitors, revenue }: { icon: string; label: string; visitors: number; revenue: number }) {
  return (
    <div className="grid grid-cols-[1fr_80px_80px] px-5 py-3 border-b border-border last:border-0 hover:bg-accent-light/30 cursor-pointer">
      <div className="flex items-center gap-2"><span className="text-xs">{icon}</span><span className="text-sm font-medium">{label}</span></div>
      <span className="text-sm text-right">{fmt(visitors)}</span>
      <span className={`text-sm text-right font-semibold ${revenue > 0 ? "text-accent" : "text-muted-foreground"}`}>${revenue.toLocaleString()}</span>
    </div>
  );
}

// ---- funnel step -----------------------------------------------------------

function FunnelStep({ label, count, pct, dropoff }: { label: string; count: number; pct: number; dropoff?: string }) {
  return (
    <div className="group">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium group-hover:text-accent">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">{count.toLocaleString()}</span>
          {dropoff && <span className="text-xs text-error w-10 text-right">{dropoff}</span>}
        </div>
      </div>
      <div className="w-full h-3 bg-muted rounded-md overflow-hidden cursor-pointer">
        <div className="h-full bg-accent/70 rounded-md hover:bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AnalyticsPage() {
  // -- top-level state -------------------------------------------------------
  const [period, setPeriod] = useState("last30d");
  const [am, setAm] = useState<MetricKey>("revenue");
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [periodOffset, setPeriodOffset] = useState(0);
  const [granularity, setGranularity] = useState("Daily");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [granularityOpen, setGranularityOpen] = useState(false);

  // -- computed date range label + granularity options -----------------------
  const dateRangeLabel = (() => {
    const today = new Date();
    const periodDays: Record<string, number> = { today: 0, yesterday: 1, last24h: 1, last7d: 7, last30d: 30, "24h": 1, "7d": 7, "30d": 30, "90d": 90, wtd: 7, mtd: 30 };
    const days = periodDays[period] ?? 30;
    const end = new Date(today);
    end.setDate(end.getDate() - periodOffset * days);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    if (period === "today") return "Today";
    if (period === "yesterday") return "Yesterday";
    const fmt = (d: Date) => `${d.toLocaleString("en", { month: "short" })} ${d.getDate()}`;
    return `${fmt(start)} → ${fmt(end)}`;
  })();

  const granularityOptions = (() => {
    if (period === "today" || period === "last24h" || period === "24h") return ["Hourly"];
    if (period === "last7d" || period === "7d" || period === "wtd") return ["Daily"];
    return ["Daily", "Weekly"];
  })();

  // -- panel tab state -------------------------------------------------------
  const [rT, setRT] = useState("Channel"); // Sources
  const [gT, setGT] = useState("Country"); // Geo
  const [pT, setPT] = useState("Page");    // Pages: Hostname | Page | Entry page | Exit link
  const [tT, setTT] = useState("Browser"); // Tech

  // -- panel sort state ------------------------------------------------------
  const [rS, setRS] = useState<SortMode>("visitors");
  const [gS, setGS] = useState<SortMode>("visitors");
  const [pS, setPS] = useState<SortMode>("visitors");
  const [tS, setTS] = useState<SortMode>("visitors");

  // -- channel dropdown + filter state ---------------------------------------
  const [cDD, setCDD] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // -- campaign filter dropdown state ----------------------------------------
  const [campDD, setCampDD] = useState(false);
  const [selectedCampFilter, setSelectedCampFilter] = useState<string>("All");

  // -- modal state -----------------------------------------------------------
  const [modal, setModal] = useState<string | null>(null);
  const [mS, setMS] = useState("");

  // -- geo drill-down state --------------------------------------------------
  const [selCountry, setSelCountry] = useState<string | null>(null);
  const [selRegion, setSelRegion] = useState<string | null>(null);

  // bottom panel is now a separate component (BottomPanel)

  // -- shared tooltip state --------------------------------------------------
  // The live cursor lives in a ref so moving the mouse never re-renders the
  // page — the tooltip reads it each animation frame and eases toward it.
  const cursorRef = useRef({ x: 0, y: 0 });
  const rowRef = useRef({ top: 0, bottom: 0 });                      // active row's top/bottom edges (vertical anchor)
  const panelBoundsRef = useRef({ left: 0, right: 0, top: 0, bottom: 0 }); // active panel's bounds (clamp + flip)
  const [tipItem, setTipItem] = useState<any>(null);
  const [tipKeyword, setTipKeyword] = useState(false);
  const [tipExitLink, setTipExitLink] = useState(false);

  const handlePanelMouseMove = useCallback((e: React.MouseEvent) => {
    cursorRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleRowHover = useCallback((it: any, idx?: number, enterX?: number, panelRect?: DOMRect, isKw?: boolean, isExit?: boolean, rowBounds?: { top: number; bottom: number }) => {
    setTipItem(it);
    setTipKeyword(!!isKw);
    setTipExitLink(!!isExit);
    if (it && idx != null) {
      if (enterX != null) cursorRef.current.x = enterX;
      if (rowBounds) rowRef.current = rowBounds;
      if (panelRect) panelBoundsRef.current = {
        left: panelRect.left, right: panelRect.right, top: panelRect.top, bottom: panelRect.bottom,
      };
    }
  }, []);

  // -- filter helpers --------------------------------------------------------
  const addF = useCallback((f: ActiveFilter) => setFilters(p => p.some(x => x.type === f.type && x.value === f.value) ? p : [...p, f]), []);
  const remF = useCallback((i: number) => setFilters(p => p.filter((_, idx) => idx !== i)), []);

  // -- geo data with drill-down ----------------------------------------------
  const geoD = () => {
    if (gT === "Map") return countryData;
    if (gT === "Region") return selCountry ? regionData.filter(r => r.country === selCountry) : regionData;
    if (gT === "City") {
      if (selRegion) return cityData.filter(c => c.region === selRegion);
      if (selCountry) return cityData.filter(c => c.country === selCountry);
      return cityData;
    }
    return countryData;
  };
  const handleGeoClick = (item: any) => {
    if (gT === "Country" || gT === "Map") {
      setSelCountry(prev => prev === item.name ? null : item.name);
      setSelRegion(null);
    } else if (gT === "Region") {
      setSelRegion(prev => prev === item.name ? null : item.name);
    }
  };
  const handleGeoTabChange = (t: string) => {
    setGT(t);
    if (t === "Country" || t === "Map") { setSelCountry(null); setSelRegion(null); }
    if (t === "Region") { setSelRegion(null); }
  };

  // -- tech data -------------------------------------------------------------
  const techD = () => tT === "OS" ? osData : tT === "Device" ? deviceData : browserData;
  const techType = (): FilterType => tT === "OS" ? "os" : tT === "Device" ? "device" : "browser";

  // -- pages data (separate per tab) -----------------------------------------
  const pagesD = (): any[] => {
    if (pT === "Hostname") return hostnameData;
    if (pT === "Entry page") return entryPageData;
    if (pT === "Exit link") return exitLinkData;
    return pageViewData; // "Page"
  };
  const pageType = (): FilterType => {
    if (pT === "Hostname") return "hostname";
    if (pT === "Entry page") return "entryPage";
    if (pT === "Exit link") return "exitLink";
    return "page";
  };

  // -- sources data ----------------------------------------------------------
  const channelDonutData = useMemo(() => {
    if (selectedChannel) {
      const ch = channelData.find(c => c.name === selectedChannel);
      if (ch && ch.sources.length > 0) {
        const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];
        return ch.sources.map((s, i) => ({
          name: s.n,
          visitors: Math.round(ch.visitors * s.p / 100),
          revenue: Math.round(ch.revenue * s.p / 100),
          color: colors[i] || "#bfdbfe",
          sources: [] as { n: string; p: number }[],
        }));
      }
      return [{ name: ch?.name || selectedChannel, visitors: ch?.visitors || 0, revenue: ch?.revenue || 0, color: "#3b82f6", sources: [] as { n: string; p: number }[] }];
    }
    return channelData;
  }, [selectedChannel]);

  const channelTotal = useMemo(() => {
    return channelDonutData.reduce((s, d) => s + d.visitors, 0);
  }, [channelDonutData]);

  const channelLabel = selectedChannel
    ? `${selectedChannel} (${fmt(channelTotal)})`
    : `All (${fmt(channelData.reduce((s, d) => s + d.visitors, 0))})`;

  // Campaign data filtered
  const filteredCampaignData = useMemo(() => {
    if (selectedCampFilter === "All") return campaignData;
    return campaignData.filter(c => c.name.startsWith(selectedCampFilter));
  }, [selectedCampFilter]);

  const refD = () => {
    if (rT === "Keyword") return keywordData;
    if (rT === "Campaign") return filteredCampaignData;
    return referrerData;
  };
  const refType = (): FilterType => rT === "Keyword" ? "keyword" : rT === "Campaign" ? "campaign" : "referrer";

  const geoType = (): FilterType => gT === "Region" ? "region" : gT === "City" ? "city" : "country";

  const m = METRICS[am];

  // -- GeoJSON for choropleth map ---------------------------------------------
  const [geoFeatures, setGeoFeatures] = useState<any[]>([]);
  useEffect(() => {
    fetch("/world.geojson").then(r => r.json()).then(d => setGeoFeatures(d.features || [])).catch(() => {});
  }, []);
  const iso2to3: Record<string, string> = { US: "USA", FR: "FRA", GB: "GBR", DE: "DEU", MA: "MAR", TR: "TUR", CA: "CAN", ES: "ESP", SG: "SGP", NL: "NLD", PL: "POL", BR: "BRA", ID: "IDN", JP: "JPN", AU: "AUS" };
  const mapData = useMemo(() => countryData.map(c => ({ id: iso2to3[c.code] || c.code, value: c.visitors })), []);

  // -- Nivo chart data -------------------------------------------------------
  const nivoChartData = useMemo(() => {
    if (am === "revenue") {
      return [{ id: "Visitors", color: "#60a5fa", data: dailyData.map(d => ({ x: d.date, y: d.visitors })) }];
    }
    const key = am === "rpv" ? "rpv" : am === "bounceRate" ? "bounceRate" : am === "sessionTime" ? "sessionTime" : am === "convRate" ? "convRate" : "visitors";
    return [{ id: m.label, color: m.color, data: dailyData.map(d => ({ x: d.date, y: (d as any)[key] })) }];
  }, [am, m.label, m.color]);

  // -- exit link sort: by "exits" when revenue sort is active ----------------
  const sortExitLinks = (d: any[], s: SortMode) => {
    if (s === "revenue") return [...d].sort((a: any, b: any) => (b.exits || 0) - (a.exits || 0));
    return [...d].sort((a, b) => b.visitors - a.visitors);
  };

  // -- helpers for modal data ------------------------------------------------
  const getModalData = () => {
    if (modal === "ref") {
      if (rT === "Channel") return srt(referrerData, rS);
      return srt(refD(), rS);
    }
    if (modal === "geo") return srt(geoD(), gS);
    if (modal === "page") {
      if (pT === "Exit link") return sortExitLinks(exitLinkData, pS);
      return srt(pagesD(), pS);
    }
    if (modal === "tech") return srt(techD(), tS);
    return [];
  };

  return (
    <div className="p-6 pb-20 max-w-[1400px] mx-auto">
      {/* ================================================================ */}
      {/* TOP BAR                                                          */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-medium">
            <Code2 className="w-4 h-4 text-muted-foreground" />app.neaven.io
          </div>

          {/* Period back arrow */}
          <button onClick={() => {
            const map: Record<string, string> = { "24h": "24h", "7d": "7d", "30d": "30d", "90d": "90d", today: "24h", yesterday: "24h", last24h: "24h", last7d: "7d", last30d: "30d", wtd: "7d", mtd: "30d" };
            setPeriodOffset(o => o + 1);
          }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date range picker */}
          <div className="relative">
            <button onClick={() => { setDatePickerOpen(!datePickerOpen); setGranularityOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm hover:bg-muted transition-colors">
              <span>{dateRangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {datePickerOpen && (
              <div className="absolute left-0 top-full mt-1 z-40 bg-white border border-border rounded-lg shadow-xl min-w-[200px] py-1">
                <div className="px-3 py-1.5 text-[10px] text-muted-foreground">Current time: {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase()}</div>
                {[
                  { id: "today", label: "Today", badge: "T" },
                  { id: "yesterday", label: "Yesterday", badge: "Y" },
                  { id: "last24h", label: "Last 24 hours", badge: "D" },
                  { id: "last7d", label: "Last 7 days", badge: "W" },
                  { id: "last30d", label: "Last 30 days", badge: "30" },
                  { id: "wtd", label: "Week to date", badge: "" },
                  { id: "mtd", label: "Month to date", badge: "" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setPeriod(opt.id); setDatePickerOpen(false); setPeriodOffset(0); setGranularity(opt.id === "today" || opt.id === "last24h" ? "Hourly" : "Daily"); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-muted transition-colors ${period === opt.id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    <span>{opt.label}</span>
                    {opt.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground">{opt.badge}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Period forward arrow */}
          <button onClick={() => setPeriodOffset(o => Math.max(0, o - 1))}
            className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${periodOffset === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Granularity picker */}
          <div className="relative">
            <button onClick={() => { setGranularityOpen(!granularityOpen); setDatePickerOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm hover:bg-muted transition-colors">
              <span>{granularity}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {granularityOpen && (
              <div className="absolute left-0 top-full mt-1 z-40 bg-white border border-border rounded-lg shadow-xl min-w-[120px] py-1">
                {granularityOptions.map(g => (
                  <button key={g} onClick={() => { setGranularity(g); setGranularityOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${granularity === g ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LiveDot /><span>Online <strong className="text-foreground">14</strong></span>
          </span>
          <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" />Export</Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* FILTER PILLS                                                     */}
      {/* ================================================================ */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filters.map((f, i) => <FilterPill key={`${f.type}-${f.value}`} f={f} onRemove={() => remF(i)} />)}
          <button onClick={() => setFilters([])} className="text-xs text-muted-foreground hover:text-error">Clear all</button>
        </div>
      )}

      {/* ================================================================ */}
      {/* KPI ROW + CHART                                                  */}
      {/* ================================================================ */}
      <div className="rounded-xl border border-border bg-white mb-5 overflow-hidden">
        <div className="flex divide-x divide-border border-b border-border">
          {(Object.keys(METRICS) as MetricKey[]).map(k => (
            <TopMetric key={k} k={k} active={am === k} onClick={() => setAm(k)} filterCount={filters.length} />
          ))}
          <div className="flex-1 min-w-[90px] px-3 py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Online</p>
            <div className="flex items-center gap-1.5"><p className="text-xl font-bold">14</p><LiveDot /></div>
          </div>
        </div>
        <div className="px-5 py-4">
          <ResponsiveContainer width="100%" height={400}>
            {am === "revenue" ? (
              <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="vG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip content={<ChartTip mk={am} />} cursor={{ stroke: "#60a5fa", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area yAxisId="l" type="monotone" dataKey="visitors" stroke="#60a5fa" strokeWidth={2} fill="url(#vG)" dot={false} activeDot={{ r: 5, fill: "#60a5fa", stroke: "#fff", strokeWidth: 2 }} />
                <Bar yAxisId="r" dataKey="revenue" fill="#f97316" opacity={0.65} radius={[3, 3, 0, 0]} barSize={10} />
              </ComposedChart>
            ) : (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={m.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={m.yFmt || undefined} />
                <Tooltip content={<ChartTip mk={am} />} cursor={{ stroke: m.color, strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey={am} stroke={m.color} strokeWidth={2} fill="url(#mG)" dot={false} activeDot={{ r: 5, fill: m.color, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2x2 GRID OF PANELS                                               */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5" onMouseMove={handlePanelMouseMove} onMouseLeave={() => setTipItem(null)}>

        {/* ---- SOURCES panel ---- */}
        <div data-panel onMouseLeave={() => setTipItem(null)} className="rounded-xl border border-border bg-white overflow-visible relative">
          <PanelHeader
            tabs={["Channel", "Referrer", "Campaign", "Keyword"]}
            active={rT}
            onTab={t => { setRT(t); setCDD(false); setCampDD(false); }}
            sort={rS}
            onSort={() => setRS(s => s === "visitors" ? "revenue" : "visitors")}
            onExpand={() => setModal("ref")}
            label={rT === "Channel" ? channelLabel : rT === "Campaign" ? `${selectedCampFilter === "All" ? "All" : selectedCampFilter} (${fmt(filteredCampaignData.reduce((s, d) => s + d.visitors, 0))})` : undefined}
            onLabelClick={() => {
              if (rT === "Channel") { setCDD(!cDD); setCampDD(false); }
              if (rT === "Campaign") { setCampDD(!campDD); setCDD(false); }
            }}
            labelOpen={rT === "Channel" ? cDD : rT === "Campaign" ? campDD : false}
            labelDropdown={
              rT === "Channel" ? (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-border rounded-lg shadow-xl min-w-[180px] py-1">
                  <button onClick={() => { setSelectedChannel(null); setCDD(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex justify-between ${selectedChannel === null ? "bg-muted font-semibold" : ""}`}>
                    <span>All</span>
                    <span className="text-muted-foreground">({fmt(channelData.reduce((s, d) => s + d.visitors, 0))})</span>
                  </button>
                  {channelData.map(d => (
                    <button key={d.name} onClick={() => { setSelectedChannel(d.name); setCDD(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex justify-between ${selectedChannel === d.name ? "bg-muted font-semibold" : ""}`}>
                      <span>{d.name}</span>
                      <span className="text-muted-foreground">({fmt(d.visitors)})</span>
                    </button>
                  ))}
                </div>
              ) : rT === "Campaign" ? (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-border rounded-lg shadow-xl min-w-[200px] py-1">
                  {campaignFilterOptions.map(d => (
                    <button key={d.name} onClick={() => { setSelectedCampFilter(d.name); setCampDD(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex justify-between ${selectedCampFilter === d.name ? "bg-muted font-semibold" : ""}`}>
                      <span className="font-mono">{d.name}</span>
                      <span className="text-muted-foreground">({fmt(d.count)})</span>
                    </button>
                  ))}
                </div>
              ) : undefined
            }
          />
          {rT === "Channel" ? (
            <>
              <DonutWithLabels data={channelDonutData} sort={rS} />
              <button onClick={() => setModal("ref")}
                className="w-full py-2 text-xs text-muted-foreground hover:text-accent flex items-center justify-center gap-1 border-t border-border">
                <Maximize2 className="w-3 h-3" /> DETAILS
              </button>
            </>
          ) : (
            <>
              {srt(refD(), rS).slice(0, 10).map((r, i) => (
                <DataRow key={r.name} item={r} rowIdx={i}
                  maxVal={Math.max(...refD().map(x => x.visitors))}
                  sort={rS} type={refType()} onFilter={addF}
                  isKeyword={rT === "Keyword"}
                  onHoverItem={(it, idx, ex, pr, ey) => handleRowHover(it, idx, ex, pr, rT === "Keyword", false, ey)} />
              ))}
              <button onClick={() => setModal("ref")}
                className="w-full py-2 text-xs text-muted-foreground hover:text-accent flex items-center justify-center gap-1">
                <Maximize2 className="w-3 h-3" /> DETAILS
              </button>
            </>
          )}
        </div>

        {/* ---- GEOGRAPHY panel ---- */}
        <div data-panel onMouseLeave={() => setTipItem(null)} className="rounded-xl border border-border bg-white overflow-visible relative">
          <PanelHeader
            tabs={["Map", "Country", "Region", "City"]}
            active={gT}
            onTab={handleGeoTabChange}
            sort={gS}
            onSort={() => setGS(s => s === "visitors" ? "revenue" : "visitors")}
            onExpand={() => setModal("geo")}
          />
          {gT === "Map" ? (
            <div className="h-[360px] relative overflow-hidden rounded-b-xl">
              {geoFeatures.length > 0 ? (
                <ResponsiveChoropleth
                  features={geoFeatures}
                  data={mapData}
                  domain={[0, Math.max(...countryData.map(c => c.visitors))]}
                  colors={["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb"]}
                  unknownColor="#f8fafc"
                  label="properties.name"
                  valueFormat=".0f"
                  projectionType="naturalEarth1"
                  projectionScale={145}
                  projectionTranslation={[0.5, 0.58]}
                  borderWidth={0.4}
                  borderColor="#d1d5db"
                  legends={[]}
                  tooltip={({ feature }: any) => {
                    const c = countryData.find(cd => iso2to3[cd.code] === feature.id);
                    if (!c && feature.data?.value === undefined) return null;
                    return (
                      <div className="bg-white border border-border rounded-lg shadow-xl p-3 min-w-[160px]">
                        <p className="text-sm font-bold mb-1">{feature.label || feature.properties?.name}</p>
                        <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400" />Visitors</span><span className="font-bold">{c ? c.visitors.toLocaleString() : feature.data?.value || 0}</span></div>
                        {c && c.revenue > 0 && <div className="flex justify-between text-xs mt-0.5"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" />Revenue</span><span className="font-bold text-accent">${c.revenue.toLocaleString()}</span></div>}
                        {c && <div className="mt-1.5 pt-1.5 border-t border-border space-y-0.5">
                          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Revenue/visitor</span><span>{c.rpv}</span></div>
                          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Conversion rate</span><span>{c.conv}</span></div>
                        </div>}
                      </div>
                    );
                  }}
                  onClick={(feature: any) => {
                    const c = countryData.find(cd => iso2to3[cd.code] === feature.id);
                    if (c) {
                      setSelCountry(c.name);
                      setSelRegion(null);
                      setGT("Country");
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Loading map...</div>
              )}
              {selCountry && (
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white border border-border shadow-sm text-xs flex items-center gap-1.5">
                  <span className="font-medium">{selCountry}</span>
                  <button onClick={() => { setSelCountry(null); }} className="text-muted-foreground hover:text-error"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          ) : (
            <>
              {gT !== "Country" && selCountry && (
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-surface border-b border-border text-xs">
                  <span className="text-muted-foreground">Showing {gT === "Region" ? "regions" : "cities"} in</span>
                  <span className="font-semibold text-accent">{selRegion || selCountry}</span>
                  <button onClick={() => {
                    if (gT === "City" && selRegion) { setSelRegion(null); setGT("Region"); }
                    else { setSelCountry(null); setSelRegion(null); setGT("Country"); }
                  }} className="ml-1 text-muted-foreground hover:text-error"><X className="w-3 h-3" /></button>
                </div>
              )}
              {srt(geoD(), gS).slice(0, 10).map((c, i) => {
                const isSelected = (gT === "Country" && selCountry === c.name) || (gT === "Region" && selRegion === c.name);
                const isDimmed = (gT === "Country" && selCountry !== null && selCountry !== c.name) || (gT === "Region" && selRegion !== null && selRegion !== c.name);
                return (
                  <DataRow key={c.name} item={c} rowIdx={i}
                    maxVal={Math.max(...geoD().map((x: any) => x.visitors))}
                    sort={gS} type={geoType()} onFilter={addF}
                    isGeo selected={isSelected} dimmed={isDimmed}
                    onClick={() => handleGeoClick(c)}
                    onHoverItem={(it, idx, ex, pr, ey) => handleRowHover(it, idx, ex, pr, false, false, ey)} />
                );
              })}
            </>
          )}
          <button onClick={() => setModal("geo")}
            className="w-full py-2 text-xs text-muted-foreground hover:text-accent flex items-center justify-center gap-1">
            <Maximize2 className="w-3 h-3" /> DETAILS
          </button>
        </div>

        {/* ---- PAGES panel ---- */}
        <div data-panel onMouseLeave={() => setTipItem(null)} className="rounded-xl border border-border bg-white overflow-visible relative">
          <PanelHeader
            tabs={["Hostname", "Page", "Entry page", "Exit link"]}
            active={pT}
            onTab={setPT}
            sort={pS}
            onSort={() => setPS(s => s === "visitors" ? "revenue" : "visitors")}
            onExpand={() => setModal("page")}
          />
          {(pT === "Exit link" ? sortExitLinks(exitLinkData, pS) : srt(pagesD(), pS)).slice(0, 10).map((p: any, i: number) => (
            <DataRow key={p.name} item={p} rowIdx={i}
              maxVal={Math.max(...pagesD().map((x: any) => x.visitors))}
              sort={pT === "Exit link" ? "visitors" : pS}
              type={pageType()} onFilter={addF}
              isExitLink={pT === "Exit link"}
              onHoverItem={(it, idx, ex, pr, ey) => handleRowHover(it, idx, ex, pr, false, pT === "Exit link", ey)} />
          ))}
          <button onClick={() => setModal("page")}
            className="w-full py-2 text-xs text-muted-foreground hover:text-accent flex items-center justify-center gap-1">
            <Maximize2 className="w-3 h-3" /> DETAILS
          </button>
        </div>

        {/* ---- TECHNOLOGY panel ---- */}
        <div data-panel onMouseLeave={() => setTipItem(null)} className="rounded-xl border border-border bg-white overflow-visible relative">
          <PanelHeader
            tabs={["Browser", "OS", "Device"]}
            active={tT}
            onTab={setTT}
            sort={tS}
            onSort={() => setTS(s => s === "visitors" ? "revenue" : "visitors")}
            onExpand={() => setModal("tech")}
          />
          {srt(techD(), tS).slice(0, 10).map((b, i) => (
            <DataRow key={b.name} item={b} rowIdx={i}
              maxVal={Math.max(...techD().map(x => x.visitors))}
              sort={tS} type={techType()} onFilter={addF}
              onHoverItem={(it, idx, ex, pr, ey) => handleRowHover(it, idx, ex, pr, false, false, ey)} />
          ))}
          <button onClick={() => setModal("tech")}
            className="w-full py-2 text-xs text-muted-foreground hover:text-accent flex items-center justify-center gap-1">
            <Maximize2 className="w-3 h-3" /> DETAILS
          </button>
        </div>

        {/* Shared floating tooltip */}
        <PanelTooltip item={tipItem} isKeyword={tipKeyword} isExitLink={tipExitLink} cursorRef={cursorRef} rowRef={rowRef} panelBoundsRef={panelBoundsRef} />
      </div>

      {/* ================================================================ */}
      {/* BOTTOM PANEL: Goal | Funnel | User | Journey                     */}
      {/* ================================================================ */}
      <BottomPanel />

      {/* ================================================================ */}
      {/* MODALS                                                           */}
      {/* ================================================================ */}

      {/* Keyword detail modal -- Google Search Console style */}
      {modal === "ref" && rT === "Keyword" && (
        <KeywordDetailModal onClose={() => { setModal(null); setMS(""); }} search={mS} onSearch={setMS} />
      )}

      {/* Exit link detail modal -- shows Exits column */}
      {modal === "page" && pT === "Exit link" && (
        <ExitLinkDetailModal onClose={() => { setModal(null); setMS(""); }} search={mS} onSearch={setMS} />
      )}

      {/* Generic detail modals */}
      {modal && !(modal === "ref" && rT === "Keyword") && !(modal === "page" && pT === "Exit link") && (
        <DetailModal
          title={modal === "ref" ? (rT === "Channel" ? "Referrer" : rT) : modal === "geo" ? gT : modal === "page" ? pT : tT}
          onClose={() => { setModal(null); setMS(""); }} search={mS} onSearch={setMS}>
          {getModalData()
            .filter((d: any) => d.name.toLowerCase().includes(mS.toLowerCase()))
            .map((d: any) => (
              <ModalRow key={d.name} icon={d.code || d.flag || d.icon || "📄"} label={d.name}
                visitors={d.visitors} revenue={d.revenue} />
            ))}
        </DetailModal>
      )}
    </div>
  );
}
