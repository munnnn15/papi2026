import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { AudioWave, Atmosphere, PapiLogo } from './AudioAtmosphere';

const ADMIN_PASSWORD = 'admin123';

function RafflePage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [displayCode, setDisplayCode] = useState('?');
  const [celebration, setCelebration] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (authenticated) {
      fetchParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function fetchParticipants() {
    const { data, error } = await supabase
      .from('participants')
      .select('id, full_name, phone_number, unique_code, is_winner, prize_name, is_disqualified')
      .order('created_at', { ascending: true });

    if (!error) {
      setParticipants(data);
    }
  }

  const eligible = useMemo(
    () => participants.filter((p) => !p.is_winner && !p.is_disqualified),
    [participants],
  );

  function handleLogin(e) {
    e.preventDefault();
    setLoadingAuth(true);
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Password salah.');
    }
    setLoadingAuth(false);
  }

  function exportToCSV() {
    const header = ['No', 'Nama', 'No HP', 'Kode Undian', 'Status', 'Hadiah'];
    const rows = participants.map((p, i) => {
      const status = p.is_winner
        ? 'Pemenang'
        : p.is_disqualified
          ? 'Diskualifikasi'
          : 'Eligible';
      return [
        i + 1,
        p.full_name,
        p.phone_number,
        p.unique_code,
        status,
        p.prize_name || '',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `PAPI_participants_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function pickRandomWinner() {
    if (eligible.length === 0) {
      alert('Tidak ada peserta yang tersisa untuk diundi.');
      return;
    }

    const prizeName = 'Hadiah Utama';
    const winner = eligible[Math.floor(Math.random() * eligible.length)];

    setSpinning(true);
    setCelebration(null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const random = eligible[Math.floor(Math.random() * eligible.length)];
      setDisplayCode(random.unique_code);
    }, 70);

    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setDisplayCode(winner.unique_code);

      setTimeout(async () => {
        const { error } = await supabase
          .from('participants')
          .update({ is_winner: true, prize_name: prizeName })
          .eq('id', winner.id);

        if (error) {
          alert('Gagal mengupdate pemenang: ' + error.message);
          setSpinning(false);
          return;
        }

        setCelebration({ ...winner, prize_name: prizeName });
        setSpinning(false);
        fetchParticipants();
      }, 900);
    }, 5200);
  }

  if (!authenticated) {
    return (
      <Atmosphere>
        <div className="w-full max-w-sm fade-in-up relative">
          <div className="text-center mb-7">
            <PapiLogo />
            <AudioWave className="mt-1" bars={9} height="h-4" />
          </div>
          <div className="bg-[#131316]/90 backdrop-blur border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-7">
              <h1 className="text-2xl font-extrabold tracking-[0.2em] text-white">
                PAPI
              </h1>
              <p className="text-sm text-white/45 mt-2">Panel Undian · Khusus panitia</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#e10600] focus:ring-2 focus:ring-[#e10600]/30 transition"
              />
              <button
                type="submit"
                disabled={loadingAuth}
                className="btn-glow w-full py-3.5 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {loadingAuth ? 'Memeriksa...' : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </Atmosphere>
    );
  }

  const winner = participants.find((p) => p.is_winner);

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.08),transparent_55%)]" />
      <div className="relative max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold leading-tight">
              Panel Undian PAPI
            </h1>
            <p className="text-sm text-white/45">
              Portable Audio Party Indonesia
            </p>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-sm text-white/50 hover:text-white transition px-4 py-2 rounded-lg border border-white/10 hover:border-white/25"
          >
            Keluar
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#131316] border border-white/10 rounded-2xl p-5">
            <p className="text-sm text-white/45">Total Peserta</p>
            <p className="text-3xl font-bold mt-1">{participants.length}</p>
          </div>
          <div className="bg-[#131316] border border-white/10 rounded-2xl p-5">
            <p className="text-sm text-white/45">Sisa Eligible</p>
            <p className="text-3xl font-bold mt-1 text-[#ff4d4d]">
              {eligible.length}
            </p>
          </div>
          <div className="bg-[#131316] border border-white/10 rounded-2xl p-5">
            <p className="text-sm text-white/45">Pemenang</p>
            <p className="text-3xl font-bold mt-1">
              {participants.filter((p) => p.is_winner).length}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#131316] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center">
            <div className="text-center mb-5">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-4">
                {spinning ? 'Sedang mengundi...' : 'Pemenang Undian'}
              </p>
              <RaffleReel
                displayCode={displayCode}
                spinning={spinning}
                celebration={!!celebration}
              />
            </div>
            <button
              onClick={pickRandomWinner}
              disabled={spinning || eligible.length === 0}
              className="btn-glow w-full py-4 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white text-lg font-bold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {spinning ? 'Mengundi...' : 'Putar & Undi Pemenang'}
            </button>
            {eligible.length === 0 && !spinning && (
              <p className="text-xs text-white/40 mt-3">
                Semua peserta sudah diundi.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {winner && (
              <div className="bg-[#131316] border-l-4 border-[#e10600] rounded-2xl p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">
                  Pemenang Terakhir
                </p>
                <p className="text-2xl font-bold">
                  {winner.full_name}
                  <span className="ml-3 text-lg text-[#ff4d4d]">
                    {winner.unique_code}
                  </span>
                </p>
                <p className="text-sm text-white/50 mt-1">
                  Hadiah: {winner.prize_name}
                </p>
              </div>
            )}

            {celebration && (
              <div className="bg-gradient-to-br from-[#e10600]/20 to-[#ff4d4d]/10 border border-[#e10600]/40 rounded-2xl p-6 pop-in">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#ff4d4d] mb-1">
                  🎉 Selamat Pemenang
                </p>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] to-[#ff4d4d] glow-text">
                  {celebration.full_name}
                </p>
                <p className="text-lg font-semibold mt-1">
                  {celebration.unique_code}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  Hadiah: {celebration.prize_name}
                </p>
              </div>
            )}

            <div className="bg-[#131316] border border-white/10 rounded-2xl p-5 overflow-x-auto flex-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  Daftar Peserta ({participants.length})
                </p>
                <button
                  onClick={exportToCSV}
                  className="text-xs px-3 py-1.5 border border-white/15 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition"
                >
                  Download CSV
                </button>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr className="text-left text-white/45">
                    <th className="px-3 py-2 font-medium">No</th>
                    <th className="px-3 py-2 font-medium">Nama</th>
                    <th className="px-3 py-2 font-medium">Kode</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-3 py-2 text-white/45">{i + 1}</td>
                      <td className="px-3 py-2">{p.full_name}</td>
                      <td className="px-3 py-2 font-mono text-[#ff4d4d]">
                        {p.unique_code}
                      </td>
                      <td className="px-3 py-2">
                        {p.is_winner ? (
                          <span className="px-2 py-1 bg-green-500/15 text-green-400 rounded-full text-xs">
                            Pemenang
                          </span>
                        ) : p.is_disqualified ? (
                          <span className="px-2 py-1 bg-red-500/15 text-red-400 rounded-full text-xs">
                            Diskualifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs">
                            Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RaffleReel({ displayCode, spinning, celebration }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`flex items-center justify-center w-full min-w-[260px] h-28 rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden ${
            spinning ? 'shimmer' : ''
          }`}
          style={
            spinning
              ? { animation: 'shake 0.12s infinite' }
              : undefined
          }
        >
          <span
            className={`text-5xl font-extrabold tracking-widest font-mono ${
              celebration
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] to-[#ff4d4d] glow-text pop-in'
                : spinning
                ? 'text-[#ff4d4d]'
                : displayCode === '?'
                ? 'text-white/20'
                : 'text-white'
            }`}
          >
            {displayCode}
          </span>
        </div>

        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#0a0a0a] rounded-full border border-[#e10600]/60 flex items-center justify-center glow-soft z-10">
          <div className="w-3 h-3 bg-[#e10600] rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              spinning ? 'bg-[#e10600] animate-pulse' : 'bg-white/20'
            }`}
            style={spinning ? { animationDelay: `${i * 0.12}s` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default RafflePage;
