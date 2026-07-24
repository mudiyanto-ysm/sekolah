import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import api from '../../api/client';

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const emptyForm = { kelas_id: '', mapel_id: '', guru_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30' };

function JadwalPage() {
  const [jadwalList, setJadwalList] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [guruOptions, setGuruOptions] = useState([]);
  const [filterKelas, setFilterKelas] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadOptions() {
    const [kelasRes, mapelRes, guruRes] = await Promise.all([
      api.get('/kelas'), api.get('/mapel'), api.get('/guru'),
    ]);
    setKelasOptions(kelasRes.data.data);
    setMapelOptions(mapelRes.data.data);
    setGuruOptions(guruRes.data.data);
  }

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/jadwal', { params: filterKelas ? { kelas_id: filterKelas } : {} });
      setJadwalList(res.data.data);
    } catch (err) {
      setError('Gagal memuat data jadwal.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelas]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(jadwal) {
    setEditingId(jadwal.id);
    setForm({
      kelas_id: String(jadwal.kelas_id),
      mapel_id: String(jadwal.mapel_id),
      guru_id: String(jadwal.guru_id),
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
    });
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/jadwal/${editingId}`, form);
      } else {
        await api.post('/jadwal', form);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan jadwal.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(jadwal) {
    if (!confirm(`Hapus jadwal ${jadwal.nama_mapel} (${jadwal.hari})?`)) return;
    try {
      await api.delete(`/jadwal/${jadwal.id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus jadwal.');
    }
  }

  return (
    <AdminLayout title="Jadwal Pelajaran">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Semua kelas</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
          ))}
        </select>
        <button
          onClick={openAddModal}
          className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          + Tambah Jadwal
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : jadwalList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Belum ada jadwal.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Hari</th>
                <th className="px-4 py-3 font-medium">Jam</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium">Mapel</th>
                <th className="px-4 py-3 font-medium">Guru</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jadwalList.map((j) => (
                <tr key={j.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{j.hari}</td>
                  <td className="px-4 py-3 text-slate-600">{j.jam_mulai} - {j.jam_selesai}</td>
                  <td className="px-4 py-3 text-slate-800">{j.nama_kelas}</td>
                  <td className="px-4 py-3 text-slate-600">{j.nama_mapel}</td>
                  <td className="px-4 py-3 text-slate-600">{j.nama_guru}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(j)} className="text-slate-600 hover:text-slate-900">Ubah</button>
                    <button onClick={() => handleDelete(j)} className="text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal title={editingId ? 'Ubah Jadwal' : 'Tambah Jadwal'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
            <select
              required value={form.kelas_id}
              onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">- Pilih kelas -</option>
              {kelasOptions.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
            <select
              required value={form.mapel_id}
              onChange={(e) => setForm({ ...form, mapel_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">- Pilih mapel -</option>
              {mapelOptions.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guru Pengajar</label>
            <select
              required value={form.guru_id}
              onChange={(e) => setForm({ ...form, guru_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">- Pilih guru -</option>
              {guruOptions.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
            <select
              value={form.hari}
              onChange={(e) => setForm({ ...form, hari: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {HARI_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
              <input
                type="time" required value={form.jam_mulai}
                onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
              <input
                type="time" required value={form.jam_selesai}
                onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
          )}

          <button
            type="submit" disabled={isSaving}
            className="w-full bg-slate-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}

export default JadwalPage;
