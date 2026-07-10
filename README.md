# FlowFund - Premium Personal Finance Manager

FlowFund is a modern, responsive, premium personal finance and wealth-tracking web application. Designed with a mobile-first, native-app-like experience, FlowFund allows users to seamlessly manage transactions, budget category limits, set savings goals, visualize financial data through responsive charts, and automate recurring expenses.

---

## 📱 Premium Mobile & Desktop Experience
FlowFund features an adaptive, dual-layout layout:
- **Mobile-First Experience**: High-fidelity, bottom-navigation menu bar, a custom slide-up bottom sheet for transaction entry, full-screen profile overlays, native date selectors, and custom-tailored touch targets ($\ge 48\text{px}$) with haptic feedbacks (`navigator.vibrate`) for a native iOS/Android feel.
- **Desktop Experience**: A spacious, sidebar-navigated dashboard layout, presenting cards side-by-side with complete charts and summaries.

---

## ✨ Features

- **PWA (Progressive Web App)**: Service Worker asset caching for offline resilience, custom web manifest, standalone display capability, and a premium app icon.
- **Unified Global State Management**: Powered by React Context (`AuthContext` and `DataContext`), keeping transaction lists, budget categories, and goals synchronized globally.
- **Robust Authentication**: Secure registration, email verification flows, credentials comparison, and persistent state management using JWT (JSON Web Tokens).
- **Transactions Management**: Support for expenses and income logs with custom categories, icons, and automated recurring schedules (weekly/monthly).
- **Smart Budgets**: Real-time spending progress bars per category with yellow warning (80%) and red exceeded (100%) indicators.
- **Financial Goals & Health**: Customized algorithm estimating a Financial Health Score (0–100) based on savings rate, paired with interactive goals progress bars.
- **Dark Mode**: Seamless visual preference persistence (light/dark themes) stored in `localStorage` and mapped using CSS custom properties.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** & **Vite** (fast hot module reloading & build configuration)
- **React Router v7** (SPA layout transitions and routes)
- **Recharts** (responsive pie and bar visual analytics)
- **Lucide React** (modern iconography)
- **React Hot Toast** (toast notifications)

### Backend & Database
- **Express.js** & **Node.js**
- **SQLite3** (for local development)
- **PostgreSQL / pg** (for production deployments, utilizing `RETURNING` SQL queries)
- **JSON Web Tokens (JWT)** (session security)
- **Bcrypt** (password hashing)

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/YuvrajGora/FlowFund.git
   cd FlowFund
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory (optional for SQLite, required for PostgreSQL in production):
   ```env
   PORT=3000
   SECRET_KEY=your_jwt_secret_key_here
   DATABASE_URL=postgres://user:password@localhost:5432/flowfund (only for Postgres production)
   ```

4. **Build the production bundle**:
   ```bash
   npm run build
   ```

5. **Start the server**:
   ```bash
   npm run start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

6. **Development mode (client only)**:
   ```bash
   npm run dev
   ```

---

## 📸 Screenshots

| Desktop Dashboard | Mobile View (Bottom Sheet) |
| --- | --- |
| *[Screenshot Placeholder - Desktop Dashboard]* | *[Screenshot Placeholder - Mobile View]* |

---

## ☁️ Deployment Instructions

### 1. Database Configuration
In production environments (like Render, Heroku, or Fly.io), set the environment variable:
- `NODE_ENV=production`
- `DATABASE_URL` (connecting to a PostgreSQL database).

FlowFund's SQL adapter automatically detects `DATABASE_URL` and switches from SQLite to PostgreSQL, running normalized query scripts (`?` to `$1` param translation) and executing proper `RETURNING` query operations.

### 2. Deploying on Render (Example)
1. Link your GitHub repository to a new **Web Service** on Render.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Configure Environment Variables (`SECRET_KEY` and `DATABASE_URL` linked to your PostgreSQL database).

---

## 🔮 Future Roadmap
- [ ] **Bank Feed Integration**: Automated sync with bank APIs (e.g. Plaid) to pull bank accounts and credit card transactions.
- [ ] **AI-Powered Financial Insights**: Automated suggestions to optimize spending, predict cash flow, and flags for subscription creep.
- [ ] **Advanced Split-Billing**: In-app peer-to-peer bill splitting and sharing for joint house expenses.
- [ ] **Multi-Currency Support**: Automated conversion rates for tracking international assets and currency preferences.
