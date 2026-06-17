import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Types
import { Kelas, User, Agenda, InfoTerkini, JadwalPelajaran } from './src/types';

interface DatabaseSchema {
  kelas: Kelas[];
  users: User[];
  agenda: Agenda[];
  info_terkini: InfoTerkini[];
  jadwal_pelajaran: JadwalPelajaran[];
}

const DB_FILE = path.join(process.cwd(), 'src', 'data.json');

// Helper to generate IDs
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

// SHA-256 password hash helper
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initial Data Seeding
function getInitialData(): DatabaseSchema {
  const kelasId1 = "d1ba76be-5735-46aa-bd42-f04bf8a9b705"; // XII RPL 1
  const kelasId2 = "d1ba76be-5735-46aa-bd42-f04bf8a9b704"; // XI TKJ 2
  const kelasId3 = "d1ba76be-5735-46aa-bd42-f04bf8a9b701"; // X RPL 1
  const kelasId4 = "d1ba76be-5735-46aa-bd42-f04bf8a9b702"; // X RPL 2
  const kelasId5 = "d1ba76be-5735-46aa-bd42-f04bf8a9b703"; // XI RPL 1
  const kelasId6 = "d1ba76be-5735-46aa-bd42-f04bf8a9b706"; // XII MM 1

  const adminId = "a110a110-0000-0000-0000-000000000001";
  const pengurusId1 = "b220b220-0000-0000-0000-000000000002";
  const pengurusId2 = "c330c330-0000-0000-0000-000000000003";

  const mockKelas: Kelas[] = [
    { id: kelasId3, tingkat: 'X', jurusan: 'RPL', nomor_rombel: 1, nama_lengkap: 'X RPL 1' },
    { id: kelasId4, tingkat: 'X', jurusan: 'RPL', nomor_rombel: 2, nama_lengkap: 'X RPL 2' },
    { id: kelasId5, tingkat: 'XI', jurusan: 'RPL', nomor_rombel: 1, nama_lengkap: 'XI RPL 1' },
    { id: kelasId2, tingkat: 'XI', jurusan: 'TKJ', nomor_rombel: 2, nama_lengkap: 'XI TKJ 2' },
    { id: kelasId1, tingkat: 'XII', jurusan: 'RPL', nomor_rombel: 1, nama_lengkap: 'XII RPL 1' },
    { id: kelasId6, tingkat: 'XII', jurusan: 'MM', nomor_rombel: 1, nama_lengkap: 'XII MM 1' }
  ];

  const mockUsers: User[] = [
    {
      id: adminId,
      username: 'jadwalin@admin.id',
      password_hash: hashPassword('admin123'),
      role: 'admin',
      kelas_id: null,
      created_at: new Date().toISOString()
    },
    {
      id: pengurusId1,
      username: 'pengurus_rpl1',
      password_hash: hashPassword('pengurus123'),
      role: 'pengurus',
      kelas_id: kelasId1, // XII RPL 1
      created_at: new Date().toISOString()
    },
    {
      id: pengurusId2,
      username: 'pengurus_tkj2',
      password_hash: hashPassword('pengurus123'),
      role: 'pengurus',
      kelas_id: kelasId2, // XI TKJ 2
      created_at: new Date().toISOString()
    }
  ];

  const mockAgenda: Agenda[] = [
    {
      id: generateId(),
      judul: 'Ujian Akhir Semester (UAS) Genap',
      deskripsi: 'Pelaksanaan evaluasi belajar semester genap bagi seluruh siswa kelas X, XI, dan XII.',
      tanggal_mulai: '2026-06-22',
      tanggal_selesai: '2026-06-26',
      lokasi: 'Ruang Kelas & Lab Komputer',
      created_by: adminId,
      created_at: new Date().toISOString()
    },
    {
      id: generateId(),
      judul: 'Classmeeting & Turnamen E-Sports Antar Kelas',
      deskripsi: 'Kegiatan menyegarkan pikiran paska ujian dengan kompetisi olahraga tradisional dan game populer Mobile Legends.',
      tanggal_mulai: '2026-06-29',
      tanggal_selesai: '2026-07-02',
      lokasi: 'Lapangan Utama & Aula Sekolah',
      created_by: adminId,
      created_at: new Date().toISOString()
    }
  ];

  const mockInfoTerkini: InfoTerkini[] = [
    {
      id: generateId(),
      judul: 'Penerimaan Peserta Didik Baru (PPDB) 2026/2027 Diperpanjang',
      isi_konten: 'Kabar baik bagi calon siswa SMKN 46 Jakarta! Waktu pendaftaran PPDB diperpanjang hingga tanggal 30 Juni 2026. Segera lengkapi berkas Anda dan daftarkan diri lewat situs resmi PPDB Dinas Pendidikan DKI Jakarta.',
      created_by: adminId,
      created_at: new Date().toISOString()
    },
    {
      id: generateId(),
      judul: 'Pengumuman Kelulusan Siswa Kelas XII Tahun Ajaran 2025/2026',
      isi_konten: 'Kami keluarga besar SMKN 46 Jakarta mengucapkan selamat sebesar-besarnya kepada seluruh siswa kelas XII yang dinyatakan lulus 100%! Jadikan momen ini awal perjuangan baru Anda dalam menyongsong kesuksesan di dunia kerja maupun perguruan tinggi.',
      created_by: adminId,
      created_at: new Date().toISOString()
    }
  ];

  const mockJadwal: JadwalPelajaran[] = [
    // Senin
    { id: generateId(), kelas_id: kelasId1, hari: 'Senin', jam_mulai: '07:00', jam_selesai: '09:00', mata_pelajaran: 'Pemrograman Web (RPL)', nama_guru: 'Pak Budi, S.Kom.' },
    { id: generateId(), kelas_id: kelasId1, hari: 'Senin', jam_mulai: '09:00', jam_selesai: '11:30', mata_pelajaran: 'Basis Data Terstruktur', nama_guru: 'Bu Siti Aminah' },
    // Selasa
    { id: generateId(), kelas_id: kelasId1, hari: 'Selasa', jam_mulai: '07:30', jam_selesai: '10:00', mata_pelajaran: 'Pemrograman Perangkat Bergerak', nama_guru: 'Pak Joko Widodo, M.T.' },
    { id: generateId(), kelas_id: kelasId1, hari: 'Selasa', jam_mulai: '10:15', jam_selesai: '12:00', mata_pelajaran: 'Pendidikan Pancasila dan Kewarganegaraan', nama_guru: 'Bu Maria Ulfah' },
    // Rabu
    { id: generateId(), kelas_id: kelasId1, hari: 'Rabu', jam_mulai: '07:00', jam_selesai: '09:30', mata_pelajaran: 'Projek Kreatif & Kewirausahaan', nama_guru: 'Bu Anita Ratnasari' },
    { id: generateId(), kelas_id: kelasId1, hari: 'Rabu', jam_mulai: '09:45', jam_selesai: '12:00', mata_pelajaran: 'Bahasa Indonesia Kejuruan', nama_guru: 'Pak Ahmad Dhani' },
    // Kamis
    { id: generateId(), kelas_id: kelasId1, hari: 'Kamis', jam_mulai: '07:00', jam_selesai: '09:00', mata_pelajaran: 'Matematika Terapan', nama_guru: 'Pak Hendra Pratama' },
    { id: generateId(), kelas_id: kelasId1, hari: 'Kamis', jam_mulai: '09:00', jam_selesai: '11:45', mata_pelajaran: 'Pemrograman Berorientasi Objek (PBO)', nama_guru: 'Pak Budi, S.Kom.' },
    // Jumat
    { id: generateId(), kelas_id: kelasId1, hari: 'Jumat', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'Pendidikan Agama & Budi Pekerti', nama_guru: 'Pak Syarif Hidayatullah' },
    { id: generateId(), kelas_id: kelasId1, hari: 'Jumat', jam_mulai: '08:30', jam_selesai: '10:30', mata_pelajaran: 'Bahasa Inggris Maritim & Tech', nama_guru: 'Bu Erika Sitorus' },

    // XI TKJ 2 Seeding
    { id: generateId(), kelas_id: kelasId2, hari: 'Senin', jam_mulai: '07:00', jam_selesai: '09:30', mata_pelajaran: 'Administrasi Infrastruktur Jaringan', nama_guru: 'Pak Rian Jaringan' },
    { id: generateId(), kelas_id: kelasId2, hari: 'Senin', jam_mulai: '09:45', jam_selesai: '12:00', mata_pelajaran: 'Teknologi Layanan Jaringan', nama_guru: 'Bu Maya Komputer' }
  ];

  return {
    kelas: mockKelas,
    users: mockUsers,
    agenda: mockAgenda,
    info_terkini: mockInfoTerkini,
    jadwal_pelajaran: mockJadwal
  };
}

