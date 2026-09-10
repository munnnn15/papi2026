import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { AudioWave, Atmosphere, PapiLogo } from './AudioAtmosphere';

const STORAGE_KEY = 'papi_registered';

function generateUniqueCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PAPI-${num}`;
}

function RegistrationPage() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [checking, setChecking] = useState(true);
  const [agreedRules, setAgreedRules] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      stored = null;
    }
    if (stored && stored.uniqueCode && stored.fullName) {
      setDone(stored);
    }
    setChecking(false);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!agreedRules) {
      setError('Anda harus menyetujui aturan undian terlebih dahulu.');
      return;
    }

    const name = fullName.trim();
    const phone = phoneNumber.trim();

    setLoading(true);

    const { data: existing, error: checkError } = await supabase
      .from('participants')
      .select('full_name, unique_code')
      .eq('phone_number', phone)
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      setError(checkError.message);
      return;
    }

    if (existing) {
      setLoading(false);
      setDone({ fullName: existing.full_name, uniqueCode: existing.unique_code });
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            fullName: existing.full_name,
            uniqueCode: existing.unique_code,
          }),
        );
      } catch {
        /* ignore */
      }
      return;
    }

    const uniqueCode = generateUniqueCode();

    const { data, error: dbError } = await supabase
      .from('participants')
      .insert([
        {
          full_name: name,
          phone_number: phone,
          unique_code: uniqueCode,
        },
      ])
      .select('id, full_name, unique_code')
      .single();

    if (dbError) {
      setLoading(false);
      if (dbError.code === '23505') {
        setError(
          'Nomor HP sudah terdaftar. Anda hanya dapat mendaftar satu kali.',
        );
      } else {
        setError(dbError.message);
      }
      return;
    }

    const registered = {
      fullName: data.full_name,
      uniqueCode: data.unique_code,
    };
    setDone(registered);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registered));
    } catch {
      /* ignore */
    }
  }

  if (checking) {
    return null;
  }

  if (done) {
    return (
      <Atmosphere>
        <div className="w-full max-w-md fade-in-up relative">
          <div className="text-center mb-7">
            <PapiLogo size="lg" />
            <AudioWave className="mt-1" bars={11} height="h-5" />
          </div>

          <div className="bg-[#131316]/90 backdrop-blur border border-white/10 rounded-3xl overflow-hidden shadow-2xl glow-soft">
            <div className="px-6 py-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#e10600] to-[#ff4d4d] flex items-center justify-center glow-soft pop-in">
                <svg
                  className="w-9 h-9 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">
                Registrasi Berhasil
              </h1>
              <p className="text-sm text-white/45">
                Selamat datang di PAPI, {done.fullName}
              </p>
            </div>

            <div className="px-8 pb-8 text-center">
              <div className="border-t border-dashed border-white/10 pt-7">
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">
                  Nomor Undian Anda
                </p>
                <p className="text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] to-[#ff4d4d] glow-text mb-6">
                  {done.uniqueCode}
                </p>
              </div>

              <div className="mt-6 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-xs text-white/40 leading-relaxed">
                  Simpan nomor undian ini. Nomor akan digunakan pada sesi
                  pengundian hadiah acara PAPI.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/30 mt-6 tracking-wide">
            Registrasi hanya berlaku satu kali per orang.
          </p>
        </div>
      </Atmosphere>
    );
  }

  return (
    <Atmosphere>
      <div className="w-full max-w-md fade-in-up relative">
        <div className="text-center mb-7">
          <PapiLogo size="lg" />
          <AudioWave className="mt-1" bars={11} height="h-4" />
        </div>

        <div className="bg-[#131316]/90 backdrop-blur border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Registrasi Tamu</h1>
          <p className="text-sm text-white/45 mb-8">
            Lengkapi data untuk mendapatkan nomor undian Anda
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#e10600] focus:ring-2 focus:ring-[#e10600]/30 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Nomor HP
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#e10600] focus:ring-2 focus:ring-[#e10600]/30 transition"
              />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">
                Aturan Undian
              </p>
              <ul className="text-sm text-white/50 space-y-2 ml-1">
                <li className="flex gap-2">
                  <span className="text-[#e10600] mt-0.5 shrink-0">•</span>
                  <span>Nama yang didaftarkan <strong className="text-white/70">harus sesuai dengan KTP</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#e10600] mt-0.5 shrink-0">•</span>
                  <span>Jika terdeteksi nama ganda / mendaftar lebih dari 1x, maka <strong className="text-white/70">diskualifikasi</strong></span>
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreedRules}
                  onChange={(e) => setAgreedRules(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded border border-white/20 bg-[#0a0a0a] peer-checked:bg-[#e10600] peer-checked:border-[#e10600] transition flex items-center justify-center">
                  {agreedRules && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-white/50 leading-snug">
                Saya menyetujui aturan undian di atas
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-3.5 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] hover:from-[#ff2020] hover:to-[#ff6b6b] text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar & Dapatkan Nomor Undian'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/25 mt-6 tracking-wide">
          Scan QR untuk registrasi · PAPI
        </p>
      </div>
    </Atmosphere>
  );
}

export default RegistrationPage;
