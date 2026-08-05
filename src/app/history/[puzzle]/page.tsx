import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function medalFor(position: number): string {
  if (position === 0) return "🥇";
  if (position === 1) return "🥈";
  if (position === 2) return "🥉";
  return `${position + 1}.`;
}

export default async function PuzzleHistoryPage({
  params,
}: PageProps<"/history/[puzzle]">) {
  const { puzzle } = await params;
  const puzzleNumber = parseInt(puzzle, 10);

  const { data: rows } = await supabase
    .from("scores")
    .select("player_name, total_score, total_max, puzzle_date")
    .eq("puzzle_number", puzzleNumber)
    .order("total_score", { ascending: false });

  if (!rows || rows.length === 0) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-gray-600">Fant ingen resultater for runde #{puzzleNumber}.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Runde #{puzzleNumber}</h1>
        <p className="text-sm text-gray-500">{rows[0].puzzle_date}</p>
      </div>
      <ol className="space-y-2">
        {rows.map((row, i) => (
          <li
            key={row.player_name}
            className="flex items-center justify-between rounded border px-3 py-2"
          >
            <span>
              <span className="inline-block w-7">{medalFor(i)}</span>
              {row.player_name}
            </span>
            <span className="font-medium">
              {row.total_score}/{row.total_max}
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}