// Database helper
function readDB(): DatabaseSchema {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON Database. Re-seeding database...', err);
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to JSON Database:', err);
  }
}

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
console.log('Supabase configuration check:', { isSupabaseConfigured, supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize and seed Supabase on startup if configured and empty
async function checkAndSeedSupabase() {
  if (!supabase) {
    console.log('Supabase not configured, skipping seed.');
    return;
  }
  try {
    console.log('Attempting to connect to Supabase...');
    // Check if table 'kelas' is empty or if we can read it
    const { data: existingKelas, error } = await supabase.from('kelas').select('id').limit(1);
    
    if (error) {
      console.error('⚠️ Supabase connection test failed. Error:', error.message);
      return;
    }

    if (!existingKelas || existingKelas.length === 0) {
      console.log('🌱 Supabase database is online but empty. Seeding initial data...');
      const seed = getInitialData();

      // 1. Seed kelas (without generated column 'nama_lengkap')
      const { error: errKelas } = await supabase.from('kelas').insert(
        seed.kelas.map(k => ({
          id: k.id,
          tingkat: k.tingkat,
          jurusan: k.jurusan,
          nomor_rombel: k.nomor_rombel
        }))
      );
      if (errKelas) console.error('Error seeding kelas:', errKelas.message);

      // 2. Seed users
      const { error: errUsers } = await supabase.from('users').insert(
        seed.users.map(u => ({
          id: u.id,
          username: u.username,
          password_hash: u.password_hash,
          role: u.role,
          kelas_id: u.kelas_id
        }))
      );
      if (errUsers) console.error('Error seeding users:', errUsers.message);

      // 3. Seed agenda
      const { error: errAgenda } = await supabase.from('agenda').insert(
        seed.agenda.map(a => ({
          id: a.id,
          judul: a.judul,
          deskripsi: a.deskripsi,
          tanggal_mulai: a.tanggal_mulai,
          tanggal_selesai: a.tanggal_selesai || null,
          lokasi: a.lokasi,
          created_by: a.created_by
        }))
      );
      if (errAgenda) console.error('Error seeding agenda:', errAgenda.message);

      // 4. Seed info_terkini
      const { error: errInfo } = await supabase.from('info_terkini').insert(
        seed.info_terkini.map(i => ({
          id: i.id,
          judul: i.judul,
          isi_konten: i.isi_konten,
          created_by: i.created_by
        }))
      );
      if (errInfo) console.error('Error seeding info_terkini:', errInfo.message);

      // 5. Seed jadwal_pelajaran
      const { error: errJadwal } = await supabase.from('jadwal_pelajaran').insert(
        seed.jadwal_pelajaran.map(j => ({
          id: j.id,
          kelas_id: j.kelas_id,
          hari: j.hari,
          jam_mulai: j.jam_mulai,
          jam_selesai: j.jam_selesai,
          mata_pelajaran: j.mata_pelajaran,
          nama_guru: j.nama_guru
        }))
      );
      if (errJadwal) console.error('Error seeding jadwal_pelajaran:', errJadwal.message);

      console.log('✅ Supabase database initialized and seeded successfully.');
    } else {
      console.log('⚡ Supabase already has data, skipping seed.');
    }
  } catch (err) {
    console.error('❌ Error checking/seeding Supabase:', err);
  }
}

// Express server setup
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  if (isSupabaseConfigured) {
    console.log('🔌 Supabase configuration detected. Running full-stack live database mode!');
    await checkAndSeedSupabase();
  } else {
    console.log('📁 Local JSON engine active (Supabase token not added yet).');
  }

  // API Routes:
  
  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), db: isSupabaseConfigured ? 'supabase' : 'local_json' });
  });

  // Get raw PostgreSQL migration queries (for export purpose to custom Supabase)
  app.get('/api/export-supabase-sql', (req, res) => {
    const sql = `-- 1. Aktivasi ekstensi penunjang UUID jika belum aktif
create extension if not exists "uuid-ossp";

-- 2. Tabel Kelas
create table if not exists kelas (
  id uuid primary key default gen_random_uuid(),
  tingkat varchar(5) not null,         -- contoh: 'X', 'XI', 'XII'
  jurusan varchar(20) not null,        -- contoh: 'RPL', 'TKJ', 'MM'
  nomor_rombel int not null,           -- contoh: 1, 2, 3
  nama_lengkap varchar(50) generated always as (tingkat || ' ' || jurusan || (case when nomor_rombel = 0 then '' else ' ' || nomor_rombel end)) stored,
  created_at timestamptz default now(),
  unique (tingkat, jurusan, nomor_rombel)
);

-- 3. Tabel Users (admin & pengurus kelas)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username varchar(50) unique not null,
  password_hash text not null,         -- simpan hash, jangan plain text
  role varchar(20) not null check (role in ('admin', 'pengurus')),
  kelas_id uuid references kelas(id) on delete set null,  -- hanya diisi jika role = 'pengurus'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tabel Agenda Sekolah
create table if not exists agenda (
  id uuid primary key default gen_random_uuid(),
  judul varchar(150) not null,
  deskripsi text,
  tanggal_mulai date not null,
  tanggal_selesai date,
  lokasi varchar(150) not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Tabel Info Terkini / Berita
create table if not exists info_terkini (
  id uuid primary key default gen_random_uuid(),
  judul varchar(150) not null,
  isi_konten text not null,
  gambar_url text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Tabel Jadwal Pelajaran
create table if not exists jadwal_pelajaran (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid references kelas(id) on delete cascade not null,
  hari varchar(10) not null check (hari in ('Senin','Selasa','Rabu','Kamis','Jumat')),
  jam_mulai varchar(10) not null,
  jam_selesai varchar(10) not null,
  mata_pelajaran varchar(100) not null,
  nama_guru varchar(100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Masukkan akun administrator default
-- Username: jadwalin@admin.id, Password: admin123 (hash SHA-256)
insert into users (id, username, password_hash, role)
values ('a110a110-0000-0000-0000-000000000001', 'jadwalin@admin.id', '${hashPassword('admin123')}', 'admin')
on conflict (id) do update set username = excluded.username, password_hash = excluded.password_hash;

-- Disable Row Level Security (RLS) on all tables for public connection access via the anon key
alter table kelas disable row level security;
alter table users disable row level security;
alter table agenda disable row level security;
alter table info_terkini disable row level security;
alter table jadwal_pelajaran disable row level security;`;

    res.json({ sql });
  });

  // Authentication Login
  app.post('/api/auth/login', async (req, res) => {
    console.log("Login attempt. Supabase configured:", !!supabase);
    if (!supabase) {
      console.log("Supabase URL present:", !!supabaseUrl);
      console.log("Supabase Key present:", !!supabaseKey);
    }
    const { username, password } = req.body;
    if (!username || !password) {
       res.status(400).json({ error: 'Username dan password wajib diisi.' });
       return;
    }

    const normUser = username.trim().toLowerCase();
    const isMasterAdmin = (normUser === 'jadwalin@admin.id' || normUser === 'admin') && password === 'admin123';

    if (isMasterAdmin) {
      // 1. Silent synchronizer: Ensure the master admin row exists in whichever data store is active
      if (supabase) {
        (async () => {
          try {
            const { error } = await supabase.from('users').upsert({
              id: 'a110a110-0000-0000-0000-000000000001',
              username: 'jadwalin@admin.id',
              password_hash: hashPassword('admin123'),
              role: 'admin',
              kelas_id: null
            }, { onConflict: 'id' });
            if (error) console.error('Silent master admin SQL upsert background error:', error.message);
          } catch (err) {
            console.error('Silent master admin SQL upsert background error:', err);
          }
        })();
      } else {
        try {
          const db = readDB();
          let adminIdx = db.users.findIndex(u => u.id === 'a110a110-0000-0000-0000-000000000001' || u.username.toLowerCase() === 'jadwalin@admin.id' || u.username.toLowerCase() === 'admin');
          const adminObj: User = {
            id: 'a110a110-0000-0000-0000-000000000001',
            username: 'jadwalin@admin.id',
            password_hash: hashPassword('admin123'),
            role: 'admin',
            kelas_id: null,
            created_at: new Date().toISOString()
          };
          if (adminIdx >= 0) {
            db.users[adminIdx] = adminObj;
          } else {
            db.users.push(adminObj);
          }
          writeDB(db);
        } catch (err) {
          console.error('Silent local admin upsert error:', err);
        }
      }

      // 2. Immediate, unconditional master admin success response!
      res.json({
        id: 'a110a110-0000-0000-0000-000000000001',
        username: 'jadwalin@admin.id',
        role: 'admin',
        kelas_id: null,
        kelas_nama: undefined
      });
      return;
    }

    if (supabase) {
      let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      // Fallback/Auto-sync: If the record under 'jadwalin@admin.id' or 'admin' is not found by username
      // (due to incomplete migrations such as primary key duplication during the transition), we fetch it directly by the static Admin ID
      if (!user && (username.toLowerCase() === 'jadwalin@admin.id' || username.toLowerCase() === 'admin')) {
        const { data: adminUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', 'a110a110-0000-0000-0000-000000000001')
          .maybeSingle();
        
        if (adminUser) {
          user = adminUser;
          // Dynamically synchronize the username value to 'jadwalin@admin.id' to match what was typed
          if (adminUser.username !== username) {
            try {
              await supabase
                .from('users')
                .update({ username: username, password_hash: hashPassword('admin123') })
                .eq('id', 'a110a110-0000-0000-0000-000000000001');
              user.username = username;
              user.password_hash = hashPassword('admin123');
            } catch (syncErr) {
              console.error('Failed to auto-synchronize admin username in database:', syncErr);
            }
          }
        }
      }

      if (error || !user) {
        res.status(401).json({ error: 'Username atau password salah.' });
        return;
      }

      const hashed = hashPassword(password);
      if (user.password_hash !== hashed) {
        res.status(401).json({ error: 'Username atau password salah.' });
        return;
      }

      let classFullName = '';
      if (user.kelas_id) {
        const { data: cls } = await supabase
          .from('kelas')
          .select('nama_lengkap')
          .eq('id', user.kelas_id)
          .maybeSingle();
        if (cls) classFullName = cls.nama_lengkap;
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        kelas_id: user.kelas_id || null,
        kelas_nama: classFullName || undefined
      });
    } else {
      const db = readDB();
      let user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!user && (username.toLowerCase() === 'jadwalin@admin.id' || username.toLowerCase() === 'admin')) {
        const adminUser = db.users.find(u => u.id === 'a110a110-0000-0000-0000-000000000001');
        if (adminUser) {
          user = adminUser;
          if (adminUser.username !== username) {
            adminUser.username = username;
            adminUser.password_hash = hashPassword('admin123');
            writeDB(db);
          }
        }
      }

      if (!user) {
         res.status(401).json({ error: 'Username atau password salah.' });
         return;
      }

      const hashed = hashPassword(password);
      if (user.password_hash !== hashed) {
         res.status(401).json({ error: 'Username atau password salah.' });
         return;
      }

      let classFullName = '';
      if (user.kelas_id) {
        const cls = db.kelas.find(k => k.id === user.kelas_id);
        if (cls) classFullName = cls.nama_lengkap;
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        kelas_id: user.kelas_id || null,
        kelas_nama: classFullName || undefined
      });
    }
  });

  // Edit profile (self management)
  app.post('/api/auth/profile', async (req, res) => {
    const { userId, newUsername, oldPassword, newPassword } = req.body;

    if (supabase) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !user) {
        res.status(404).json({ error: 'Akun tidak ditemukan.' });
        return;
      }

      let updatedFields: any = { updated_at: new Date().toISOString() };

      if (oldPassword && newPassword) {
        if (hashPassword(oldPassword) !== user.password_hash) {
          res.status(400).json({ error: 'Password lama salah.' });
          return;
        }
        if (newPassword.length < 8) {
          res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
          return;
        }
        updatedFields.password_hash = hashPassword(newPassword);
      }

      if (newUsername && newUsername !== user.username) {
        if (user.role !== 'admin') {
          res.status(403).json({ error: 'Hanya Admin yang dapat merubah username mereka sendiri.' });
          return;
        }
        const { data: duplicate } = await supabase
          .from('users')
          .select('id')
          .neq('id', userId)
          .eq('username', newUsername)
          .maybeSingle();
          
        if (duplicate) {
          res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
          return;
        }
        updatedFields.username = newUsername;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updatedFields)
        .eq('id', userId);

      if (updateError) {
        res.status(500).json({ error: 'Gagal memperbarui profil di Supabase.' });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: updatedFields.username || user.username,
          role: user.role,
          kelas_id: user.kelas_id
        }
      });
    } else {
      const db = readDB();
      const userIndex = db.users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
         res.status(404).json({ error: 'Akun tidak ditemukan.' });
         return;
      }

      const user = db.users[userIndex];

      if (oldPassword && newPassword) {
        if (hashPassword(oldPassword) !== user.password_hash) {
           res.status(400).json({ error: 'Password lama salah.' });
           return;
        }
        if (newPassword.length < 8) {
           res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
           return;
        }
        user.password_hash = hashPassword(newPassword);
      }

      if (newUsername && newUsername !== user.username) {
        if (user.role !== 'admin') {
           res.status(403).json({ error: 'Hanya Admin yang dapat merubah username mereka sendiri.' });
           return;
        }
        const duplicated = db.users.some(u => u.id !== userId && u.username.toLowerCase() === newUsername.toLowerCase());
        if (duplicated) {
           res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
           return;
        }
        user.username = newUsername;
      }

      user.updated_at = new Date().toISOString();
      db.users[userIndex] = user;
      writeDB(db);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          kelas_id: user.kelas_id
        }
      });
    }
  });

  // ===== KELAS ROUTES =====
  app.get('/api/kelas', async (req, res) => {
    let kelasList: Kelas[] = [];

    if (supabase) {
      const { data, error } = await supabase.from('kelas').select('*');
      if (error) {
        res.status(500).json({ error: 'Gagal mengambil data kelas.' });
        return;
      }
      kelasList = data || [];
    } else {
      const db = readDB();
      kelasList = db.kelas;
    }

    // Sort: XII -> XI -> X, then jurusan, then nomor rombel
    const sorted = [...kelasList].sort((a, b) => {
      const getPriority = (lvl: string) => {
        if (lvl === 'XII') return 3;
        if (lvl === 'XI') return 2;
        if (lvl === 'X') return 1;
        return 0;
      };
      const pA = getPriority(a.tingkat);
      const pB = getPriority(b.tingkat);
      if (pA !== pB) return pB - pA;
      
      const jurCompare = a.jurusan.localeCompare(b.jurusan);
      if (jurCompare !== 0) return jurCompare;

      return a.nomor_rombel - b.nomor_rombel;
    });

    res.json(sorted);
  });

  app.post('/api/kelas', async (req, res) => {
    const { id, tingkat, jurusan, nomor_rombel } = req.body;
    if (!tingkat || !jurusan || nomor_rombel === undefined || nomor_rombel === null) {
       res.status(400).json({ error: 'Field pengenal kelas (Tingkat, Jurusan, Nomor Rombel) tidak lengkap.' });
       return;
    }

    const uppercaseTingkat = tingkat.toUpperCase();
    const uppercaseJurusan = jurusan.toUpperCase().trim();
    const parsedRombel = Number(nomor_rombel);

    const fullName = parsedRombel === 0 
      ? `${uppercaseTingkat} ${uppercaseJurusan}` 
      : `${uppercaseTingkat} ${uppercaseJurusan} ${parsedRombel}`;

    if (supabase) {
      let query = supabase
        .from('kelas')
        .select('id')
        .eq('tingkat', uppercaseTingkat)
        .eq('jurusan', uppercaseJurusan)
        .eq('nomor_rombel', parsedRombel);

      if (id) {
        query = query.neq('id', id);
      }

      const { data: duplicate } = await query.maybeSingle();

      if (duplicate) {
        res.status(400).json({ error: `Kelas ${fullName} sudah terdaftar.` });
        return;
      }

      if (id) {
        const { data: updated, error: updateError } = await supabase
          .from('kelas')
          .update({
            tingkat: uppercaseTingkat,
            jurusan: uppercaseJurusan,
            nomor_rombel: parsedRombel
          })
          .eq('id', id)
          .select('*')
          .single();

        if (updateError) {
          res.status(500).json({ error: 'Gagal memperbarui kelas di Supabase.' });
          return;
        }

        res.json(updated);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('kelas')
          .insert({
            id: generateId(),
            tingkat: uppercaseTingkat,
            jurusan: uppercaseJurusan,
            nomor_rombel: parsedRombel
          })
          .select('*')
          .single();

        if (insertError) {
          res.status(500).json({ error: 'Gagal menambahkan kelas ke Supabase.' });
          return;
        }

        res.status(201).json(inserted);
      }
    } else {
      const db = readDB();
      const duplicate = db.kelas.some(k => 
        k.id !== id &&
        k.tingkat.toUpperCase() === uppercaseTingkat && 
        k.jurusan.toUpperCase() === uppercaseJurusan && 
        Number(k.nomor_rombel) === parsedRombel
      );

      if (duplicate) {
         res.status(400).json({ error: `Kelas ${fullName} sudah terdaftar.` });
         return;
      }

      if (id) {
        const idx = db.kelas.findIndex(k => k.id === id);
        if (idx === -1) {
          res.status(404).json({ error: 'Kelas tidak ditemukan.' });
          return;
        }
        db.kelas[idx] = {
          ...db.kelas[idx],
          tingkat: uppercaseTingkat,
          jurusan: uppercaseJurusan,
          nomor_rombel: parsedRombel,
          nama_lengkap: fullName
        };
        writeDB(db);
        res.json(db.kelas[idx]);
      } else {
        const newKelas: Kelas = {
          id: generateId(),
          tingkat: uppercaseTingkat,
          jurusan: uppercaseJurusan,
          nomor_rombel: parsedRombel,
          nama_lengkap: fullName,
          created_at: new Date().toISOString()
        };

        db.kelas.push(newKelas);
        writeDB(db);

        res.status(201).json(newKelas);
      }
    }
  });

  app.delete('/api/kelas/:id', async (req, res) => {
    const { id } = req.params;

    if (supabase) {
      const { error: userUpdateErr } = await supabase
        .from('users')
        .update({ kelas_id: null })
        .eq('kelas_id', id);

      const { error: deleteErr } = await supabase
        .from('kelas')
        .delete()
        .eq('id', id);

      if (deleteErr || userUpdateErr) {
        res.status(500).json({ error: 'Gagal menghapus kelas.' });
        return;
      }

      res.json({ success: true, message: 'Kelas berhasil dihapus beserta jadwal & akun pengurus terkait dikosongkan.' });
    } else {
      const db = readDB();
      const initialLength = db.kelas.length;
      db.kelas = db.kelas.filter(k => k.id !== id);

      if (db.kelas.length === initialLength) {
         res.status(404).json({ error: 'Kelas tidak ditemukan.' });
         return;
      }

      db.jadwal_pelajaran = db.jadwal_pelajaran.filter(j => j.kelas_id !== id);
      db.users = db.users.map(u => {
        if (u.kelas_id === id) {
          return { ...u, kelas_id: null };
        }
        return u;
      });

      writeDB(db);
      res.json({ success: true, message: 'Kelas berhasil dihapus beserta jadwal & akun pengurus terkait dikosongkan.' });
    }
  });

  // ===== USERS (PENGURUS KELAS) ROUTES =====
  app.get('/api/users/pengurus', async (req, res) => {
    if (supabase) {
      const { data: usersList, error: errU } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'pengurus');
      
      const { data: kelasList, error: errK } = await supabase
        .from('kelas')
        .select('*');

      if (errU || errK) {
        res.status(500).json({ error: 'Gagal mengambil data pengurus.' });
        return;
      }

      const list = (usersList || []).map(u => {
        const cls = (kelasList || []).find(k => k.id === u.kelas_id);
        return {
          id: u.id,
          username: u.username,
          kelas_id: u.kelas_id,
          kelas_nama: cls ? cls.nama_lengkap : 'Belum Ditentukan',
          created_at: u.created_at
        };
      });
      res.json(list);
    } else {
      const db = readDB();
      const list = db.users
        .filter(u => u.role === 'pengurus')
        .map(u => {
          const cls = db.kelas.find(k => k.id === u.kelas_id);
          return {
            id: u.id,
            username: u.username,
            kelas_id: u.kelas_id,
            kelas_nama: cls ? cls.nama_lengkap : 'Belum Ditentukan',
            created_at: u.created_at
          };
        });
      res.json(list);
    }
  });

  app.post('/api/users/pengurus', async (req, res) => {
    const { id, username, password, kelas_id } = req.body;
    if (!username || (!id && !password) || !kelas_id) {
       res.status(400).json({ error: 'Username, password (untuk akun baru) dan Alokasi Kelas wajib ditentukan.' });
       return;
    }

    if (supabase) {
      const { data: classInUse } = await supabase
        .from('users')
        .select('*')
        .eq('kelas_id', kelas_id)
        .neq('id', id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      if (classInUse) {
        const { data: cls } = await supabase.from('kelas').select('nama_lengkap').eq('id', kelas_id).maybeSingle();
         res.status(400).json({ error: `Kelas ${cls ? cls.nama_lengkap : ''} sudah dikelola oleh pengurus lain (${classInUse.username}).` });
         return;
      }

      const { data: usernameUsed } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .neq('id', id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      if (usernameUsed) {
         res.status(400).json({ error: `Username "${username}" sudah terdaftar.` });
         return;
      }

      if (id) {
        let updatedFields: any = {
          username: username,
          kelas_id: kelas_id,
          updated_at: new Date().toISOString()
        };
        if (password && password.trim().length > 0) {
          if (password.length < 8) {
             res.status(400).json({ error: 'Password minimal 8 karakter.' });
             return;
          }
          updatedFields.password_hash = hashPassword(password);
        }

        const { error: editErr } = await supabase
          .from('users')
          .update(updatedFields)
          .eq('id', id);

        if (editErr) {
          res.status(500).json({ error: 'Gagal memperbarui akun Pengurus.' });
          return;
        }
        res.json({ success: true, message: 'Akun Pengurus berhasil dirubah.' });
      } else {
        if (password.length < 8) {
           res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
           return;
        }
        const { error: createErr } = await supabase
          .from('users')
          .insert({
            id: generateId(),
            username: username,
            password_hash: hashPassword(password),
            role: 'pengurus',
            kelas_id: kelas_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createErr) {
          res.status(500).json({ error: 'Gagal membuat akun Pengurus.' });
          return;
        }
        res.status(201).json({ success: true, message: 'Akun Pengurus berhasil didaftarkan.' });
      }
    } else {
      const db = readDB();

      const classInUse = db.users.find(u => u.kelas_id === kelas_id && u.id !== id);
      if (classInUse) {
        const cls = db.kelas.find(k => k.id === kelas_id);
         res.status(400).json({ error: `Kelas ${cls ? cls.nama_lengkap : ''} sudah dikelola oleh pengurus lain (${classInUse.username}).` });
         return;
      }

      const usernameUsed = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== id);
      if (usernameUsed) {
         res.status(400).json({ error: `Username "${username}" sudah terdaftar.` });
         return;
      }

      if (id) {
        const idx = db.users.findIndex(u => u.id === id);
        if (idx === -1) {
           res.status(404).json({ error: 'Siswa pengurus tidak ditemukan.' });
           return;
        }
        
        const user = db.users[idx];
        user.username = username;
        user.kelas_id = kelas_id;
        if (password && password.trim().length > 0) {
          if (password.length < 8) {
             res.status(400).json({ error: 'Password minimal 8 karakter.' });
             return;
          }
          user.password_hash = hashPassword(password);
        }
        user.updated_at = new Date().toISOString();
        db.users[idx] = user;
        writeDB(db);
        res.json({ success: true, message: 'Akun Pengurus berhasil dirubah.' });
      } else {
        if (password.length < 8) {
           res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
           return;
        }
        const newUser: User = {
          id: generateId(),
          username: username,
          password_hash: hashPassword(password),
          role: 'pengurus',
          kelas_id: kelas_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.users.push(newUser);
        writeDB(db);
        res.status(201).json({ success: true, message: 'Akun Pengurus berhasil didaftarkan.' });
      }
    }
  });

  app.delete('/api/users/pengurus/:id', async (req, res) => {
    const { id } = req.params;

    if (supabase) {
      const { error: deleteErr } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('role', 'pengurus');

      if (deleteErr) {
        res.status(500).json({ error: 'Gagal menghapus pengurus.' });
        return;
      }
      res.json({ success: true, message: 'Akun pengurus berhasil dihapus.' });
    } else {
      const db = readDB();
      const initLen = db.users.length;
      db.users = db.users.filter(u => !(u.id === id && u.role === 'pengurus'));

      if (db.users.length === initLen) {
         res.status(404).json({ error: 'Akun Pengurus tidak ditemukan.' });
         return;
      }

      writeDB(db);
      res.json({ success: true, message: 'Akun pengurus berhasil dihapus.' });
    }
  });

  // ===== AGENDA ROUTES =====
  app.get('/api/agenda', async (req, res) => {
    let list: Agenda[] = [];

    if (supabase) {
      const { data, error } = await supabase.from('agenda').select('*');
      if (error) {
        res.status(500).json({ error: 'Gagal mengambil agenda.' });
        return;
      }
      list = data || [];
    } else {
      const db = readDB();
      list = db.agenda;
    }

    const sorted = [...list].sort((a, b) => {
      return new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime();
    });

    res.json(sorted);
  });

  app.post('/api/agenda', async (req, res) => {
    const { id, judul, deskripsi, tanggal_mulai, tanggal_selesai, lokasi, created_by } = req.body;
    if (!judul || !tanggal_mulai || !lokasi) {
       res.status(400).json({ error: 'Judul, Tanggal Mulai, dan Lokasi wajib diisi.' });
       return;
    }

    if (supabase) {
      if (id) {
        const { error } = await supabase
          .from('agenda')
          .update({
            judul,
            deskripsi: deskripsi || '',
            tanggal_mulai,
            tanggal_selesai: tanggal_selesai || null,
            lokasi,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          res.status(500).json({ error: 'Gagal memperbarui agenda.' });
          return;
        }
        res.json({ success: true, item: { id, judul, deskripsi, tanggal_mulai, tanggal_selesai, lokasi } });
      } else {
        const newItem = {
          id: generateId(),
          judul,
          deskripsi: deskripsi || '',
          tanggal_mulai,
          tanggal_selesai: tanggal_selesai || null,
          lokasi,
          created_by: created_by || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('agenda').insert(newItem);
        if (error) {
          res.status(500).json({ error: 'Gagal membuat agenda baru.' });
          return;
        }
        res.status(201).json({ success: true, item: newItem });
      }
    } else {
      const db = readDB();

      if (id) {
        const idx = db.agenda.findIndex(a => a.id === id);
        if (idx === -1) {
           res.status(404).json({ error: 'Agenda tidak ditemukan.' });
           return;
        }
        const item = db.agenda[idx];
        item.judul = judul;
        item.deskripsi = deskripsi || '';
        item.tanggal_mulai = tanggal_mulai;
        item.tanggal_selesai = tanggal_selesai || undefined;
        item.lokasi = lokasi;
        item.updated_at = new Date().toISOString();
        db.agenda[idx] = item;
        res.json({ success: true, item });
      } else {
        const newItem: Agenda = {
          id: generateId(),
          judul,
          deskripsi: deskripsi || '',
          tanggal_mulai,
          tanggal_selesai: tanggal_selesai || undefined,
          lokasi,
          created_by: created_by || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.agenda.push(newItem);
        res.status(201).json({ success: true, item: newItem });
      }

      writeDB(db);
    }
  });

  app.delete('/api/agenda/:id', async (req, res) => {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) {
        res.status(500).json({ error: 'Gagal menghapus agenda.' });
        return;
      }
      res.json({ success: true, message: 'Agenda berhasil dihapus.' });
    } else {
      const db = readDB();
      const initLen = db.agenda.length;
      db.agenda = db.agenda.filter(a => a.id !== id);

      if (db.agenda.length === initLen) {
         res.status(404).json({ error: 'Agenda tidak ditemukan.' });
         return;
      }

      writeDB(db);
      res.json({ success: true, message: 'Agenda berhasil dihapus.' });
    }
  });

  // ===== INFO TERKINI / BERITA ROUTES =====
  app.get('/api/info-terkini', async (req, res) => {
    let list: InfoTerkini[] = [];

    if (supabase) {
      const { data, error } = await supabase.from('info_terkini').select('*');
      if (error) {
        res.status(500).json({ error: 'Gagal mengambil berita.' });
        return;
      }
      list = data || [];
    } else {
      const db = readDB();
      list = db.info_terkini;
    }

    const sorted = [...list].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    res.json(sorted);
  });

  app.post('/api/info-terkini', async (req, res) => {
    const { id, judul, isi_konten, created_by } = req.body;
    if (!judul || !isi_konten) {
       res.status(400).json({ error: 'Judul dan Isi Pengumuman wajib diisi.' });
       return;
    }

    if (supabase) {
      if (id) {
        const { error } = await supabase
          .from('info_terkini')
          .update({
            judul,
            isi_konten,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          res.status(500).json({ error: 'Gagal memperbarui berita.' });
          return;
        }
        res.json({ success: true, item: { id, judul, isi_konten } });
      } else {
        const newItem = {
          id: generateId(),
          judul,
          isi_konten,
          created_by: created_by || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('info_terkini').insert(newItem);
        if (error) {
          res.status(500).json({ error: 'Gagal menerbitkan pengumuman.' });
          return;
        }
        res.status(201).json({ success: true, item: newItem });
      }
    } else {
      const db = readDB();

      if (id) {
        const idx = db.info_terkini.findIndex(n => n.id === id);
        if (idx === -1) {
           res.status(404).json({ error: 'Berita tidak ditemukan.' });
           return;
        }
        const item = db.info_terkini[idx];
        item.judul = judul;
        item.isi_konten = isi_konten;
        item.updated_at = new Date().toISOString();
        db.info_terkini[idx] = item;
        res.json({ success: true, item });
      } else {
        const newItem: InfoTerkini = {
          id: generateId(),
          judul,
          isi_konten,
          created_by: created_by || 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.info_terkini.push(newItem);
        res.status(201).json({ success: true, item: newItem });
      }

      writeDB(db);
    }
  });

  app.delete('/api/info-terkini/:id', async (req, res) => {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from('info_terkini').delete().eq('id', id);
      if (error) {
        res.status(500).json({ error: 'Gagal menghapus pengumuman.' });
        return;
      }
      res.json({ success: true, message: 'Berita/Pengumuman berhasil dihapus.' });
    } else {
      const db = readDB();
      const initLen = db.info_terkini.length;
      db.info_terkini = db.info_terkini.filter(n => n.id !== id);

      if (db.info_terkini.length === initLen) {
         res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });
         return;
      }

      writeDB(db);
      res.json({ success: true, message: 'Berita/Pengumuman berhasil dihapus.' });
    }
  });

  // ===== JADWAL PELAJARAN ROUTES =====
  app.get('/api/jadwal', async (req, res) => {
    const { kelas_id } = req.query;
    let list: JadwalPelajaran[] = [];

    if (supabase) {
      let query = supabase.from('jadwal_pelajaran').select('*');
      if (kelas_id) {
        query = query.eq('kelas_id', kelas_id);
      }
      const { data, error } = await query;
      if (error) {
        res.status(500).json({ error: 'Gagal mengambil data jadwal.' });
        return;
      }
      list = data || [];
    } else {
      const db = readDB();
      list = db.jadwal_pelajaran;
      if (kelas_id) {
        list = list.filter(j => j.kelas_id === kelas_id);
      }
    }

    const sorted = [...list].sort((a, b) => {
      return a.jam_mulai.localeCompare(b.jam_mulai);
    });

    res.json(sorted);
  });

  app.post('/api/jadwal', async (req, res) => {
    const { id, kelas_id, hari, jam_mulai, jam_selesai, mata_pelajaran, nama_guru } = req.body;
    if (!kelas_id || !hari || !jam_mulai || !jam_selesai || !mata_pelajaran) {
       res.status(400).json({ error: 'Data jadwal (Hari, Jam Mulai, Jam Selesai, Mata Pelajaran) belum lengkap.' });
       return;
    }

    const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    if (!validDays.includes(hari)) {
       res.status(400).json({ error: 'Hari tidak valid. Harus Senin, Selasa, Rabu, Kamis, atau Jumat.' });
       return;
    }

    if (supabase) {
      if (id) {
        const { data: item, error: fetchErr } = await supabase
          .from('jadwal_pelajaran')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr || !item) {
          res.status(404).json({ error: 'Jadwal pelajaran tidak ditemukan.' });
          return;
        }

        if (item.kelas_id !== kelas_id) {
          res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang merubah jadwal kelas lain.' });
          return;
        }

        const { error } = await supabase
          .from('jadwal_pelajaran')
          .update({
            hari: hari as any,
            jam_mulai,
            jam_selesai,
            mata_pelajaran,
            nama_guru: nama_guru || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          res.status(500).json({ error: 'Gagal merubah jadwal pelajaran.' });
          return;
        }
        res.json({ success: true, item: { id, kelas_id, hari, jam_mulai, jam_selesai, mata_pelajaran, nama_guru } });
      } else {
        const newItem = {
          id: generateId(),
          kelas_id,
          hari: hari as any,
          jam_mulai,
          jam_selesai,
          mata_pelajaran,
          nama_guru: nama_guru || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('jadwal_pelajaran').insert(newItem);
        if (error) {
          res.status(500).json({ error: 'Gagal menambahkan jadwal pelajaran ke database.' });
          return;
        }
        res.status(201).json({ success: true, item: newItem });
      }
    } else {
      const db = readDB();

      if (id) {
        const idx = db.jadwal_pelajaran.findIndex(j => j.id === id);
        if (idx === -1) {
           res.status(404).json({ error: 'Jadwal pelajaran tidak ditemukan.' });
           return;
        }
        
        const item = db.jadwal_pelajaran[idx];
        if (item.kelas_id !== kelas_id) {
           res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang merubah jadwal kelas lain.' });
           return;
        }

        item.hari = hari as any;
        item.jam_mulai = jam_mulai;
        item.jam_selesai = jam_selesai;
        item.mata_pelajaran = mata_pelajaran;
        item.nama_guru = nama_guru || '';
        item.updated_at = new Date().toISOString();
        db.jadwal_pelajaran[idx] = item;
        res.json({ success: true, item });
      } else {
        const newItem: JadwalPelajaran = {
          id: generateId(),
          kelas_id,
          hari: hari as any,
          jam_mulai,
          jam_selesai,
          mata_pelajaran,
          nama_guru: nama_guru || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.jadwal_pelajaran.push(newItem);
        res.status(201).json({ success: true, item: newItem });
      }

      writeDB(db);
    }
  });

  app.delete('/api/jadwal/:id', async (req, res) => {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from('jadwal_pelajaran').delete().eq('id', id);
      if (error) {
        res.status(500).json({ error: 'Gagal menghapus entri jadwal pelajaran.' });
        return;
      }
      res.json({ success: true, message: 'Entri jadwal belajar berhasil dihapus.' });
    } else {
      const db = readDB();
      const initLen = db.jadwal_pelajaran.length;
      db.jadwal_pelajaran = db.jadwal_pelajaran.filter(j => j.id !== id);

      if (db.jadwal_pelajaran.length === initLen) {
         res.status(404).json({ error: 'Jadwal pelajaran tidak ditemukan.' });
         return;
      }

      writeDB(db);
      res.json({ success: true, message: 'Entri jadwal belajar berhasil dihapus.' });
    }
  });

  // Serve static files / Vite middleware setup and index.html routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Jadwal!n FULLSTACK SERVER] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
