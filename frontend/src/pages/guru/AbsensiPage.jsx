import { useEffect, useState } from 'react';
import GuruLayout from '../../components/GuruLayout';
import api from '../../api/client';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const statusOptions = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpa', label: 'Alpa' },
];

const statusColor = {
  hadir: 'bg-green-50 text-green-700 border-green-200',
  izin: 'bg-amber-50 text-amber-700 border-amber-200',
  sakit: 'bg-blue-50 text-blue-700 border-blue-200',
  alpa: 'bg-red-50 text-red-700 border-red-200',
};

function AbsensiPage() {
  const [tab, setTab] = useState('harian'); // 'harian' | 'rekap'
  const [kelasList, setKelasList] = useState([]);
  const [kelasId, setKelasId] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- state input harian ---
  const [tanggal, setTanggal] = useState(todayStr());
  const [siswaHarian, setSiswaHarian] = useState([]);
  const [isLoadingHarian, setIsLoadingHarian] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- state rekap bulanan ---
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [rekap, setRekap] = useState([]);
  const [isLoadingRekap, setIsLoadingRekap] = useState(false);

  useEffect(() => {
    api.get('/absensi/kelas-saya').then((res) => {
      setKelasList(res.data.data);
      if (res.data.data.length > 0) setKelasId(String(res.data.data[0].id));
    });
  }, []);

  async function loadHarian() {
    if (!kelasId) return;
    setIsLoadingHarian(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.get('/absensi', { params: { kelas_id: kelasId, tanggal } });
      setSiswaHarian(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data absensi.');
    } finally {
      setIsLoadingHarian(false);
    }
  }

  async function loadRekap() {
    if (!kelasId) return;
    setIsLoadingRekap(true);
    setError('');
    try {
      const res = await api.get('/absensi/rekap', { params: { kelas_id: kelasId, bulan, tahun } });
      setRekap(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rekap absensi.');
    } finally {
      setIsLoadingRekap(false);
    }
  }

  useEffect(() => {
    if (tab === 'harian') loadHarian();
    else loadRekap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, kelasId, tanggal, bulan, tahun]);

  function updateStatus(siswaId, status) {
    setSiswaHarian((prev) => prev.map((s) => (s.siswa_id === siswaId ? { ...s, status } : s)));
  }

  function setAllStatus(status) {
    setSiswaHarian((prev) => prev.map((s) => ({ ...s, status })));
  }

  async function handleSaveAll() {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const records = siswaHarian
        .filter((s) => s.status)
        .map((s) => ({ siswa_id: s.siswa_id, status: s.status }));

      await api.post('/absensi/bulk', { kelas_id: kelasId, tanggal, records });
      setSuccessMsg('Absensi berhasil disimpan.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan absensi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <GuruLayout title="Absensi">
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <select
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {kelasList.length === 0 && <option value="">Belum ada kelas</option>}
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
          <button
            onClick={() => setTab('harian')}
            className={`px-4 py-2 ${tab === 'harian' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
          >
            Input Harian
          </button>
          <button
            onClick={() => setTab('rekap')}
            className={`px-4 py-2 ${tab === 'rekap' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
          >
            Rekap Bulanan
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}
      {successMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">{successMsg}</div>
      )}

      {tab === 'harian' ? (
        <>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <span className="text-xs text-slate-400">Tandai semua:</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAllStatus(opt.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {isLoadingHarian ? (
              <p className="p-6 text-slate-500 text-sm">Memuat...</p>
            ) : kelasList.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">
                Kamu belum ditugaskan mengajar kelas apa pun. Hubungi admin untuk mengatur penugasan.
              </p>
            ) : siswaHarian.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">Tidak ada siswa di kelas ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">NIS</th>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaHarian.map((siswa) => (
                    <tr key={siswa.siswa_id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-600">{siswa.nis}</td>
                      <td className="px-4 py-3 text-slate-800">{siswa.nama}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateStatus(siswa.siswa_id, opt.value)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                                siswa.status === opt.value
                                  ? statusColor[opt.value]
                                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {siswaHarian.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="mt-4 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {isLoadingRekap ? (
              <p className="p-6 text-slate-500 text-sm">Memuat...</p>
            ) : rekap.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">Tidak ada data untuk kelas/bulan ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">NIS</th>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium text-center">Hadir</th>
                    <th className="px-4 py-3 font-medium text-center">Izin</th>
                    <th className="px-4 py-3 font-medium text-center">Sakit</th>
                    <th className="px-4 py-3 font-medium text-center">Alpa</th>
                    <th className="px-4 py-3 font-medium text-center">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((r) => (
                    <tr key={r.siswa_id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-600">{r.nis}</td>
                      <td className="px-4 py-3 text-slate-800">{r.nama}</td>
                      <td className="px-4 py-3 text-center">{r.hadir}</td>
                      <td className="px-4 py-3 text-center">{r.izin}</td>
                      <td className="px-4 py-3 text-center">{r.sakit}</td>
                      <td className="px-4 py-3 text-center">{r.alpa}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        {r.persentase_hadir != null ? `${r.persentase_hadir}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </GuruLayout>
  );
}

export default AbsensiPage;
