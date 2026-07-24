import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import api from '../../api/client';

const emptyForm = { nama: '', email: '', password: '', nip: '' };

function GuruPage() {
  const [guruList, setGuruList] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [mengajar, setMengajar] = useState([]); // [{ kelas_id, mapel_id }]
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/guru', { params: { search } });
      setGuruList(res.data.data);
    } catch (err) {
      setError('Gagal memuat data guru.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [kelasRes, mapelRes] = await Promise.all([api.get('/kelas'), api.get('/mapel')]);
      setKelasOptions(kelasRes.data.data);
      setMapelOptions(mapelRes.data.data);
    } catch (err) {
      // dropdown akan tetap kosong kalau gagal
    }
  }

  useEffect(() => {
    loadOptions();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadData();
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setMengajar([]);
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(guru) {
    setEditingId(guru.id);
    setForm({ nama: guru.nama, email: guru.email, password: '', nip: guru.nip });
    setMengajar(guru.mengajar.map((m) => ({ kelas_id: String(m.kelas_id), mapel_id: String(m.mapel_id) })));
    setFormError('');
    setIsModalOpen(true);
  }

  function addMengajarRow() {
    setMengajar([...mengajar, { kelas_id: '', mapel_id: '' }]);
  }

  function updateMengajarRow(index, field, value) {
    const updated = [...mengajar];
    updated[index] = { ...updated[index], [field]: value };
    setMengajar(updated);
  }

  function removeMengajarRow(index) {
    setMengajar(mengajar.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const validMengajar = mengajar.filter((m) => m.kelas_id && m.mapel_id);

    setIsSaving(true);
    try {
      const payload = { ...form, mengajar: validMengajar };
      if (editingId && !payload.password) delete payload.password;

      if (editingId) {
        await api.put(`/guru/${editingId}`, payload);
      } else {
        await api.post('/guru', payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(guru) {
    if (!confirm(`Hapus guru "${guru.nama}"? Akun login guru ini juga akan terhapus.`)) return;
    try {
      await api.delete(`/guru/${guru.id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus guru.');
    }
  }

  return (
    <AdminLayout title="Data Guru">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NIP..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button type="submit" className="text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">
            Cari
          </button>
        </form>
        <button
          onClick={openAddModal}
          className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          + Tambah Guru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-slate-500 text-sm">Memuat...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : guruList.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">Tidak ada data guru yang cocok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">NIP</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Mengajar</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guruList.map((guru) => (
                <tr key={guru.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{guru.nip}</td>
                  <td className="px-4 py-3 text-slate-800">{guru.nama}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {guru.mengajar.length === 0
                      ? '-'
                      : guru.mengajar.map((m) => `${m.nama_mapel} (${m.nama_kelas})`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{guru.email}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(guru)} className="text-slate-600 hover:text-slate-900">
                      Ubah
                    </button>
                    <button onClick={() => handleDelete(guru)} className="text-red-600 hover:text-red-800">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal title={editingId ? 'Ubah Guru' : 'Tambah Guru'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text" required value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIP</label>
            <input
              type="text" required value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {editingId && <span className="text-slate-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <input
              type="password" required={!editingId} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Mengajar (kelas & mapel)</label>
              <button type="button" onClick={addMengajarRow} className="text-xs text-slate-600 underline">
                + Tambah baris
              </button>
            </div>

            {mengajar.length === 0 && (
              <p className="text-xs text-slate-400 mb-2">Belum ada penugasan. Klik "+ Tambah baris" untuk menambah.</p>
            )}

            <div className="space-y-2">
              {mengajar.map((row, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={row.kelas_id}
                    onChange={(e) => updateMengajarRow(index, 'kelas_id', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">- Kelas -</option>
                    {kelasOptions.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                    ))}
                  </select>
                  <select
                    value={row.mapel_id}
                    onChange={(e) => updateMengajarRow(index, 'mapel_id', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">- Mapel -</option>
                    {mapelOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.nama_mapel}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMengajarRow(index)}
                    className="text-red-500 hover:text-red-700 text-sm px-2"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
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

export default GuruPage;
