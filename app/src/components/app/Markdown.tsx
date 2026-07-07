import { Fragment, type ReactNode } from "react";

/* ---------------------------------------------------------------------------
   Markdown → design-system components. Agents speak markdown; founders should
   never see the syntax. Covers what our agents actually emit: paragraphs,
   emphasis, inline/blocked code, lists, headings, tables, links, rules.
--------------------------------------------------------------------------- */

// --- inline: `code`, **bold**, *italic*, [text](url) ---
function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("`")) {
      out.push(
        <code
          key={key}
          className="rounded bg-surface border border-border px-1 py-px font-mono text-[0.85em] text-foreground"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold">
          {renderInline(tok.slice(2, -2), key)}
        </strong>,
      );
    } else if (tok.startsWith("*")) {
      out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    } else {
      const link = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (link) {
        out.push(
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
          >
            {link[1]}
          </a>,
        );
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// --- block-level parsing ---
type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; depth: number; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; lang: string; body: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "quote"; text: string }
  | { kind: "hr" };

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ kind: "code", lang: fence[1] ?? "", body: body.join("\n") });
      continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      blocks.push({ kind: "h", depth: h[1].length, text: h[2] });
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    // table: header row + separator row
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) &&
      lines[i + 1].includes("-")
    ) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    // lists — items may be separated by blank lines; continuation lines are
    // absorbed into the current item so multi-sentence items stay together
    const collectList = (marker: RegExp): string[] => {
      const items: string[] = [];
      while (i < lines.length) {
        if (marker.test(lines[i])) {
          items.push(lines[i].replace(marker, ""));
          i++;
        } else if (
          lines[i].trim() &&
          items.length &&
          !/^(#{1,4}\s|```|\s*>|-{3,}\s*$)/.test(lines[i]) &&
          !/^\s*([-*]|\d+[.)])\s+/.test(lines[i]) &&
          !lines[i].includes("|")
        ) {
          // continuation of the previous item
          items[items.length - 1] += " " + lines[i].trim();
          i++;
        } else if (!lines[i].trim()) {
          // blank line — list continues only if another item follows
          let j = i;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && marker.test(lines[j])) {
            i = j;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      return items;
    };

    if (/^\s*[-*]\s+/.test(line)) {
      blocks.push({ kind: "ul", items: collectList(/^\s*[-*]\s+/) });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      blocks.push({ kind: "ol", items: collectList(/^\s*\d+[.)]\s+/) });
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "quote", text: quoted.join(" ") });
      continue;
    }

    // paragraph — absorb consecutive plain lines
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|```|\s*[-*]\s|\s*\d+[.)]\s|\s*>|-{3,}\s*$)/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /-/.test(lines[i + 1]) && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", text: para.join(" ") });
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-3 text-[14.5px] leading-[1.65] text-foreground">
      {blocks.map((b, idx) => {
        const key = `b${idx}`;
        switch (b.kind) {
          case "h": {
            const cls =
              b.depth <= 2
                ? "text-[15.5px] font-semibold tracking-[-0.01em] mt-1"
                : "text-[14px] font-semibold";
            return (
              <p key={key} className={cls}>
                {renderInline(b.text, key)}
              </p>
            );
          }
          case "p":
            return <p key={key}>{renderInline(b.text, key)}</p>;
          case "ul":
            return (
              <ul key={key} className="space-y-1.5 pl-1">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-border-strong" />
                    <span className="min-w-0">{renderInline(item, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="space-y-1.5 pl-1">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="w-[18px] shrink-0 text-right font-mono text-[12px] leading-[1.9] text-muted-foreground">
                      {j + 1}.
                    </span>
                    <span className="min-w-0">{renderInline(item, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <div
                key={key}
                className="overflow-hidden rounded-lg border border-border bg-surface"
              >
                {b.lang && (
                  <div className="border-b border-border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {b.lang}
                  </div>
                )}
                <pre className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed text-foreground">
                  {b.body}
                </pre>
              </div>
            );
          case "table":
            return (
              <div
                key={key}
                className="overflow-x-auto rounded-lg border border-border"
              >
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-surface">
                      {b.header.map((cell, j) => (
                        <th
                          key={j}
                          className="border-b border-border px-3.5 py-2 text-left font-medium text-secondary-foreground"
                        >
                          {renderInline(cell, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r} className={r % 2 ? "bg-surface/50" : ""}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className="border-b border-border/60 px-3.5 py-2 align-top last:border-b-0"
                          >
                            {renderInline(cell, `${key}-${r}-${c}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-2 border-accent/50 pl-3.5 text-secondary-foreground"
              >
                {renderInline(b.text, key)}
              </blockquote>
            );
          case "hr":
            return <hr key={key} className="border-border" />;
          default:
            return <Fragment key={key} />;
        }
      })}
    </div>
  );
}
