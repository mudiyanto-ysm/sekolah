import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiswaLayout from '../components/SiswaLayout';
import api from '../api/client';

function DashboardSiswa() {
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    api.get('/siswa-portal/profil').then((res) => setProfil(res.data.data));
  }, []);

  return (
    <SiswaLayout title="Ringkasan">
      {profil && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm text-slate-500">Selamat datang,</p>
          <p className="text-lg font-semibold text-slate-800">{profil.nama}</p>
          <p className="text-sm text-slate-500 mt-1">
            NIS {profil.nis} · Kelas {profil.nama_kelas || '-'} · Jurusan {profil.jurusan || '-'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/siswa/nilai" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition">
          <h3 className="font-medium text-slate-800 mb-1">Nilai Saya</h3>
          <p className="text-sm text-slate-500">Lihat nilai tugas, UTS, UAS per mapel.</p>
        </Link>
        <Link to="/siswa/absensi" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition">
          <h3 className="font-medium text-slate-800 mb-1">Absensi Saya</h3>
          <p className="text-sm text-slate-500">Cek rekap kehadiran bulanan.</p>
        </Link>
        <Link to="/siswa/jadwal" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition">
          <h3 className="font-medium text-slate-800 mb-1">Jadwal Pelajaran</h3>
          <p className="text-sm text-slate-500">Lihat jadwal pelajaran kelasmu.</p>
        </Link>
      </div>
    </SiswaLayout>
  );
}

export default DashboardSiswa;
