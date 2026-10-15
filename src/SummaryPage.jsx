import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { AudioWave, Atmosphere, PapiLogo } from './AudioAtmosphere';

const EMPTY_SUMMARY = {
  day_1_check_ins: 0,
  day_2_check_ins: 0,
  combined_unique_participants: 0,
  total_check_ins: 0,
};

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value ?? 0);
}

function SummaryPage() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: summaryError } = await supabase.rpc('get_event_summary');
    if (summaryError || !data?.[0]) {
      setError('Ringkasan belum dapat dimuat. Silakan coba lagi.');
    } else {
      setSummary(data[0]);
      setUpdatedAt(new Date());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const returningVisitors = Math.max(
    0,
    summary.total_check_ins - summary.combined_unique_participants,
  );

  return (
    <Atmosphere>
      <main className="w-full max-w-4xl fade-in-up relative px-1 py-7">
        <header className="text-center mb-8">
          <PapiLogo size="lg" />
          <AudioWave className="mt-1" bars={11} height="h-4" />
          <p className="mt-7 text-[11px] uppercase tracking-[0.28em] text-[#ff4d4d] font-bold">
            Event Summary
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            PAPI 2026 at a glance
          </h1>
          <p className="mt-3 text-sm text-white/45">
            Ringkasan kehadiran Portable Audio Party Indonesia
          </p>
        </header>

        <section className="bg-gradient-to-br from-[#e10600]/25 via-[#131316]/95 to-[#131316]/95 border border-[#e10600]/30 rounded-3xl px-7 py-8 sm:px-10 text-center shadow-2xl glow-soft">
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">Peserta unik gabungan</p>
          <p className="mt-3 text-6xl sm:text-7xl font-extrabold text-white glow-text tabular-nums">
            {loading ? '—' : formatNumber(summary.combined_unique_participants)}
          </p>
          <p className="mt-4 text-sm text-white/55">
            Total individu yang tercatat hadir selama PAPI 2026
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4 mt-4">
          <SummaryCard
            day="DAY 1"
            date="10 OCTOBER 2026"
            value={loading ? '—' : formatNumber(summary.day_1_check_ins)}
            accent="from-[#e10600] to-[#ff4d4d]"
          />
          <SummaryCard
            day="DAY 2"
            date="11 OCTOBER 2026"
            value={loading ? '—' : formatNumber(summary.day_2_check_ins)}
            accent="from-[#4d0b0b] to-[#e10600]"
          />
        </section>

        <section className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="bg-[#131316]/90 border border-white/10 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Total check-in</p>
            <p className="mt-2 text-3xl font-bold text-white tabular-nums">
              {loading ? '—' : formatNumber(summary.total_check_ins)}
            </p>
            <p className="mt-1 text-xs text-white/40">Akumulasi kehadiran dua hari</p>
          </div>
          <div className="bg-[#131316]/90 border border-white/10 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Kunjungan kembali</p>
            <p className="mt-2 text-3xl font-bold text-[#ff4d4d] tabular-nums">
              {loading ? '—' : formatNumber(returningVisitors)}
            </p>
            <p className="mt-1 text-xs text-white/40">Peserta yang hadir lebih dari satu hari</p>
          </div>
        </section>

        <footer className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <p className="text-xs text-white/35">
            {updatedAt
              ? `Diperbarui ${updatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
              : 'Memuat data terbaru...'}
          </p>
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-white/60 hover:text-white hover:border-white/30 transition disabled:opacity-50"
          >
            {loading ? 'Memuat...' : 'Perbarui data'}
          </button>
        </footer>

        {error && (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        )}
      </main>
    </Atmosphere>
  );
}

function SummaryCard({ day, date, value, accent }) {
  return (
    <article className="relative overflow-hidden bg-[#131316]/90 border border-white/10 rounded-2xl p-6">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">{day}</p>
      <p className="mt-1 text-xs text-white/45">{date}</p>
      <p className="mt-5 text-5xl font-extrabold text-white tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-white/50">check-in peserta</p>
    </article>
  );
}

export default SummaryPage;
