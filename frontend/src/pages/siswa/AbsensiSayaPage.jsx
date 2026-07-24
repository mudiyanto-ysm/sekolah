import { useEffect, useState } from 'react';
import SiswaLayout from '../../components/SiswaLayout';
import api from '../../api/client';

const statusColor = {
  hadir: 'bg-green-50 text-green-700 border-green-200',
  izin: 'bg-amber-50 text-amber-700 border-amber-200',
  sakit: 'bg-blue-50 text-blue-700 border-blue-200',
  alpa: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabel = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' };

function AbsensiSayaPage() {
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/siswa-portal/absensi', { params: { bulan, tahun } });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data absensi.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, tahun]);

  return (
    <SiswaLayout title="Absensi Saya">
      <div className="flex flex-wrap gap-3 mb-6">
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

      {isLoading ? (
        <p className="text-slate-500 text-sm">Memuat...</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">Hadir</p>
              <p className="text-xl font-semibold text-slate-800">{data.ringkasan.hadir}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">Izin</p>
              <p className="text-xl font-semibold text-slate-800">{data.ringkasan.izin}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">Sakit</p>
              <p className="text-xl font-semibold text-slate-800">{data.ringkasan.sakit}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">Alpa</p>
              <p className="text-xl font-semibold text-slate-800">{data.ringkasan.alpa}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-300">% Kehadiran</p>
              <p className="text-xl font-semibold text-white">
                {data.ringkasan.persentase_hadir != null ? `${data.ringkasan.persentase_hadir}%` : '-'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {data.rincian.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">Belum ada catatan absensi untuk bulan ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rincian.map((row) => (
                    <tr key={row.tanggal} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-600">{row.tanggal}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border ${statusColor[row.status]}`}>
                          {statusLabel[row.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </SiswaLayout>
  );
}

export default AbsensiSayaPage;
