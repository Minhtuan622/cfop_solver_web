import { readFile, writeFile } from "node:fs/promises";

const path = "/home/ubuntu/cfop_solver_web/client/src/pages/TimerLab.tsx";
const source = await readFile(path, "utf8");
const startMarker = '      <section className="col-12"><div className="card"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div className="d-flex';
const endMarker = '    </section>\n\n    <Dialog open={timerSettingsOpen}';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0 || end <= start) throw new Error("Timer history section markers not found");
const replacement = `      <section className="col-12"><div className="card"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h5 mb-0">{vi ? "Solve gần nhất" : "Recent solves"}</h2><small className="text-body-secondary">{vi ? "Chỉnh sửa, export và quản lý lịch sử nằm trong History." : "Edit, export, and full history management live in History."}</small></div><Link href="/history" className="btn btn-outline-secondary btn-sm">{vi ? "Mở History" : "Open History"}</Link></div><div className="card-body">{entries.length ? <div className="list-group list-group-flush">{entries.slice(0, 5).map((item) => <RecentTimerSolve key={item.id} item={item} vi={vi} />)}</div> : <div className="alert alert-info mb-0">{copy.empty}</div>}</div></div></section>
`;
const next = source.slice(0, start) + replacement + source.slice(end);
if (!next.includes("function RecentTimerSolve")) {
  const insertAt = next.indexOf("function Metric(");
  if (insertAt < 0) throw new Error("Timer helper insertion point not found");
  const helper = 'function RecentTimerSolve({ item, vi }: { item: SolveHistoryEntry; vi: boolean }) { return <article className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-3"><div><strong className={item.penalty === "DNF" ? "text-danger" : ""}>{formatSolveResult(item)}</strong><small className="d-block text-body-secondary">{new Date(item.createdAt).toLocaleString(vi ? "vi-VN" : "en-US")}{item.tags.length ? ` · ${item.tags.join(", ")}` : ""}</small></div><span className="font-monospace small text-break flex-grow-1">{item.input}</span></article>; }\n';
  await writeFile(path, next.slice(0, insertAt) + helper + next.slice(insertAt));
} else await writeFile(path, next);
