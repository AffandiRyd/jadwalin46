/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Megaphone,
  BookOpen,
  User as UserIcon,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  LogOut,
  LogIn,
  AlertCircle,
  CheckCircle,
  MapPin,
  Mail,
  Phone,
  Terminal,
  Lock,
  Info,
  X,
  Clock,
  Key,
  Users,
  Layers,
  Sparkles,
  ArrowUpRight,
  Award,
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
import { Kelas, SessionUser, Agenda, InfoTerkini, JadwalPelajaran } from './types';

const formatKelasNama = (nama?: string) => {
  if (!nama) return '';
  // Jika nama diakhiri dengan ' 0', hapus suffix ' 0'
  if (nama.endsWith(' 0')) {
    return nama.substring(0, nama.length - 2);
  }
  return nama;
};

export default function App() {
  // Global States
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [infoTerkini, setInfoTerkini] = useState<InfoTerkini[]>([]);
  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  
  // Filtering Schedules (Public View)
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'>('Senin');

  // Auth States
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPengurusPassword, setShowPengurusPassword] = useState(false);
  
  // Custom Toasts/Alert system
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);
  
  // Loading indicators
  const [loading, setLoading] = useState({
    kelas: false,
    agenda: false,
    info: false,
    jadwal: false,
    auth: false
  });

  // Admin / Pengurus Dashboard Navigation
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'kelola-pengurus' | 'kelola-kelas' | 'kelola-agenda' | 'kelola-info' | 'kelola-jadwal' | 'pengaturan'>('dashboard');

  // Public View Navigation ('home' | 'about')
  const [publicPage, setPublicPage] = useState<'home' | 'about'>('home');

  // Scroll to top on public page transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [publicPage]);

  // Admin: Pengurus Accounts State
  const [pengurusList, setPengurusList] = useState<{ id: string; username: string; kelas_id: string; kelas_nama: string; created_at?: string }[]>([]);
  
  // Form Modals states
  const [modalType, setModalType] = useState<'class' | 'pengurus' | 'agenda' | 'info' | 'schedule' | 'view-sql' | null>(null);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openEditKelas = (cls: any) => {
    setItemToEdit(cls);
    setFormKelas({
      tingkat: cls.tingkat,
      jurusan: cls.jurusan,
      nomor_rombel: cls.nomor_rombel
    });
    setModalType('class');
  };

  // Form Fields
  // Class
  const [formKelas, setFormKelas] = useState({ tingkat: 'X', jurusan: 'RPL', nomor_rombel: 1 });
  // Pengurus
  const [formPengurus, setFormPengurus] = useState({ username: '', password: '', kelas_id: '' });
  // Agenda
  const [formAgenda, setFormAgenda] = useState({ judul: '', deskripsi: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '' });
  // Info
  const [formInfo, setFormInfo] = useState({ judul: '', isi_konten: '' });
  // Schedule
  const [formSchedule, setFormSchedule] = useState({ hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: '', nama_guru: '' });
  
  // Profile settings State
  const [profileForm, setProfileForm] = useState({ newUsername: '', oldPassword: '', newPassword: '' });

  // Developer Supabase Integration SQL Code
  const [supabaseSqlCode, setSupabaseSqlCode] = useState('');

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Check state on startup
  useEffect(() => {
    // Read session from localStorage
    const savedSession = localStorage.getItem('jadwalin_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('jadwalin_session');
      }
    }

    // Fetch initial data
    fetchKelas();
    fetchAgenda();
    fetchInfoTerkini();
    fetchSupabaseSql();
  }, []);

  // Sync scheduled data when selection or tab changes
  useEffect(() => {
    fetchJadwal();
  }, [selectedKelasId]);

  // Sync role-based navigation tabs
  useEffect(() => {
    if (session) {
      if (session.role === 'admin') {
        setActiveTab('kelola-pengurus');
      } else {
        setActiveTab('kelola-jadwal');
        // Auto set class filter for pengurus
        if (session.kelas_id) {
          setSelectedKelasId(session.kelas_id);
        }
      }
    } else {
      setActiveTab('dashboard');
    }
  }, [session]);

  const fetchKelas = async () => {
    setLoading(prev => ({ ...prev, kelas: true }));
    try {
      const res = await fetch('/api/kelas');
      if (res.ok) {
        const data = await res.json();
        setKelas(data);
        // Pre-select first class if not selected
        if (data.length > 0 && !selectedKelasId && !session?.kelas_id) {
          setSelectedKelasId(data[0].id);
        }
      }
    } catch (err) {
      showToast('Gagal memuat daftar kelas', 'error');
    } finally {
      setLoading(prev => ({ ...prev, kelas: false }));
    }
  };

  const fetchAgenda = async () => {
    setLoading(prev => ({ ...prev, agenda: true }));
    try {
      const res = await fetch('/api/agenda');
      if (res.ok) {
        const data = await res.json();
        setAgenda(data);
      }
    } catch (err) {
      showToast('Gagal memuat agenda sekolah', 'error');
    } finally {
      setLoading(prev => ({ ...prev, agenda: false }));
    }
  };

  const fetchInfoTerkini = async () => {
    setLoading(prev => ({ ...prev, info: true }));
    try {
      const res = await fetch('/api/info-terkini');
      if (res.ok) {
        const data = await res.json();
        setInfoTerkini(data);
      }
    } catch (err) {
      showToast('Gagal memuat berita sekolah', 'error');
    } finally {
      setLoading(prev => ({ ...prev, info: false }));
    }
  };

  const fetchJadwal = async () => {
    if (!selectedKelasId) return;
    setLoading(prev => ({ ...prev, jadwal: true }));
    try {
      const res = await fetch(`/api/jadwal?kelas_id=${selectedKelasId}`);
      if (res.ok) {
        const data = await res.json();
        setJadwal(data);
      }
    } catch (err) {
      showToast('Gagal memuat jadwal pelajaran', 'error');
    } finally {
      setLoading(prev => ({ ...prev, jadwal: false }));
    }
  };

  const fetchSupabaseSql = async () => {
    try {
      const res = await fetch('/api/export-supabase-sql');
      if (res.ok) {
        const data = await res.json();
        setSupabaseSqlCode(data.sql);
      }
    } catch (err) {
      console.error('Cannot load SQL helper schema');
    }
  };

  const loadPengurusList = async () => {
    if (!session || session.role !== 'admin') return;
    try {
      const res = await fetch('/api/users/pengurus');
      if (res.ok) {
        const data = await res.json();
        setPengurusList(data);
      }
    } catch (err) {
      showToast('Gagal memuat daftar pengurus kelas', 'error');
    }
  };

  // Auth operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      showToast('Username dan password wajib diisi', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, auth: true }));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setSession(data);
        localStorage.setItem('jadwalin_session', JSON.stringify(data));
        showToast(`Selamat datang kembali, ${data.username}!`, 'success');
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        
        if (data.role === 'admin') {
          loadPengurusList();
        } else if (data.kelas_id) {
          setSelectedKelasId(data.kelas_id);
        }
      } else {
        showToast(data.error || 'Username atau password salah', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungkan ke server autentikasi', 'error');
    } finally {
      setLoading(prev => ({ ...prev, auth: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jadwalin_session');
    setSession(null);
    showToast('Anda berhasil keluar.', 'success');
    
    // reset to first class on public view
    if (kelas.length > 0) {
      setSelectedKelasId(kelas[0].id);
    }
  };

  // Profile update logic
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (profileForm.newPassword && profileForm.newPassword.length < 8) {
      showToast('Password baru minimal 8 karakter', 'error');
      return;
    }

    if (session.role === 'pengurus' && !profileForm.oldPassword) {
      showToast('Masukkan password lama Anda untuk konfirmasi', 'error');
      return;
    }

    try {
      const payload: any = {
        userId: session.id,
        oldPassword: profileForm.oldPassword,
        newPassword: profileForm.newPassword
      };

      if (session.role === 'admin' && profileForm.newUsername) {
        payload.newUsername = profileForm.newUsername;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Profil dan keamanan berhasil diubah!', 'success');
        
        // Update local session
        const updatedSession = { ...session };
        if (session.role === 'admin' && profileForm.newUsername) {
          updatedSession.username = profileForm.newUsername;
        }
        setSession(updatedSession);
        localStorage.setItem('jadwalin_session', JSON.stringify(updatedSession));
        
        setProfileForm({ newUsername: '', oldPassword: '', newPassword: '' });
      } else {
        showToast(data.error || 'Gagal mengubah profil', 'error');
      }
    } catch (err) {
      showToast('Gagal mengirim pembaruan ke server', 'error');
    }
  };

  // CRUD: KELAS
  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemToEdit?.id,
          ...formKelas
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(itemToEdit ? `Kelas ${formatKelasNama(data.nama_lengkap)} berhasil diperbarui!` : `Kelas ${formatKelasNama(data.nama_lengkap)} berhasil ditambahkan!`, 'success');
        fetchKelas();
        setModalType(null);
        setItemToEdit(null);
      } else {
        showToast(data.error || 'Kelas gagal disimpan', 'error');
      }
    } catch (err) {
      showToast('Gagal menyimpan kelas', 'error');
    }
  };

  const handleDeleteKelas = (id: string, name: string) => {
    requestConfirm(
      'Hapus Kelas',
      `Apakah Anda yakin ingin menghapus kelas "${formatKelasNama(name)}"? Semua jadwal dan akun pengurus kelas ini juga akan terhapus/dikosongkan.`,
      async () => {
        try {
          const res = await fetch(`/api/kelas/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast(`Kelas ${formatKelasNama(name)} berhasil dihapus`, 'success');
            fetchKelas();
            loadPengurusList();
          } else {
            showToast('Gagal menghapus kelas', 'error');
          }
        } catch (err) {
          showToast('Error saat menghubungi server', 'error');
        }
      }
    );
  };

  // CRUD: PENGURUS
  const handleSavePengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPengurus.username || !formPengurus.kelas_id) {
      showToast('Username dan Alokasi Kelas wajib diisi', 'error');
      return;
    }

    if (!itemToEdit && (!formPengurus.password || formPengurus.password.length < 8)) {
      showToast('Password wajib diisi minimal 8 karakter', 'error');
      return;
    }

    if (itemToEdit && formPengurus.password && formPengurus.password.length < 8) {
      showToast('Password baru minimal 8 karakter', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users/pengurus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemToEdit?.id,
          username: formPengurus.username,
          password: formPengurus.password,
          kelas_id: formPengurus.kelas_id
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(itemToEdit ? 'Akun pengurus diperbarui.' : 'Akun pengurus berhasil dibuat!', 'success');
        loadPengurusList();
        setModalType(null);
        setItemToEdit(null);
        setFormPengurus({ username: '', password: '', kelas_id: '' });
      } else {
        showToast(data.error || 'Gagal menyimpan pengurus', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server', 'error');
    }
  };

  const handleDeletePengurus = (id: string, username: string) => {
    requestConfirm(
      'Hapus Akun Pengurus',
      `Apakah Anda yakin ingin menghapus akun pengurus dengan username "${username}"?`,
      async () => {
        try {
          const res = await fetch(`/api/users/pengurus/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast(`Akun ${username} berhasil dihapus`, 'success');
            loadPengurusList();
          } else {
            showToast('Gagal menghapus akun pengurus', 'error');
          }
        } catch (err) {
          showToast('Error menghubungi server', 'error');
        }
      }
    );
  };

  const openEditPengurus = (p: any) => {
    setItemToEdit(p);
    setFormPengurus({
      username: p.username,
      password: '',
      kelas_id: p.kelas_id || ''
    });
    setModalType('pengurus');
  };

  // CRUD: AGENDA
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgenda.judul || !formAgenda.tanggal_mulai || !formAgenda.lokasi) {
      showToast('Judul, Tanggal Mulai dan Lokasi wajib ditentukan', 'error');
      return;
    }

    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemToEdit?.id,
          judul: formAgenda.judul,
          deskripsi: formAgenda.deskripsi,
          tanggal_mulai: formAgenda.tanggal_mulai,
          tanggal_selesai: formAgenda.tanggal_selesai || undefined,
          lokasi: formAgenda.lokasi,
          created_by: session?.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(itemToEdit ? 'Agenda berhasil diperbarui.' : 'Agenda sekolah berhasil diterbitkan!', 'success');
        fetchAgenda();
        setModalType(null);
        setItemToEdit(null);
        setFormAgenda({ judul: '', deskripsi: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '' });
      } else {
        showToast(data.error || 'Gagal menyimpan agenda', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung dengan server', 'error');
    }
  };

  const handleDeleteAgenda = (id: string, title: string) => {
    requestConfirm(
      'Hapus Agenda',
      `Hapus agenda "${title}" dari daftar?`,
      async () => {
        try {
          const res = await fetch(`/api/agenda/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Agenda berhasil dihapus', 'success');
            fetchAgenda();
          } else {
            showToast('Gagal menghapus agenda', 'error');
          }
        } catch (err) {
          showToast('Error server', 'error');
        }
      }
    );
  };

  const openEditAgenda = (a: Agenda) => {
    setItemToEdit(a);
    setFormAgenda({
      judul: a.judul,
      deskripsi: a.deskripsi,
      tanggal_mulai: a.tanggal_mulai.substring(0, 10),
      tanggal_selesai: a.tanggal_selesai ? a.tanggal_selesai.substring(0,10) : '',
      lokasi: a.lokasi
    });
    setModalType('agenda');
  };

  // CRUD: INFO TERKINI
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInfo.judul || !formInfo.isi_konten) {
      showToast('Judul dan Isi Berita tidak boleh kosong', 'error');
      return;
    }

    try {
      const res = await fetch('/api/info-terkini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemToEdit?.id,
          judul: formInfo.judul,
          isi_konten: formInfo.isi_konten,
          created_by: session?.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(itemToEdit ? 'Berita diperbarui' : 'Berita / Info terkini berhasil diterbitkan!', 'success');
        fetchInfoTerkini();
        setModalType(null);
        setItemToEdit(null);
        setFormInfo({ judul: '', isi_konten: '' });
      } else {
        showToast(data.error || 'Gagal menyimpan info', 'error');
      }
    } catch (err) {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  const handleDeleteInfo = (id: string, title: string) => {
    requestConfirm(
      'Hapus Pengumuman',
      `Hapus pengumuman "${title}"?`,
      async () => {
        try {
          const res = await fetch(`/api/info-terkini/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Berita telah dihapus', 'success');
            fetchInfoTerkini();
          } else {
            showToast('Gagal menghapus berita', 'error');
          }
        } catch (err) {
          showToast('Gagal menghubungi server', 'error');
        }
      }
    );
  };

  const openEditInfo = (i: InfoTerkini) => {
    setItemToEdit(i);
    setFormInfo({
      judul: i.judul,
      isi_konten: i.isi_konten
    });
    setModalType('info');
  };

  // CRUD: JADWAL PELAJARAN
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard ensuring that class ownership rules are followed
    const targetClassId = session?.kelas_id || selectedKelasId;
    if (!targetClassId) {
      showToast('Silahkan pilih/tentukan kelas terlebih dahulu', 'error');
      return;
    }

    if (!formSchedule.mata_pelajaran || !formSchedule.jam_mulai || !formSchedule.jam_selesai) {
      showToast('Mata Pelajaran, Jam Mulai, dan Jam Selesai wajib ditentukan', 'error');
      return;
    }

    try {
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemToEdit?.id,
          kelas_id: targetClassId,
          hari: formSchedule.hari,
          jam_mulai: formSchedule.jam_mulai,
          jam_selesai: formSchedule.jam_selesai,
          mata_pelajaran: formSchedule.mata_pelajaran,
          nama_guru: formSchedule.nama_guru
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(itemToEdit ? 'Entri jadwal berhasil diubah.' : 'Jam pelajaran baru berhasil ditambahkan!', 'success');
        fetchJadwal();
        setModalType(null);
        setItemToEdit(null);
        setFormSchedule({
          hari: formSchedule.hari, // keep day selected for ease of sequential insertions
          jam_mulai: '07:00',
          jam_selesai: '08:30',
          mata_pelajaran: '',
          nama_guru: ''
        });
      } else {
        showToast(data.error || 'Gagal menyimpan entri jadwal', 'error');
      }
    } catch (err) {
      showToast('Gangguan konektivitas ke server', 'error');
    }
  };

  const handleDeleteSchedule = (id: string, matpel: string) => {
    requestConfirm(
      'Hapus Jam Pelajaran',
      `Hapus jam pelajaran "${matpel}"?`,
      async () => {
        try {
          const res = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Jam pelajaran berhasil dihapus', 'success');
            fetchJadwal();
          } else {
            showToast('Gagal menghapus entri jadwal', 'error');
          }
        } catch (err) {
          showToast('Error server', 'error');
        }
      }
    );
  };

  const openEditSchedule = (j: JadwalPelajaran) => {
    setItemToEdit(j);
    setFormSchedule({
      hari: j.hari,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      mata_pelajaran: j.mata_pelajaran,
      nama_guru: j.nama_guru || ''
    });
    setModalType('schedule');
  };

  // Switch tabs & fetch specific records if needed
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'kelola-pengurus') {
      loadPengurusList();
    }
  };

  // Helper formatting dates in local Indonesian style
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch (e) {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notifikasi */}
      <div id="toast-container" className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 w-80 pointer-events-auto ${
                t.type === 'success'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {t.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span className="text-sm font-medium">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* NAVBAR */}
      <nav id="navbar" className="sticky top-0 z-40 bg-slate-900 text-white backdrop-blur-md bg-opacity-95 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Logo */}
            <div 
              onClick={() => {
                setPublicPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 border border-slate-700 transition-transform group-hover:scale-105">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7qazJbjn3W8v_Jnkwch-wMxkmyBZPP2_dAAR3chJTTg&s=10"
                  alt="Logo SMKN 46 Jakarta"
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white font-display">
                  Jadwal!n
                </span>
              </div>
            </div>

            {/* Menu Navigasi Tengah */}
            {!session && (
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                <button 
                  onClick={() => {
                    setPublicPage('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className={`hover:text-blue-400 transition-colors font-display ${publicPage === 'about' ? 'text-blue-400 font-bold' : ''}`}
                >
                  Tentang Kami
                </button>
                
                <div className="relative group py-2">
                  <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                    Layanan <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700/80 rounded-xl shadow-xl py-2 hidden group-hover:block animate-fadeIn">
                    <a href="#info-terkini" onClick={() => setPublicPage('home')} className="block px-4 py-2 hover:bg-slate-700 hover:text-white transition-colors">Berita Sekolah</a>
                    <a href="#agenda-sekolah" onClick={() => setPublicPage('home')} className="block px-4 py-2 hover:bg-slate-700 hover:text-white transition-colors">Agenda Kegiatan</a>
                    <a href="#jadwal-pelajaran" onClick={() => setPublicPage('home')} className="block px-4 py-2 hover:bg-slate-700 hover:text-white transition-colors">Jadwal Kelas</a>
                  </div>
                </div>

                <a 
                  href="https://www.smkn46jaktim.sch.id/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-400 transition-colors font-display"
                >
                  Forensix
                </a>
              </div>
            )}

            {/* Profil / Tombol Login Kanan */}
            <div className="flex items-center gap-4">
              {session ? (
                // State: Logged-in
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-100 font-sans">{session.username}</p>
                    <p className="text-[11px] text-blue-400 font-medium">
                      {session.role === 'admin' ? '🔥 Admin Sekolah' : `✏️ Pengurus ${formatKelasNama(session.kelas_nama)}`}
                    </p>
                  </div>
                  
                  <div className="relative group">
                    <button className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border border-slate-700 flex items-center justify-center font-bold hover:scale-105 transition-all text-white shadow">
                      {session.username.substring(0,2).toUpperCase()}
                    </button>
                    
                    {/* User profile actions dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 hidden group-hover:block animate-fadeIn z-50">
                      <div className="px-4 py-2 border-b border-slate-700">
                        <p className="text-xs text-slate-400">Masuk sebagai</p>
                        <p className="text-sm font-bold truncate text-slate-100">{session.username}</p>
                        <p className="text-[10px] uppercase font-mono text-blue-400 mt-0.5">{session.role}</p>
                      </div>

                      {session.role === 'admin' ? (
                        <>
                          <button onClick={() => handleTabChange('kelola-pengurus')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" /> Kelola Pengurus
                          </button>
                          <button onClick={() => handleTabChange('kelola-kelas')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-400" /> Kelola Daftar Kelas
                          </button>
                          <button onClick={() => handleTabChange('kelola-agenda')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" /> Kelola Agenda
                          </button>
                          <button onClick={() => handleTabChange('kelola-info')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-slate-400" /> Kelola Info Terkini
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleTabChange('kelola-jadwal')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-slate-400" /> Kelola Jadwal Kelas Saya
                        </button>
                      )}

                      <button onClick={() => handleTabChange('pengaturan')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                        <Settings className="h-4 w-4 text-slate-400" /> Ubah Password
                      </button>
                      
                      <div className="border-t border-slate-700 my-1"></div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-900/40 hover:text-rose-100 transition-colors flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Keluar Sesi
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // State: Guest
                <button
                  id="btn-login"
                  onClick={() => setShowLoginModal(true)}
                  className="h-10 w-10 rounded-full border border-slate-700 text-slate-350 hover:text-white hover:border-slate-500 hover:bg-slate-850/60 transition-all flex items-center justify-center shadow-inner"
                  title="Masuk Akun"
                >
                  <UserIcon className="h-5 w-5" strokeWidth={1.8} />
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* DASHBOARD BAR - ONLY SHOWN IF USER IS LOGGED IN */}
      {session && (
        <div id="dashboard-bar" className="bg-slate-800 text-slate-200 border-b border-slate-700 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-slate-700 text-slate-100 rounded-lg text-xs font-mono font-bold">
                  Dashboard
                </span>
                <span className="text-xs text-slate-400">
                  {session.role === 'admin' ? 'Admin Portal' : 'Pengurus Kelas Portal'}
                </span>
              </div>

              {/* Responsive Navigation Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {session.role === 'admin' ? (
                  <>
                    <button
                      onClick={() => handleTabChange('kelola-pengurus')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        activeTab === 'kelola-pengurus'
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      🗣️ Kelola Pengurus
                    </button>
                    <button
                      onClick={() => handleTabChange('kelola-kelas')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        activeTab === 'kelola-kelas'
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      🏫 Kelola Kelas
                    </button>
                    <button
                      onClick={() => handleTabChange('kelola-agenda')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        activeTab === 'kelola-agenda'
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      🗓️ Agenda
                    </button>
                    <button
                      onClick={() => handleTabChange('kelola-info')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        activeTab === 'kelola-info'
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      📢 Berita
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleTabChange('kelola-jadwal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      activeTab === 'kelola-jadwal'
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    📚 Kelola Jadwal {formatKelasNama(session.kelas_nama)}
                  </button>
                )}

                <button
                  onClick={() => handleTabChange('pengaturan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    activeTab === 'pengaturan'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  ⚙️ Pengaturan Password
                </button>
              </div>

              {/* Quick exit dashboard button */}
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER PAGES OR DASHBOARD ACTION VIEWPORT */}
      {session && activeTab !== 'dashboard' ? (
        
        // ==========================================
        // BACKEND / DASHBOARD INTERFACES FOR ROLES
        // ==========================================
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  {activeTab === 'kelola-pengurus' && 'Kelola Akun Pengurus Kelas'}
                  {activeTab === 'kelola-kelas' && 'Kelola Daftar Kelas'}
                  {activeTab === 'kelola-agenda' && 'Kelola Pengumuman Agenda Kegiatan'}
                  {activeTab === 'kelola-info' && 'Kelola Berita / Info Terkini Portal'}
                  {activeTab === 'kelola-jadwal' && `Kelola Kalender Pelajaran ${formatKelasNama(session.kelas_nama)}`}
                  {activeTab === 'pengaturan' && 'Keamanan & Pengaturan Profil'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {activeTab === 'kelola-pengurus' && 'Daftarkan akun pengurus baru dan petakan tanggung jawab kelasnya.'}
                  {activeTab === 'kelola-kelas' && 'Modifikasi tingkat, jurusan, dan nomor rombel belajar di sekolah.'}
                  {activeTab === 'kelola-agenda' && 'Kendalikan publikasi jadwal agenda sekolah utama.'}
                  {activeTab === 'kelola-info' && 'Tulis, suntunting, atau tiadakan postingan berita peserta didik.'}
                  {activeTab === 'kelola-jadwal' && 'Ubah mata pelajaran harian kelas Anda dengan mudah.'}
                  {activeTab === 'pengaturan' && 'Tingkatkan kekuatan keamanan akun personal Anda secara mandiri.'}
                </p>
              </div>

              {/* Action buttons on Header */}
              {activeTab === 'kelola-pengurus' && (
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setFormPengurus({ username: '', password: '', kelas_id: '' });
                    setModalType('pengurus');
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors font-display"
                >
                  <Plus className="h-4 w-4" /> Daftarkan Pengurus
                </button>
              )}
              {activeTab === 'kelola-kelas' && (
                <button
                  onClick={() => {
                    setFormKelas({ tingkat: 'X', jurusan: 'RPL', nomor_rombel: 1 });
                    setModalType('class');
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors font-display"
                >
                  <Plus className="h-4 w-4" /> Tambah Kelas Baru
                </button>
              )}
              {activeTab === 'kelola-agenda' && (
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setFormAgenda({ judul: '', deskripsi: '', tanggal_mulai: '', tanggal_selesai: '', lokasi: '' });
                    setModalType('agenda');
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors font-display"
                >
                  <Plus className="h-4 w-4" /> Publikasi Agenda
                </button>
              )}
              {activeTab === 'kelola-info' && (
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setFormInfo({ judul: '', isi_konten: '' });
                    setModalType('info');
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors font-display"
                >
                  <Plus className="h-4 w-4" /> Tulis Info Terkini
                </button>
              )}
              {activeTab === 'kelola-jadwal' && (
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setFormSchedule({
                      hari: selectedDay,
                      jam_mulai: '07:00',
                      jam_selesai: '08:30',
                      mata_pelajaran: '',
                      nama_guru: ''
                    });
                    setModalType('schedule');
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors font-display"
                >
                  <Plus className="h-4 w-4" /> Tambah Pelajaran
                </button>
              )}
            </div>

            {/* TAB CONTENT: KELOLA PENGURUS */}
            {activeTab === 'kelola-pengurus' && session.role === 'admin' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold tracking-wider text-slate-500">
                      <th className="p-4 rounded-l-xl">Username</th>
                      <th className="p-4">Tanggung Jawab Kelas</th>
                      <th className="p-4">Waktu Dibuat</th>
                      <th className="p-4 text-right rounded-r-xl">Aksi Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium">
                    {pengurusList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          Belum ada akun pengurus kelas yang diterbitkan. Silahkan klik tambah pengurus.
                        </td>
                      </tr>
                    ) : (
                      pengurusList.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100/60 hover:bg-slate-50/50">
                          <td className="p-4 text-slate-700 font-semibold font-mono">{p.username}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                              {formatKelasNama(p.kelas_nama)}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 text-xs">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-right text-xs">
                            <div className="inline-flex items-center justify-end gap-2">
                              <button onClick={() => openEditPengurus(p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Ubah Pengurus">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeletePengurus(p.id, p.username)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus Akun">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: KELOLA KELAS */}
            {activeTab === 'kelola-kelas' && session.role === 'admin' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {kelas.map((cls) => (
                    <div key={cls.id} className="p-5 border border-slate-150 rounded-2xl bg-white hover:shadow-md transition-shadow relative group">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider">SMK NEGERI 46</p>
                      <h4 className="text-xl font-bold text-slate-800 mt-1">{formatKelasNama(cls.nama_lengkap)}</h4>
                      
                      <div className="flex gap-2.5 text-[11px] text-slate-500 mt-3 font-medium">
                        <span>Jurusan: {cls.jurusan}</span>
                        <span>•</span>
                        <span>Tingkat: {cls.tingkat}</span>
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEditKelas(cls)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100"
                          title="Ubah Kelas"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKelas(cls.id, cls.nama_lengkap)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: KELOLA AGENDA */}
            {activeTab === 'kelola-agenda' && session.role === 'admin' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold tracking-wider text-slate-500">
                      <th className="p-4 rounded-l-xl">Kegiatan</th>
                      <th className="p-4">Tanggal Pelaksanaan</th>
                      <th className="p-4">Lokasi</th>
                      <th className="p-4 text-right rounded-r-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-slate-700">
                    {agenda.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          Belum ada agenda sekolah. Hubungkan informasi penting sekolah di sini.
                        </td>
                      </tr>
                    ) : (
                      agenda.map((a) => (
                        <tr key={a.id} className="border-b border-slate-100/60 hover:bg-slate-50/50">
                          <td className="p-4">
                            <span className="font-bold block text-slate-800">{a.judul}</span>
                            <span className="text-xs text-slate-500 block max-w-sm font-normal mt-0.5 mt-1 line-clamp-2">{a.deskripsi}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs inline-block bg-indigo-50 text-indigo-700 p-1.5 px-2.5 rounded-lg font-bold">
                              {formatShortDate(a.tanggal_mulai)}
                              {a.tanggal_selesai && ` — ${formatShortDate(a.tanggal_selesai)}`}
                            </span>
                          </td>
                          <td className="p-4 font-normal text-slate-600 text-xs">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-blue-500 shrink-0" /> {a.lokasi}
                            </span>
                          </td>
                          <td className="p-4 text-right text-xs">
                            <div className="inline-flex justify-end items-center gap-2">
                              <button onClick={() => openEditAgenda(a)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteAgenda(a.id, a.judul)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: KELOLA INFO / NEWS */}
            {activeTab === 'kelola-info' && session.role === 'admin' && (
              <div className="space-y-4">
                {infoTerkini.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 text-slate-400 rounded-xl">
                    Belum ada berita atau informasi terkini diterbitkan.
                  </div>
                ) : (
                  infoTerkini.map((info) => (
                    <div key={info.id} className="p-5 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block font-display">INFO SEKOLAH</span>
                        <h4 className="text-lg font-bold text-slate-800 mt-1">{info.judul}</h4>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{info.isi_konten}</p>
                        <span className="text-xs text-slate-400 mt-4 block">Diterbitkan {formatDateIndo(info.created_at || '')}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEditInfo(info)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                        <button onClick={() => handleDeleteInfo(info.id, info.judul)} className="p-2 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors">
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: KELOLA JADWAL PELAJARAN (ROLE PENGURUS ONLY) */}
            {activeTab === 'kelola-jadwal' && (
              <div>
                {/* Switch Day tabs specifically inside the editor dashboard */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl/90 w-fit mb-6">
                  {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const).map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${
                        selectedDay === day
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Schedules list of SPECIFIC CLASS and DAY currently managed */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden mt-4">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold font-mono uppercase tracking-widest text-slate-500">
                      JADWAL ACARA HARI {selectedDay.toUpperCase()} — {formatKelasNama(session.kelas_nama)}
                    </span>
                    <span className="text-xs text-blue-600 font-bold bg-blue-50 p-1 px-2.5 rounded-lg">
                      {jadwal.filter((j) => j.hari === selectedDay).length} Bidang Studi
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-sm">
                    {jadwal.filter((j) => j.hari === selectedDay).length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-medium">
                        Tidak ada jam pelajaran terdaftar untuk kelas Anda di hari {selectedDay}. <br />
                        <span className="text-xs text-slate-400 block mt-2">Daftarkan jam pelajaran memakai tombol "Tambah Pelajaran" di kanan atas.</span>
                      </div>
                    ) : (
                      jadwal
                        .filter((j) => j.hari === selectedDay)
                        .map((j) => (
                          <div key={j.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/40 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 shrink-0 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                <Clock className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-base">{j.mata_pelajaran}</h4>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-xs mt-1">
                                  <span className="font-mono bg-slate-100 p-0.5 px-2.5 rounded font-semibold text-slate-600">
                                    ⏱️ {j.jam_mulai} — {j.jam_selesai}
                                  </span>
                                  {j.nama_guru && (
                                    <span className="text-slate-500">
                                      👩‍🏫 Pengajar: <span className="font-semibold text-slate-600">{j.nama_guru}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Operations */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => openEditSchedule(j)}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(j.id, j.mata_pelajaran)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PROFILE / SECURITY SETTINGS */}
            {activeTab === 'pengaturan' && (
              <div className="max-w-xl mx-auto border border-slate-150 p-6 sm:p-8 rounded-2xl bg-slate-50 animate-fadeIn">
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-4 rounded-full text-white shadow">
                      <Lock className="h-8 w-8" />
                    </div>
                  </div>

                  {session.role === 'admin' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username Admin</label>
                      <input
                        type="text"
                        placeholder="Ubah username admin"
                        value={profileForm.newUsername || session.username}
                        onChange={(e) => setProfileForm({ ...profileForm, newUsername: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-blue-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Hanya admin yang dapat merubah username mereka sendiri.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username Pengurus</label>
                      <input
                        type="text"
                        disabled
                        value={session.username}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-[11px] text-slate-450 mt-1">Username pengurus bersifat permanen dan hanya dapat dimodifikasi oleh Admin sekolah.</p>
                    </div>
                  )}

                  <div className="border-t border-slate-200/60 my-5 pt-3"></div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password Saat Ini</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        required={session?.role === 'pengurus'} // Admin bypass, pengurus require
                        placeholder="Masukkan sandi saat ini"
                        value={profileForm.oldPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, oldPassword: e.target.value })}
                        className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-blue-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        title={showOldPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                      >
                        {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password Baru (Sandi Pengganti)</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Sandi minimal 8 karakter"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-blue-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        title={showNewPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl transition-all duration-200 text-xs uppercase tracking-wider mt-4"
                  >
                    Simpan Perubahan Akun
                  </button>
                </form>
              </div>
            )}

          </div>
        </main>
      ) : publicPage === 'about' ? (
        // ==========================================
        // DEDICATED ABOUT PORTAL VIEW ("Tentang Kami" Page)
        // ==========================================
        <div className="flex-grow animate-fadeIn bg-slate-50">
          {/* Header Banner for About Page */}
          <div className="bg-slate-900 border-b border-slate-800 text-white py-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
              <span className="p-1 px-3 bg-blue-950 text-blue-400 font-mono text-[10px] uppercase font-bold tracking-widest rounded-lg border border-blue-800">
                PROFIL SEKOLAH
              </span>
              <h1 className="text-4xl sm:text-5xl font-black mt-3 text-white tracking-tight font-display">
                Tentang Kami
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 flex items-center justify-center sm:justify-start gap-1.5 font-medium font-sans">
                <span className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => { setPublicPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</span>
                <span>/</span>
                <span className="text-slate-300">Tentang Kami</span>
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
            {/* Visi Misi Section & Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 block mb-1 font-display">SEKILAS SEJARAH</span>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight font-display">
                    SMK Negeri 46 Jakarta (Forensix)
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed font-normal font-sans">
                  SMK Negeri 46 Jakarta, yang akrab disapa dengan julukan kebanggaan <strong className="text-blue-600 font-display">Forensix</strong>, didirikan untuk mendarmabaktikan lulusan berdaya kompetisi prima di era disrupsi digital global. Website <strong className="text-blue-650">Jadwal!n</strong> adalah salah satu wujud nyata transparansi dan efisiensi manajemen akademik untuk mendukung pembelajaran harian para siswa tercinta.
                </p>

                {/* VISI, MISI & MOTTO CARD */}
                <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-5">
                  <h3 className="text-base font-extrabold text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2.5 font-display">
                    Visi dan Misi SMK Negeri 46 Jakarta
                  </h3>
                  
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 font-display">
                      <Award className="h-4 w-4 text-blue-500" /> Visi
                    </h4>
                    <p className="text-slate-750 text-sm mt-1.5 leading-relaxed font-medium italic">
                      "Mendidik generasi yang berkarakter, profesional, berdaya saing global serta peduli lingkungan."
                    </p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 font-display">
                      <Sparkles className="h-4 w-4 text-indigo-500" /> Misi
                    </h4>
                    <ol className="list-none pl-0 mt-3 space-y-3">
                      <li className="flex gap-2.5 items-start">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold shrink-0 font-mono">1</span>
                        <span className="text-slate-650 text-xs leading-relaxed">Meningkatkan keimanan dan ketakwaan peserta didik kepada Tuhan Yang Maha Esa.</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold shrink-0 font-mono">2</span>
                        <span className="text-slate-650 text-xs leading-relaxed">Menyelenggarakan pendidikan vokasi/kejuruan sesuai kurikulum yang terintegrasi dengan kebutuhan dunia industri (link and match).</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold shrink-0 font-mono">3</span>
                        <span className="text-slate-650 text-xs leading-relaxed">Mewujudkan sekolah yang aman, nyaman, sehat, ramah anak dan lingkungan.</span>
                      </li>
                    </ol>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-indigo-650 uppercase tracking-widest flex items-center gap-1.5 font-display">
                      🎯 Motto
                    </h4>
                    <p className="text-slate-800 text-sm font-bold mt-1.5 tracking-wide bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 inline-block">
                      "Satukan Hati, Lejitkan Prestasi"
                    </p>
                  </div>
                </div>
              </div>

              {/* Gallery Frame */}
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-[4/3] bg-slate-155 group relative">
                  <img
                    src="https://majalahsunday.com/wp-content/uploads/2021/03/u.jpg"
                    alt="SMKN 46 Jakarta Courtyard"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 text-white">
                    <p className="text-xs font-mono opacity-80 uppercase tracking-widest font-bold">Fasilitas Utama</p>
                    <p className="text-base font-bold font-display">Halaman Utama & Lapangan Olahraga SMKN 46</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center gap-3">
                  <div className="p-2 border border-blue-200 text-blue-600 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    SMKN 46 Jakarta terletak secara strategis dengan lingkungan belajar nyaman kondusif, didukung ekosistem sarana prasarana modern di wilayah Jakarta Timur.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA back Button */}
            <div className="p-8 border border-slate-200 rounded-3xl bg-slate-50 text-center max-w-3xl mx-auto space-y-4">
              <h4 className="text-lg font-bold text-slate-800 font-display">Mulai Lihat Jadwal & Agenda Sekolah?</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto font-sans">
                Cek jadwal pelajaran harian per rombel dan pengumuman terbaru OSIS untuk kelancaran kegiatan belajar mengajar Anda hari ini.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => {
                    setPublicPage('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow shadow-blue-200 active:scale-95"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        
        // ==========================================
        // MAIN PUBLIC PORTAL VIEW (FOR ACTIVE GUESTS)
        // ==========================================
        <div className="flex-grow">
          
          {/* 1. HERO HERO BANNER SECTION */}
          <section
            id="hero-banner"
            className="relative h-[90vh] md:h-[80vh] flex items-center justify-center bg-slate-950 text-white overflow-hidden py-12"
          >
            {/* Background images element with dark modern drop blur */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://majalahsunday.com/wp-content/uploads/2021/03/u.jpg"
                alt="Courtyard SMKN 46 Jakarta (Forensix)"
                className="w-full h-full object-cover opacity-35 scale-105 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950"></div>
            </div>

            {/* Decorative Grid Patterns */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] z-10"></div>

            {/* Banner Inner Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left w-full">
              <div className="max-w-3xl">
                
                {/* Floating Forensix Tag */}
                <div className="inline-flex items-center gap-1.5 p-1 px-3 mb-6 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-full text-slate-300 text-xs font-semibold select-none shadow-lg animate-fadeIn">
                  <span className="h-2 w-2 rounded-full bg-blue-405 animate-pulse"></span>
                  Official Portal SMKN 46 Jakarta
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] font-display">
                  All of Forensix, <br />
                  <span className="flex items-center justify-center sm:justify-start gap-2 text-white">
                    All in one<span className="inline-block h-4.5 w-4.5 rounded-full bg-blue-500 border border-blue-400"></span>
                  </span>
                </h1>
                
                <p className="text-slate-300 text-base md:text-lg mt-6 leading-relaxed font-normal">
                  View school schedules and agendas with just one touch. <br className="hidden sm:inline" />
                  Lebih praktis, selaras, dan tertata dengan Jadwal!n.
                </p>

                <p className="text-blue-400 text-sm font-mono mt-3 font-semibold tracking-wider">
                  #MakeItEasier
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                  <button
                    onClick={() => {
                      setPublicPage('about');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto p-3.5 px-8 text-center text-xs uppercase tracking-wider font-bold bg-white/5 border border-white/20 text-white hover:bg-white/15 hover:border-white/40 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Learn More Here
                  </button>
                  <a
                    href="#jadwal-pelajaran"
                    className="w-full sm:w-auto p-3.5 px-8 text-center text-xs uppercase tracking-wider font-bold bg-transparent border border-slate-705 text-slate-300 hover:text-white hover:border-slate-500 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Cari Jadwal Kelas <Search className="h-4 w-4" />
                  </a>
                </div>

              </div>
            </div>
          </section>

          {/* 2. MAIN CORE PORTAL SECTION ("Selamat Datang, Peserta Didik!!") */}
          <section id="konten-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
            
            <div className="border-b border-slate-200/80 pb-8 mb-12">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight font-display">Halo, Peserta Didik!!</h2>
              <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium">
                Selamat datang di Jadwal!n, website yang dapat membantu peserta didik SMKN 46 Jakarta.
              </p>
            </div>

            <div className="space-y-16">
              
              {/* A. INFO TERKINI SECTION */}
              <div id="info-terkini" className="scroll-mt-24">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-100">
                    <Megaphone className="h-6 w-6 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Info Terkini</h3>
                </div>

                {loading.info ? (
                  <div className="flex items-center gap-2 p-5 text-slate-400 font-medium">
                    Memuat info terbaru...
                  </div>
                ) : infoTerkini.length === 0 ? (
                  <div className="p-8 border border-slate-150 rounded-2xl bg-white text-slate-400 font-medium text-center">
                    Belum ada pengumuman.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {infoTerkini.slice(0, 4).map((i) => (
                      <div key={i.id} className="p-5 sm:p-6 border border-slate-150 rounded-2xl bg-white hover:border-slate-350 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-2.5 py-1 bg-blue-50 rounded-lg font-display">
                            PENGUMUMAN UTAMA
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            📅 {formatDateIndo(i.created_at || '')}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mt-2.5 leading-snug">{i.judul}</h4>
                        <p className="text-slate-650 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{i.isi_konten}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* B. AGENDA SEKOLAH SECTION */}
              <div id="agenda-sekolah" className="scroll-mt-24">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
                    <Calendar className="h-6 w-6 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Agenda Sekolah</h3>
                </div>

                {loading.agenda ? (
                  <div className="flex items-center gap-2 p-5 text-slate-400 font-medium">
                    Mengecek jadwal kalender...
                  </div>
                ) : agenda.length === 0 ? (
                  <div className="p-8 border border-slate-150 rounded-2xl bg-white text-slate-400 font-medium text-center">
                    Belum ada agenda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {agenda.map((a) => (
                      <div key={a.id} className="p-5 border border-slate-150 rounded-2xl bg-white hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 rounded-lg">
                            AGENDA KEGIATAN
                          </span>
                          <h4 className="text-[17px] font-black text-slate-800 mt-3 leading-snug">{a.judul}</h4>
                          <p className="text-slate-500 text-xs font-normal mt-2 leading-relaxed line-clamp-3">{a.deskripsi}</p>
                        </div>
                        
                        <div className="border-t border-slate-100 mt-5 pt-3.5 space-y-2 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-600">
                              {formatShortDate(a.tanggal_mulai)} {a.tanggal_selesai && ` s/d ${formatShortDate(a.tanggal_selesai)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 font-normal">
                            <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                            <span className="truncate">{a.lokasi}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* C. JADWAL PELAJARAN SECTION */}
              <div id="jadwal-pelajaran" className="scroll-mt-24">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-105">
                    <BookOpen className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Jadwal Pelajaran</h3>
                </div>

                <div className="p-6 sm:p-8 border border-slate-200/80 rounded-3xl bg-white shadow-xl shadow-slate-100/50 space-y-6">
                  {/* FILTER SELECTIONS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Alokasi Kelas</label>
                      <div className="relative">
                        <select
                          value={selectedKelasId}
                          onChange={(e) => setSelectedKelasId(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-850 border border-slate-205 rounded-xl text-sm font-bold appearance-none cursor-pointer focus:outline-blue-500 transition-colors shadow-xs"
                        >
                          <option value="">-- Tampilkan Semua Kelas --</option>
                          {kelas.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              Kelas {formatKelasNama(cls.nama_lengkap)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                          <ChevronDown className="h-4.5 w-4.5" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-7">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">Hari Pelajaran</label>
                      <div className="grid grid-cols-5 gap-1 md:gap-2 bg-slate-100 p-1.5 rounded-xl text-center text-xs font-bold">
                        {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const).map((day) => (
                          <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`py-2 rounded-lg text-center font-bold tracking-tight transition-all ${
                              selectedDay === day
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SCHEDULE LIST DETAILED */}
                  <div className="pt-6 border-t border-slate-100">
                    {!selectedKelasId ? (
                      <div className="py-12 text-center text-slate-450 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200/70">
                        Pilih alokasi kelas terlebih dahulu untuk menampilkan jadwal mata pelajaran.
                      </div>
                    ) : loading.jadwal ? (
                      <div className="py-12 text-center text-slate-444 text-xs font-semibold">
                        Memuat jam pelajaran...
                      </div>
                    ) : jadwal.filter((j) => j.hari === selectedDay).length === 0 ? (
                      <div className="py-12 text-center text-slate-450 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200/70">
                        Tidak ada jadwal untuk hari {selectedDay}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
                        {jadwal
                          .filter((j) => j.hari === selectedDay)
                          .map((j) => (
                            <div key={j.id} className="p-5 border border-slate-150 rounded-2xl bg-slate-50 hover:border-blue-200 hover:bg-white transition-all shadow-xs flex flex-col justify-between">
                              <div>
                                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold bg-blue-50 text-blue-700 p-1 px-2.5 rounded-lg border border-blue-100/50">
                                  ⏰ {j.jam_mulai} - {j.jam_selesai}
                                </span>
                                <h5 className="font-bold text-sm sm:text-base text-slate-805 mt-3.5 leading-snug">{j.mata_pelajaran}</h5>
                              </div>
                              {j.nama_guru && (
                                <p className="text-xs text-slate-500 mt-4 pt-3.5 border-t border-slate-100 font-medium select-none">
                                  👩‍🏫 Pengajar: <span className="font-semibold text-slate-700">{j.nama_guru}</span>
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </section> {/* Closes konten-portal section */}

        </div>
      )}

      {/* FOOTER */}
      <footer id="footer" className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-auto pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12">
            
            {/* Column 1: School Header & Identity */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 border border-slate-800">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7qazJbjn3W8v_Jnkwch-wMxkmyBZPP2_dAAR3chJTTg&s=10"
                    alt="Logo SMKN 46 Jakarta"
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wider uppercase font-display">SMK NEGERI 46 JAKARTA</h3>
              </div>
              <p className="text-slate-400 text-sm font-semibold italic">
                "Satukan Hati, Lejitkan Prestasi."
              </p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-md">
                Menyelenggarakan pendidikan kejuruan bermutu tinggi untuk melahirkan insan tangguh siap kerja, kreatif, berdaya saing global, dan berakhlak mulia.
              </p>
            </div>

            {/* Column 2: Alamat */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5 font-display">
                <MapPin className="h-4.5 w-4.5 text-blue-400 shrink-0" /> Alamat Sekolah
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Jl. Cipinang Pulo No.19, RT.7/RW.14, Cipinang Besar Utara, Kecamatan Jatinegara, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13410
              </p>
            </div>

            {/* Column 3: Contact & Email info */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5 font-display">
                <Mail className="h-4.5 w-4.5 text-blue-400 shrink-0" /> Kontak Informasi
              </h4>
              <div className="space-y-2 text-xs font-medium text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-450" /> smkn46jakarta@gmail.com
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-450" /> (021) 8195127
                </p>
              </div>
            </div>

          </div>

          {/* Separator / Credit bar */}
          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 Jadwal!n SMKN 46 Jakarta. Hak cipta dilindungi undang-undang.</p>
            <p className="font-semibold text-slate-400 hover:text-blue-400 transition-colors">
              Copyright by AtasAtap
            </p>
          </div>

        </div>
      </footer>

      {/* ==========================================
          MODALS VIEWPORT (LOGIN & CUSTOM EDITORS)
          ========================================== */}
      
      {/* 1. LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-fadeIn animate-duration-200">
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <span className="inline-block p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
                <Lock className="h-6 w-6 text-blue-500" />
              </span>
              <h3 className="text-2xl font-bold text-slate-800 font-display">Login Jadwal!n</h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">Gunakan Akun Admin atau Pengurus Kelas yang telah didaftarkan</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama pengguna"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-display">Kata Sandi (Password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-blue-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading.auth}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white font-bold p-3.5 rounded-xl transition-all duration-200 text-xs uppercase tracking-wider shadow"
              >
                {loading.auth ? 'Memvalidasi...' : 'Masuk Akun'}
              </button>
            </form>
            
            <div className="mt-5 text-center text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
              🔑 Pendaftaran pengurus dilakukan oleh Admin. Akun admin pertama dapat dibuat melalui modul pengelolaan database.
            </div>

          </div>
        </div>
      )}

      {/* 2. SQL MIGRATE HELPER SCHEMATIC MODAL */}
      {modalType === 'view-sql' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-800 relative flex flex-col max-h-[85vh] animate-fadeIn text-slate-300">
            
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <span className="p-1 px-3 bg-blue-950 text-blue-400 font-mono text-[10px] uppercase font-bold tracking-widest rounded-lg border border-blue-800">
                Database Integration Helper
              </span>
              <h3 className="text-xl font-bold text-white mt-2 font-display">Daftar Query Migrasi Database SQL</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Jalankan script ini di SQL Editor pada Dashboard Database Anda untuk mendirikan tabel-tabel, role, dan akun admin pertama (<span className="text-blue-400 font-bold font-mono">admin / admin123</span>).
              </p>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-y-auto block font-mono text-xs text-blue-400 select-all max-h-[45vh] h-full scrollbar-thin scrollbar-thumb-slate-800">
              <pre>{supabaseSqlCode || 'Memuat modul migrasi...'}</pre>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Info className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                Dukung integrasi database dengan menyalin script di atas.
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(supabaseSqlCode);
                  showToast('Script SQL disalin ke clipboard!', 'success');
                }}
                className="w-full sm:w-auto p-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs font-display"
              >
                Salin Script SQL
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. CRUD KELAS MODAL */}
      {modalType === 'class' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-fadeIn">
            
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 font-display">
              <Layers className="h-5 w-5 text-blue-500" /> {itemToEdit ? 'Ubah Kelas' : 'Tambah Kelas Baru'}
            </h3>

            <form onSubmit={handleAddKelas} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tingkat</label>
                <select
                  value={formKelas.tingkat}
                  onChange={(e) => setFormKelas({ ...formKelas, tingkat: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-blue-500"
                >
                  <option value="X">Tingkat X</option>
                  <option value="XI">Tingkat XI</option>
                  <option value="XII">Tingkat XII</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jurusan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RPL, TKJ, MM, AN"
                  value={formKelas.jurusan}
                  onChange={(e) => setFormKelas({ ...formKelas, jurusan: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nomor Rombel <span className="text-slate-400 font-normal lowercase">(isi 0 jika tidak ada rombel)</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={20}
                  value={formKelas.nomor_rombel}
                  onChange={(e) => setFormKelas({ ...formKelas, nomor_rombel: Number(e.target.value) })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs uppercase tracking-wider mt-2 transition-all"
              >
                {itemToEdit ? 'Simpan Perubahan' : 'Simpan Kelas'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 4. CRUD PENGURUS MODAL */}
      {modalType === 'pengurus' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-fadeIn">
            
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> {itemToEdit ? 'Ubah Akun Pengurus' : 'Daftarkan Pengurus Baru'}
            </h3>

            <form onSubmit={handleSavePengurus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: pengurus_rpl2"
                  value={formPengurus.username}
                  onChange={(e) => setFormPengurus({ ...formPengurus, username: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {itemToEdit ? 'Password Baru (Opsional — isi jika ingin mereset password)' : 'Kata Sandi (Password)'}
                </label>
                <div className="relative">
                  <input
                    type={showPengurusPassword ? 'text' : 'password'}
                    required={!itemToEdit}
                    placeholder={itemToEdit ? 'Biarkan kosong jika tidak diubah' : 'Minimal 8 karakter'}
                    value={formPengurus.password}
                    onChange={(e) => setFormPengurus({ ...formPengurus, password: e.target.value })}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-blue-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPengurusPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    title={showPengurusPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showPengurusPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Alokasi Kelas Tanggung Jawab</label>
                <select
                  required
                  value={formPengurus.kelas_id}
                  onChange={(e) => setFormPengurus({ ...formPengurus, kelas_id: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-blue-500 bg-white"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {formatKelasNama(cls.nama_lengkap)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-450 mt-1">Satu kelas di SMKN 46 hanya boleh memegang 1 akun pengurus aktif.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs uppercase tracking-wider mt-2 transition-all"
              >
                {itemToEdit ? 'Simpan Perubahan' : 'Buat Akun Pengurus'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 5. CRUD AGENDA MODAL */}
      {modalType === 'agenda' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-fadeIn">
            
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" /> {itemToEdit ? 'Ubah Agenda Kegiatan' : 'Publikasikan Agenda Kegiatan'}
            </h3>

            <form onSubmit={handleSaveAgenda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Judul Agenda</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ujian Tengah Semester Ganjil"
                  value={formAgenda.judul}
                  onChange={(e) => setFormAgenda({ ...formAgenda, judul: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi Kegiatan</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keterangan detail kegiatan di sini..."
                  value={formAgenda.deskripsi}
                  onChange={(e) => setFormAgenda({ ...formAgenda, deskripsi: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mulai Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={formAgenda.tanggal_mulai}
                    onChange={(e) => setFormAgenda({ ...formAgenda, tanggal_mulai: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selesai (Opsional)</label>
                  <input
                    type="date"
                    value={formAgenda.tanggal_selesai}
                    onChange={(e) => setFormAgenda({ ...formAgenda, tanggal_selesai: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lokasi Tempat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lapangan Serbaguna / Aula Utama"
                  value={formAgenda.lokasi}
                  onChange={(e) => setFormAgenda({ ...formAgenda, lokasi: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs uppercase tracking-wider mt-2 transition-all"
              >
                {itemToEdit ? 'Ubah Agenda' : 'Terbitkan Agenda'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 6. CRUD INFO TERKINI MODAL */}
      {modalType === 'info' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-fadeIn">
            
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-rose-500" /> {itemToEdit ? 'Ubah Berita / Pengumuman' : 'Tulis Info Terkini Baru'}
            </h3>

            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Libur Cuti Bersama Idul Fitri"
                  value={formInfo.judul}
                  onChange={(e) => setFormInfo({ ...formInfo, judul: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Isi Berita / Konten</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Ketik seluruh isi pengumuman lengkap Anda untuk dibaca siswa..."
                  value={formInfo.isi_konten}
                  onChange={(e) => setFormInfo({ ...formInfo, isi_konten: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs uppercase tracking-wider mt-2 transition-all"
              >
                {itemToEdit ? 'Simpan Perubahan' : 'Sebarkan Pengumuman'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 7. CRUD JADWAL PELAJARAN MODAL */}
      {modalType === 'schedule' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-fadeIn">
            
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" /> {itemToEdit ? 'Ubah Jam Pelajaran' : 'Tambah Jam Pelajaran Baru'}
            </h3>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hari Pelajaran</label>
                <select
                  value={formSchedule.hari}
                  onChange={(e) => setFormSchedule({ ...formSchedule, hari: e.target.value as any })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-blue-500"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={formSchedule.jam_mulai}
                    onChange={(e) => setFormSchedule({ ...formSchedule, jam_mulai: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={formSchedule.jam_selesai}
                    onChange={(e) => setFormSchedule({ ...formSchedule, jam_selesai: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemrograman Sistem Web (React)"
                  value={formSchedule.mata_pelajaran}
                  onChange={(e) => setFormSchedule({ ...formSchedule, mata_pelajaran: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Guru Pengajar (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Budi, S.Kom."
                  value={formSchedule.nama_guru}
                  onChange={(e) => setFormSchedule({ ...formSchedule, nama_guru: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs uppercase tracking-wider mt-2 transition-all"
              >
                Simpan Jam Pelajaran
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 8. CUSTOM INTEGRATED CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-50 mb-4">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              
              <h3 className="text-lg font-black text-slate-800 mb-2 font-display">
                {confirmModal.title}
              </h3>
              
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-full p-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold p-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
