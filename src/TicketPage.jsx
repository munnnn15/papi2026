import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { AudioWave, Atmosphere, PapiLogo } from './AudioAtmosphere';

function TicketPage() {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchParticipant() {
      const { data, error: dbError } = await supabase
        .from('participants')
        .select('full_name, unique_code')
        .eq('id', id)
        .single();

      if (dbError) {
        setError('Data tiket tidak ditemukan.');
      } else {
        setParticipant(data);
      }
      setLoading(false);
    }
    fetchParticipant();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-white/20 border-t-[#e10600] rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !participant) {
    return (
      <Atmosphere>
        <div className="w-full max-w-md bg-[#131316] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-red-400">{error || 'Tiket tidak ditemukan.'}</p>
          <Link
            to="/"
            className="btn-glow mt-6 inline-block px-6 py-2.5 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white rounded-xl transition"
          >
            Kembali
          </Link>
        </div>
      </Atmosphere>
    );
  }

  return (
    <Atmosphere>
      <div className="w-full max-w-md fade-in-up relative">
        <div className="text-center mb-7">
          <PapiLogo size="lg" />
          <AudioWave className="mt-1" bars={11} height="h-5" />
        </div>

        <div className="bg-[#131316]/90 backdrop-blur border border-white/10 rounded-3xl overflow-hidden shadow-2xl glow-soft">
          <div className="px-6 py-7 text-center bg-gradient-to-br from-[#e10600]/15 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2">
              Tiket
            </p>
            <h1 className="text-xl font-bold text-white">Berhasil Terdaftar</h1>
          </div>

          <div className="px-8 pb-8 text-center">
            <div className="pt-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">
                Nomor Undian Anda
              </p>
              <p className="text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] to-[#ff4d4d] glow-text mb-6">
                {participant.unique_code}
              </p>
            </div>

            <div className="border-t border-dashed border-white/10 pt-6">
              <p className="text-sm text-white/40 mb-1">Nama</p>
              <p className="text-xl font-semibold text-white">
                {participant.full_name}
              </p>
            </div>

            <div className="mt-6 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
              <p className="text-xs text-white/40 leading-relaxed">
                Simpan nomor undian ini. Nomor akan digunakan pada sesi
                pengundian hadiah acara PAPI.
              </p>
            </div>

            <Link
              to="/"
              className="btn-glow mt-6 block w-full py-3.5 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white font-semibold rounded-xl text-center transition"
            >
              Selesai
            </Link>
          </div>
        </div>
      </div>
    </Atmosphere>
  );
}

export default TicketPage;
