# OpenProfileCard

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)](https://vuejs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)

**OpenProfileCard** is the official frontend for the OpenProfileServer. It features a modern, high-performance UI designed with a **Glassmorphism** aesthetic to showcase professional identities beautifully.

[Backend & Generator Repository](https://github.com/XIYUEKONGLING/OpenProfile)

---

## ✨ Features

- **💎 Modern UI**: Beautiful Glassmorphism design built with Tailwind CSS 4.0 and Shadcn-Vue.
- **🌓 Adaptive Theme**: Intelligent Dark/Light mode support with system preference detection.
- **🔌 Dual-Mode Intelligence**: Automatically detects if the backend is **Static** or **Dynamic**.
  - In *Static mode*, it hides management features (Login/Register) and functions as a fast read-only card.
  - In *Dynamic mode*, it enables full CMS capabilities, including profile editing and social interactions.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile viewing.
- **⚡ Performance**: Powered by Vite and Pinia for ultra-fast state management and loading.

---

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.0 (Pre-release features)
- **Components**: Shadcn-Vue + Lucide Icons
- **State Management**: Pinia
- **Icons**: FontAwesome 7 + DevIcon (for tech skills)

---

## 📦 Getting Started

### 1. Installation
```bash
npm install
# or
pnpm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=https://your-api-or-static-host.com
```

### 3. Development
```bash
npm run dev
```

### 4. Build
```bash
npm run build
```

### 5. Deployment

#### Cloudflare Pages

When deploying with the generator's build output on Cloudflare Pages, ensure you include a `_redirects` file in the public directory:

```
/api/*   /api/:splat   200
/*       /index.html   200
```

This configuration ensures:
- API requests are properly proxied to your backend
- All routes are handled by `index.html` for client-side routing

---

## 🤝 Contributing

This project is part of the OpenProfileServer. Feel free to open issues or submit PRs to improve the UI components or integration logic.

## 📄 License

Distributed under the **AGPL-3.0 License**. See `LICENSE` in the backend repository for more information.
