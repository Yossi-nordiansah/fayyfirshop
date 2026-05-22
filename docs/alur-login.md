# Dokumentasi Alur Login — Fayyfir Shop

> **Stack**: Laravel 11 + Inertia.js (React) + Framer Motion  
> **Dibuat**: 2026-05-22  
> **Versi Dokumen**: 1.0

---

## Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [File-File yang Terlibat](#file-file-yang-terlibat)
3. [Alur Login Detail (Step-by-Step)](#alur-login-detail)
4. [Alur Registrasi & Redirect ke Login](#alur-registrasi--redirect-ke-login)
5. [Alur Logout](#alur-logout)
6. [Diagram Alur](#diagram-alur)
7. [Penjelasan Keputusan Redirect Berdasarkan Role](#penjelasan-keputusan-redirect-berdasarkan-role)
8. [Rate Limiting & Keamanan](#rate-limiting--keamanan)

---

## Gambaran Umum

Aplikasi Fayyfir Shop menggunakan **modal login** (bukan halaman login terpisah) untuk customer. Login dipicu dari `Navbar` dan diproses oleh Inertia.js yang mengirim request ke backend Laravel. Setelah berhasil, user diarahkan kembali ke halaman yang sedang dikunjungi (bukan ke halaman profile).

---

## File-File yang Terlibat

### Frontend (React / Inertia)

| File | Lokasi | Fungsi |
|------|--------|--------|
| `Navbar.jsx` | `resources/js/Components/Navbar.jsx` | Trigger pembuka modal login (desktop & mobile), deteksi query `?login=1` |
| `LoginModal.jsx` | `resources/js/Components/LoginModal.jsx` | Komponen modal form login, kirim request POST ke `/login` |
| `Register.jsx` | `resources/js/Pages/register/Register.jsx` | Halaman registrasi dengan form lengkap |
| `LanguageContext.jsx` | `resources/js/Contexts/LanguageContext.jsx` | Context multi-bahasa, menyimpan locale di `localStorage` |

### Backend (Laravel)

| File | Lokasi | Fungsi |
|------|--------|--------|
| `auth.php` | `routes/auth.php` | Definisi route `GET /login`, `POST /login`, `POST /logout`, dan route auth lainnya |
| `web.php` | `routes/web.php` | Route utama, termasuk `/profile` yang dilindungi middleware `auth` |
| `AuthenticatedSessionController.php` | `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Controller login: menampilkan view dan memproses autentikasi |
| `LoginRequest.php` | `app/Http/Requests/Auth/LoginRequest.php` | Form Request: validasi, rate limiting, dan `Auth::attempt()` |
| `RegisteredUserController.php` | `app/Http/Controllers/Auth/RegisteredUserController.php` | Controller registrasi: validasi, simpan user baru, redirect ke home dengan trigger login modal |
| `ProfileController.php` | `app/Http/Controllers/ProfileController.php` | Controller profil: edit, update, hapus akun (dilindungi `auth` middleware) |

---

## Alur Login Detail

### Step 1 — User Membuka Modal Login

**File:** `resources/js/Components/Navbar.jsx`

User dapat memicu modal login melalui dua cara:

**A. Klik icon akun (desktop):**
```jsx
// Navbar.jsx — Desktop Account Dropdown
<button onClick={() => {
    setShowAccountDropdown(false);
    setShowLoginModal(true);   // ← state ini membuka modal
}}>
    <LogIn size={16} />
    Sign In
</button>
```

**B. Klik tombol Sign In (mobile menu drawer):**
```jsx
// Navbar.jsx — Mobile Menu Drawer
<button onClick={() => {
    setIsOpen(false);           // tutup mobile menu
    setShowLoginModal(true);    // ← buka login modal
}}>
    <LogIn size={14} />
    Sign In
</button>
```

**C. Otomatis via query parameter `?login=1`** (setelah registrasi):
```jsx
// Navbar.jsx — useEffect deteksi URL
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
        setShowLoginModal(true);   // ← otomatis buka modal
        // hapus query string dari URL agar tidak terpicu ulang
        const url = new URL(window.location.href);
        url.searchParams.delete("login");
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }
}, []);
```

---

### Step 2 — Modal Login Render & User Mengisi Form

**File:** `resources/js/Components/LoginModal.jsx`

Modal dirender menggunakan `AnimatePresence` + `motion.div` dari Framer Motion. Form dikelola menggunakan hook `useForm` dari Inertia.js:

```jsx
const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: true,    // ← remember me aktif secara default
});
```

Form mengandung:
- Input **Email** — terhubung ke `data.email`
- Input **Password** — dengan toggle show/hide, terhubung ke `data.password`
- Tombol **Sign In Premium** — disabled saat `processing === true`

---

### Step 3 — Submit Form Login

**File:** `resources/js/Components/LoginModal.jsx`

Saat user klik tombol submit:

```jsx
const handleLoginSubmit = (e) => {
    e.preventDefault();
    post(route("login"), {          // ← POST ke /login (named route)
        onSuccess: () => {
            onClose();              // tutup modal
            reset("password");     // kosongkan field password
        },
    });
};
```

Inertia.js secara otomatis mengirim request AJAX `POST /login` dengan:
- Header `X-Inertia: true`
- Header `X-CSRF-TOKEN` (dari Laravel session)
- Body: `{ email, password, remember }`

---

### Step 4 — Routing ke Controller

**File:** `routes/auth.php`

Route login didefinisikan dalam grup middleware `guest` (hanya bisa diakses jika **belum** login):

```php
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');           // GET  /login — tampilkan halaman login

    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    //                                                            ↑
    //                                          POST /login — proses login
});
```

---

### Step 5 — Validasi Request (LoginRequest)

**File:** `app/Http/Requests/Auth/LoginRequest.php`

`AuthenticatedSessionController@store` menerima parameter `LoginRequest`. Laravel otomatis menjalankan validasi sebelum masuk ke method controller:

```php
public function rules(): array
{
    return [
        'email'    => ['required', 'string', 'email'],
        'password' => ['required', 'string'],
    ];
}
```

Jika validasi gagal (field kosong / format email salah), Laravel langsung mengembalikan error ke frontend tanpa masuk ke method `authenticate()`.

---

### Step 6 — Autentikasi & Rate Limiting

**File:** `app/Http/Requests/Auth/LoginRequest.php`

```php
public function authenticate(): void
{
    // 1. Cek apakah sudah melebihi batas percobaan login
    $this->ensureIsNotRateLimited();

    // 2. Coba login dengan email + password + remember
    if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
        RateLimiter::hit($this->throttleKey());  // tambah hitungan gagal

        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),     // "These credentials do not match our records."
        ]);
    }

    RateLimiter::clear($this->throttleKey());    // reset hitungan jika berhasil
}
```

**Rate Limiting:**
```php
public function ensureIsNotRateLimited(): void
{
    if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
        return;  // masih di bawah 5 percobaan, lanjutkan
    }

    event(new Lockout($this));   // trigger event lockout

    $seconds = RateLimiter::availableIn($this->throttleKey());
    throw ValidationException::withMessages([
        'email' => trans('auth.throttle', [
            'seconds' => $seconds,
            'minutes' => ceil($seconds / 60),
        ]),
    ]);
}

