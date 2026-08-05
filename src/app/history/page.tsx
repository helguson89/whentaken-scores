import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { data: rows } = await supabase
    .from("scores")
    .select("puzzle_number, puzzle_date")
    .order("puzzle_number", { ascending: false });

  const puzzles = new Map<number, string>();
  for (const row of rows ?? []) {
    if (!puzzles.has(row.puzzle_number)) {
      puzzles.set(row.puzzle_number, row.puzzle_date);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <h1 className="text-xl font-semibold">Tidligere runder</h1>
      {puzzles.size === 0 && <p className="text-gray-600">Ingen resultater ennå.</p>}
      <ul className="space-y-2">
        {[...puzzles.entries()].map(([puzzleNumber, date]) => (
          <li key={puzzleNumber}>
            <Link
              href={`/history/${puzzleNumber}`}
              className="flex justify-between rounded border px-3 py-2 hover:bg-gray-50"
            >
              <span>Runde #{puzzleNumber}</span>
              <span className="text-gray-500">{date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
