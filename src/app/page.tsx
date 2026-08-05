import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function medalFor(position: number): string {
  if (position === 0) return "🥇";
  if (position === 1) return "🥈";
  if (position === 2) return "🥉";
  return `${position + 1}.`;
}

export default async function HomePage() {
  const { data: latestRow } = await supabase
    .from("scores")
    .select("puzzle_number, puzzle_date")
    .order("puzzle_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRow) {
    return (
      <main className="mx-auto max-w-md p-4 space-y-4">
        <h1 className="text-xl font-semibold">Ingen resultater ennå</h1>
        <p className="text-gray-600">
          Vær den første til å legge inn dagens WhenTaken-resultat.
        </p>
        <Link
          href="/add"
          className="inline-block rounded bg-black text-white px-4 py-2 font-medium"
        >
          Legg til resultat
        </Link>
      </main>
    );
  }

  const { data: rows } = await supabase
    .from("scores")
    .select("player_name, total_score, total_max")
    .eq("puzzle_number", latestRow.puzzle_number)
    .order("total_score", { ascending: false });

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          Dagens resultat — runde #{latestRow.puzzle_number}
        </h1>
        <p className="text-sm text-gray-500">{latestRow.puzzle_date}</p>
      </div>
      <ol className="space-y-2">
        {(rows ?? []).map((row, i) => (
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
      <Link
        href="/add"
        className="inline-block rounded bg-black text-white px-4 py-2 font-medium"
      >
        Legg til ditt resultat
      </Link>
    </main>
  );
}
