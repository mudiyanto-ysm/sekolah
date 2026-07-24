import { useEffect, useState } from 'react';
import GuruLayout from '../../components/GuruLayout';
import api from '../../api/client';

function currentTahunAjaran() {
  const now = new Date();
  const year = now.getFullYear();
  // Asumsi tahun ajaran baru dimulai bulan Juli
  return now.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function NilaiPage() {
  const [mengajarList, setMengajarList] = useState([]);
  const [selectedMengajar, setSelectedMengajar] = useState('');
  const [semester, setSemester] = useState('1');
  const [tahunAjaran, setTahunAjaran] = useState(currentTahunAjaran());

  const [siswaList, setSiswaList] = useState([]);
  const [edits, setEdits] = useState({}); // { siswa_id: { tugas, uts, uas } }
  const [savingId, setSavingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/nilai/mengajar').then((res) => {
      setMengajarList(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedMengajar(`${res.data.data[0].kelas_id}-${res.data.data[0].mapel_id}`);
      }
    });
  }, []);

  async function loadNilai() {
    if (!selectedMengajar) return;
    const [kelasId, mapelId] = selectedMengajar.split('-');

    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.get('/nilai', {
        params: { kelas_id: kelasId, mapel_id: mapelId, semester, tahun_ajaran: tahunAjaran },
      });
      setSiswaList(res.data.data);

      const initialEdits = {};
      for (const siswa of res.data.data) {
        initialEdits[siswa.siswa_id] = { ...siswa.nilai };
      }
      setEdits(initialEdits);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data nilai.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNilai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMengajar, semester, tahunAjaran]);

  function updateEdit(siswaId, jenis, value) {
    setEdits({
      ...edits,
      [siswaId]: { ...edits[siswaId], [jenis]: value === '' ? null : Number(value) },
    });
  }

  async function handleSaveRow(siswaId) {
    const [kelasId, mapelId] = selectedMengajar.split('-');
    const values = edits[siswaId];
    setSavingId(siswaId);
    setError('');
    setSuccessMsg('');

    try {
      const jobs = ['tugas', 'uts', 'uas']
        .filter((jenis) => values[jenis] !== null && values[jenis] !== undefined)
        .map((jenis) =>
          api.post('/nilai', {
            siswa_id: siswaId,
            mapel_id: mapelId,
            jenis,
            nilai: values[jenis],
            semester,
            tahun_ajaran: tahunAjaran,
          })
        );

      await Promise.all(jobs);
      setSuccessMsg('Nilai berhasil disimpan.');
      loadNilai();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan nilai.');
    } finally {
      setSavingId(null);
    }
  }

  function hitungNilaiAkhir(values) {
    if (!values) return null;
    const { tugas, uts, uas } = values;
    if (tugas == null || uts == null || uas == null) return null;
    return Math.round((tugas * 0.3 + uts * 0.3 + uas * 0.4) * 100) / 100;
  }

  return (
    <GuruLayout title="Input Nilai">
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedMengajar}
          onChange={(e) => setSelectedMengajar(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {mengajarList.length === 0 && <option value="">Belum ada penugasan mengajar</option>}
          {mengajarList.map((m) => (
            <option key={`${m.kelas_id}-${m.mapel_id}`} value={`${m.kelas_id}-${m.mapel_id}`}>
              {m.nama_mapel} — {m.nama_kelas}
            </option>
          ))}
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>

        <input
          type="text"
          value={tahunAjaran}
          onChange={(e) => setTahunAjaran(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="2025/2026"
        />
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : mengajarList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">
            Kamu belum ditugaskan mengajar kelas/mapel apa pun. Hubungi admin untuk mengatur penugasan.
          </p>
        ) : siswaList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Tidak ada siswa di kelas ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">NIS</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium w-24">Tugas</th>
                <th className="px-4 py-3 font-medium w-24">UTS</th>
                <th className="px-4 py-3 font-medium w-24">UAS</th>
                <th className="px-4 py-3 font-medium w-24">Nilai Akhir</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaList.map((siswa) => {
                const rowEdits = edits[siswa.siswa_id] || {};
                return (
                  <tr key={siswa.siswa_id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{siswa.nis}</td>
                    <td className="px-4 py-3 text-slate-800">{siswa.nama}</td>
                    {['tugas', 'uts', 'uas'].map((jenis) => (
                      <td key={jenis} className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rowEdits[jenis] ?? ''}
                          onChange={(e) => updateEdit(siswa.siswa_id, jenis, e.target.value)}
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {hitungNilaiAkhir(rowEdits) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSaveRow(siswa.siswa_id)}
                        disabled={savingId === siswa.siswa_id}
                        className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {savingId === siswa.siswa_id ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Nilai akhir dihitung otomatis: 30% Tugas + 30% UTS + 40% UAS. Muncul setelah ketiga nilai terisi.
      </p>
    </GuruLayout>
  );
}

export default NilaiPage;
