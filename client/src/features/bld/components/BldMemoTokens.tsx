export function BldMemoTokens({
  title,
  memo,
  buffer,
}: {
  title: string;
  memo: string[];
  buffer: string;
}) {
  return (
    <section className="col-span-12 lg:col-span-6">
      <div className="rounded-card bg-surface bg-surface-2 h-full">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-tight mb-0">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
              Buffer {buffer}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-4">
            {memo.length ? (
              memo.map((pair, index) => (
                <span
                  key={`${pair}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-2 text-ink font-mono"
                >
                  {pair}
                </span>
              ))
            ) : (
              <span className="text-muted">Solved</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
