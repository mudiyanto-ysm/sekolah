import { useEffect, useState } from 'react';
import SiswaLayout from '../../components/SiswaLayout';
import api from '../../api/client';

const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

function JadwalPage() {
  const [jadwalList, setJadwalList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/siswa-portal/jadwal')
      .then((res) => setJadwalList(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat jadwal.'))
      .finally(() => setIsLoading(false));
  }, []);

  const byHari = URUTAN_HARI.map((hari) => ({
    hari,
    items: jadwalList.filter((j) => j.hari === hari),
  }));

  return (
    <SiswaLayout title="Jadwal Pelajaran">
      {isLoading ? (
        <p className="text-slate-500 text-sm">Memuat...</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : jadwalList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">
            Jadwal pelajaran untuk kelasmu belum diatur oleh admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {byHari.map(({ hari, items }) => (
            <div key={hari} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-700">{hari}</p>
              </div>
              {items.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-400">Tidak ada pelajaran.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.nama_mapel}</p>
                        <p className="text-xs text-slate-500">{item.nama_guru}</p>
                      </div>
                      <p className="text-xs text-slate-500 whitespace-nowrap">
                        {item.jam_mulai} - {item.jam_selesai}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SiswaLayout>
  );
}

export default JadwalPage;
