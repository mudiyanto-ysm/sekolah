import { Link } from 'react-router-dom';
import GuruLayout from '../components/GuruLayout';

function DashboardGuru() {
  return (
    <GuruLayout title="Ringkasan">
      <p className="text-slate-500 mb-6">Pilih menu di bawah ini.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/guru/nilai"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition"
        >
          <h3 className="font-medium text-slate-800 mb-1">Input Nilai</h3>
          <p className="text-sm text-slate-500">Input dan ubah nilai tugas, UTS, UAS siswa.</p>
        </Link>
        <Link
          to="/guru/absensi"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition"
        >
          <h3 className="font-medium text-slate-800 mb-1">Absensi</h3>
          <p className="text-sm text-slate-500">Catat kehadiran harian & lihat rekap bulanan.</p>
        </Link>
      </div>
    </GuruLayout>
  );
}

export default DashboardGuru;