// Kunci unik per kombinasi email + IP address
public function throttleKey(): string
{
    return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
}
```

> **Batas**: Maksimal **5 percobaan gagal** per email+IP. Setelah itu dikunci sementara.

---

### Step 7 — Session Regenerate & Redirect Berdasarkan Role

**File:** `app/Http/Controllers/Auth/AuthenticatedSessionController.php`

```php
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();           // Step 6 di atas

    $request->session()->regenerate();  // cegah session fixation attack

    $user = Auth::user();

    // Cek role user
    if ($user && $user->role === 'customer') {
        // Customer → kembali ke halaman sebelumnya (recent page)
        return redirect()->intended(url()->previous());
    }

    // Admin / role lain → ke dashboard
    return redirect()->intended(route('dashboard', absolute: false));
}
```

---

### Step 8 — Frontend Menerima Response Sukses

**File:** `resources/js/Components/LoginModal.jsx`

Inertia.js menerima redirect response dari Laravel, lalu:
1. Callback `onSuccess` dipanggil → modal ditutup & password direset
2. Inertia melakukan navigasi SPA ke URL tujuan (halaman sebelumnya untuk customer)
3. Navbar otomatis memperbarui state `user` karena shared props Inertia diperbarui:

```jsx
// Navbar.jsx — membaca user dari shared props Inertia
const { auth } = usePage().props;
const user = auth?.user;
```

Setelah login, icon akun di Navbar berubah dari icon `<User>` menjadi **avatar photo** user.

---

## Alur Registrasi & Redirect ke Login

**File:** `app/Http/Controllers/Auth/RegisteredUserController.php`

Setelah registrasi berhasil, user **tidak langsung di-login**. User diarahkan ke homepage dengan query `?login=1`:

```php
// RegisteredUserController.php — store()
return redirect('/?login=1')->with('status', 'registered');
//                   ↑
//   Navbar mendeteksi ini dan otomatis membuka LoginModal
```

**File:** `resources/js/Components/Navbar.jsx`

```jsx
// Navbar.jsx — deteksi ?login=1 dari URL
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
        setShowLoginModal(true);   // ← modal login terbuka otomatis
        // bersihkan URL agar rapi
    }
}, []);
```

---

## Alur Logout

**File:** `routes/auth.php` → `AuthenticatedSessionController@destroy`

Route logout hanya tersedia untuk user yang sudah login (`auth` middleware):

```php
Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
```

```php
// AuthenticatedSessionController.php
public function destroy(Request $request): RedirectResponse
{
    Auth::guard('web')->logout();          // hapus session auth

    $request->session()->invalidate();     // invalidate session lama
    $request->session()->regenerateToken(); // regenerate CSRF token

    return redirect('/');                  // redirect ke homepage
}
```

Di frontend (Navbar.jsx), logout menggunakan Inertia Link dengan method POST:

```jsx
<Link
    href="/logout"
    method="post"      // ← method POST (bukan GET, untuk keamanan)
    as="button"
