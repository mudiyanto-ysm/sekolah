import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardGuru from './pages/DashboardGuru';
import DashboardSiswa from './pages/DashboardSiswa';
import SiswaPage from './pages/admin/SiswaPage';
import GuruPage from './pages/admin/GuruPage';
import KelasPage from './pages/admin/KelasPage';
import MapelPage from './pages/admin/MapelPage';
import NilaiPage from './pages/guru/NilaiPage';
import AbsensiPage from './pages/guru/AbsensiPage';
import AdminJadwalPage from './pages/admin/JadwalPage';
import NilaiSayaPage from './pages/siswa/NilaiSayaPage';
import AbsensiSayaPage from './pages/siswa/AbsensiSayaPage';
import SiswaJadwalPage from './pages/siswa/JadwalPage';

const dashboardByRole = {
  admin: '/admin',
  guru: '/guru',
  siswa: '/siswa',
};

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Memuat...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardByRole[user.role] || '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/siswa"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SiswaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/guru"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GuruPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kelas"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <KelasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/mapel"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MapelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jadwal"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminJadwalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guru"
        element={
          <ProtectedRoute allowedRoles={['guru']}>
            <DashboardGuru />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guru/nilai"
        element={
          <ProtectedRoute allowedRoles={['guru']}>
            <NilaiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guru/absensi"
        element={
          <ProtectedRoute allowedRoles={['guru']}>
            <AbsensiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <DashboardSiswa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/nilai"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <NilaiSayaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/absensi"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <AbsensiSayaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/jadwal"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <SiswaJadwalPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
