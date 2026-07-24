import { useEffect, useState } from 'react';
import SiswaLayout from '../../components/SiswaLayout';
import api from '../../api/client';

function currentTahunAjaran() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function NilaiSayaPage() {
  const [semester, setSemester] = useState('1');
  const [tahunAjaran, setTahunAjaran] = useState(currentTahunAjaran());
  const [nilaiList, setNilaiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/siswa-portal/nilai', { params: { semester, tahun_ajaran: tahunAjaran } });
      setNilaiList(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data nilai.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester, tahunAjaran]);

  return (
    <SiswaLayout title="Nilai Saya">
      <div className="flex flex-wrap gap-3 mb-6">
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
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : nilaiList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Belum ada nilai untuk semester & tahun ajaran ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Mata Pelajaran</th>
                <th className="px-4 py-3 font-medium text-center">Tugas</th>
                <th className="px-4 py-3 font-medium text-center">UTS</th>
                <th className="px-4 py-3 font-medium text-center">UAS</th>
                <th className="px-4 py-3 font-medium text-center">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((n) => (
                <tr key={n.mapel_id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{n.nama_mapel}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{n.tugas ?? '-'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{n.uts ?? '-'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{n.uas ?? '-'}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-800">
                    {n.nilai_akhir ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </SiswaLayout>
  );
}

export default NilaiSayaPage;
