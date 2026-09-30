# 🔐 Cipher Vault

A client-side authentication system built with **HTML5, CSS3 and vanilla JavaScript**. It has user registration, login validation, a protected dashboard and logout, and it needs no backend.

> Built as a learning project to demonstrate secure-by-design front-end auth patterns: salted password hashing, session expiry and route guarding.

## ✨ What makes it unique

| Feature | Description |
|---|---|
| **Hash identicon** | Every user gets a unique visual avatar generated from their password hash. |
| **Live password coach** | A strength meter and rule chips update as you type. |
| **Auto-expiring sessions** | The dashboard shows a 5-minute countdown and logs the user out when it ends. |
| **Stored-record viewer** | The dashboard shows what is saved (a truncated salt and hash), which proves no plain-text password exists. |

## ✅ Feature checklist

- [x] Registration page with username/email and password
- [x] Password validation: minimum 8 characters and at least 1 number
- [x] Duplicate username/email check with an error message
- [x] Login page with username/email and password
- [x] Generic "Invalid credentials" error that doesn't reveal which field is wrong
- [x] Protected dashboard that redirects to login when accessed without a session
- [x] Logout button that clears the session and redirects to login
- [x] Passwords are never stored in plain text (salted PBKDF2-SHA-256)
- [x] Form validation on both pages (no empty submissions)

## 🛠 Tech stack

- **HTML5**: semantic structure, single-page layout with three views
- **CSS3**: custom properties, light/dark theme support, responsive layout
- **JavaScript (ES6+)**: hash-based router, Web Crypto API, localStorage

## 📁 Project structure

```
cipher-vault/
├── index.html    # Register, Login and Dashboard views
├── style.css     # Styling and theming
├── script.js     # Auth logic, routing, hashing, session handling
└── README.md
```

## 🚀 Getting started

1. **Clone the repository**
```bash
   git clone https://github.com/<your-username>/cipher-vault.git
   cd cipher-vault
```

2. **Run it locally.** The Web Crypto API needs a secure context (HTTPS or `localhost`), so serve the folder with any static server:
```bash
   # Python
   python -m http.server 8000

   # or Node
   npx serve .
```

3. Open **http://localhost:8000** in your browser.

## 🧭 How to use

1. Go to **Register** and create an account. The password needs at least 8 characters and 1 number.
2. **Login** with the same credentials.
3. On the **Dashboard**, view your identicon, session timer and stored record.
4. Click **Logout**, or wait for the session to expire.
5. Try opening `#/dashboard` while logged out. You'll be redirected to login.

## 🔒 How security works

- **Hashing:** passwords are hashed with **PBKDF2 (SHA-256, 100,000 iterations)** through the Web Crypto API.
- **Salting:** each user gets a unique random 16-byte salt, so identical passwords produce different hashes.
- **No plain text:** only the salt and hash are stored in `localStorage`.
- **Generic errors:** login failures always show the same message. A dummy hash is computed for unknown users so response time doesn't leak whether an account exists.
- **Sessions:** a token with an expiry timestamp is stored under `cv_session`. It is validated on every route change.
- **Route guard:** the dashboard checks for a valid session before rendering.
- **Safe rendering:** user-supplied values are written with `textContent` to avoid XSS.

### localStorage keys

| Key | Contents |
|---|---|
| `cv_users` | Registered users (`id`, `salt`, `hash`, `created`) |
| `cv_session` | Current session (`id`, `exp`) |

## ⚠️ Limitations

This is a **front-end-only demo**. Anyone with access to the browser can read or edit `localStorage` in dev tools, and there is no server to enforce access. For production use, move authentication to a backend (for example Node/Express with bcrypt or Argon2, or Flask sessions), use HTTP-only cookies, and add rate limiting.

## 🔮 Possible improvements

- Backend version (Node.js + Express + SQLite, or Flask)
- Password reset flow
- Account lockout after repeated failed attempts
- "Remember me" option with a configurable session length

## 📄 License

MIT. Feel free to use and modify.# Webdev-L2-login-Authentication-System