>
    <LogOut size={16} />
    Sign Out
</Link>
```

---

## Diagram Alur

```
USER
 │
 ├── Klik icon akun / tombol Sign In / buka URL ?login=1
 │
 ▼
[Navbar.jsx]
 └── setShowLoginModal(true)
      │
      ▼
[LoginModal.jsx]
 └── Render form (email + password)
 └── User isi form & klik submit
 └── post(route('login')) via Inertia useForm
      │
      ▼
POST /login                          ← routes/auth.php (middleware: guest)
      │
      ▼
[AuthenticatedSessionController@store]
      │
      ├── LoginRequest::authenticate()
      │    ├── ensureIsNotRateLimited()  ← max 5 attempts per email+IP
      │    └── Auth::attempt(email, password, remember)
      │         ├── GAGAL → ValidationException (errors.email)
      │         │            └── Modal tampilkan pesan error
      │         └── BERHASIL → clear rate limiter
      │
      ├── session()->regenerate()       ← cegah session fixation
      │
      ├── $user->role === 'customer'?
      │    ├── YA  → redirect()->intended(url()->previous())
      │    │          └── kembali ke halaman yang sedang dikunjungi
      │    └── TIDAK → redirect()->intended(route('dashboard'))
      │
      ▼
[LoginModal.jsx] onSuccess callback
 └── onClose()       ← modal ditutup
 └── reset('password')
      │
      ▼
[Navbar.jsx] shared props diperbarui
 └── user avatar tampil (user sudah login)
```

---

## Penjelasan Keputusan Redirect Berdasarkan Role

| Role | Redirect Setelah Login | Keterangan |
|------|------------------------|------------|
| `customer` | Halaman sebelumnya (`url()->previous()`) | UX: user tidak terganggu, tetap di halaman yang sedang dibrowse |
| Admin / role lain | `/dashboard` | Admin perlu akses ke panel manajemen |

`redirect()->intended()` adalah method Laravel yang akan mengecek apakah ada URL yang disimpan di session (misalnya user mencoba akses halaman protected lalu diarahkan ke login). Jika ada, user dikirim ke sana. Jika tidak ada, fallback ke argumen yang diberikan.

---

## Halaman Terproteksi (Auth Middleware)

**File:** `routes/web.php`

Halaman-halaman berikut **hanya bisa diakses setelah login**:

```php
// Halaman Dashboard (auth + verified)
Route::get('/dashboard', ...)->middleware(['auth', 'verified'])->name('dashboard');

// Halaman Profile (auth saja)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
```

Jika user yang belum login mencoba akses `/profile`, Laravel menyimpan URL tujuan di session lalu redirect ke `/login`. Setelah login berhasil, `redirect()->intended()` akan mengirim user ke `/profile` secara otomatis.

---

## Rate Limiting & Keamanan

| Mekanisme | Detail |
|-----------|--------|
| **Rate Limiting** | Max 5 percobaan login gagal per kombinasi `email + IP address` |
| **Lockout Event** | Event `Illuminate\Auth\Events\Lockout` di-fire saat user terkunci |
| **Session Fixation** | `session()->regenerate()` dipanggil setelah login berhasil |
| **Session Invalidation** | `session()->invalidate()` + `regenerateToken()` dipanggil saat logout |
| **CSRF Protection** | Semua form POST dilindungi CSRF token otomatis oleh Laravel + Inertia |
| **Guest Middleware** | Route `/login` dan `/register` hanya bisa diakses user yang **belum** login |
| **Password Hashing** | Password disimpan dengan `Hash::make()` (bcrypt) — tidak pernah plain text |

---

*Dokumen ini mencakup alur autentikasi lengkap dari sisi frontend (React/Inertia) hingga backend (Laravel). Untuk pertanyaan lebih lanjut, lihat kode sumber pada file-file yang direferensikan di atas.*
