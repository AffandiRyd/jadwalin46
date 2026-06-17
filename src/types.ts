/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Kelas {
  id: string;
  tingkat: string;
  jurusan: string;
  nomor_rombel: number;
  nama_lengkap: string;
  created_at?: string;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'pengurus';
  kelas_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  role: 'admin' | 'pengurus';
  kelas_id?: string | null;
  kelas_nama?: string; // Optional full name of associated class
}

export interface Agenda {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  lokasi: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InfoTerkini {
  id: string;
  judul: string;
  isi_konten: string;
  gambar_url?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JadwalPelajaran {
  id: string;
  kelas_id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  jam_mulai: string; // format HH:MM
  jam_selesai: string; // format HH:MM
  mata_pelajaran: string;
  nama_guru?: string;
  created_at?: string;
  updated_at?: string;
}
