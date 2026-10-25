# FinVelayudham.app 🚀

**Production-grade Personal Wealth & Financial Independence Platform**  
*100% Free & Unlimited for all users. No subscriptions, no paywalls, no limits.*

---

## 🌟 Key Features

1. **Comprehensive Dashboard & Portfolio Tracker (`/demo`)**:
   - Consolidated Net Worth, Total Assets, Liabilities, and Liquid Emergency Runway.
   - Interactive SVG Area Chart with hover tooltips and dynamic timeline checkpoints.
   - Asset Allocation Donut chart categorized into Stocks & Equity, Debt & Fixed Income, Real Estate, Gold & Commodities, and Cash.
   - Domestic (India) vs International (Global / US Tech) exposure breakdown.
   - Dynamic Asset and Liability creation modals with instant client-state recalculation.
   - Monthly cashflow inflows/outflows breakdown and financial essentials diagnostic.

2. **10 Financial Calculators Suite (`/calculators`)**:
   - **Returns**: [SIP Calculator](/calculators/sip), [XIRR Calculator](/calculators/xirr), [Lumpsum Calculator](/calculators/lumpsum), [CAGR Calculator](/calculators/cagr).
   - **Loans**: [EMI Calculator](/calculators/emi) with salary affordability diagnostic.
   - **Planning**: [Retirement Corpus Planner](/calculators/retirement), [Future Cost Calculator](/calculators/future-cost), [SWP with Inflation](/calculators/swp), [Inflation Calculator](/calculators/inflation), [Fixed Deposit Calculator](/calculators/fd).

3. **Multi-Currency Engine**:
   - Real-time conversion across 45+ world currencies (INR, USD, EUR, GBP, SGD, AED, AUD, CAD, etc.).
   - Support for Indian number formatting (Lakhs & Crores) as well as international notation (M / B).

4. **Automatic Frontend Synchronization & Drift Monitor (`/admin/sync`)**:
   - Continuous inspection pipeline monitoring `https://www.finboom.app` for markup, route, CSS, and functional drift.
   - Cryptographic SHA-256 content signatures on all critical endpoints.
   - Automated safety gates (`npm test` runner) to prevent broken upstream updates from reaching production.
   - Scheduled hourly scans and on-demand trigger console.

5. **Design System & Aesthetics**:
   - Warm cream (`#f7f6f3`), rich forest green (`#2c6e49`), and deep dark mode (`#111110`).
   - Elegant typography pairing: `DM Serif Display` headings and `Inter` sans-serif tabular numbers.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 22.x or 24.x
- npm 10+

### Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Automated Tests
```bash
npm test
```

### Upstream Parity & Synchronization Scanner
```bash
npm run sync:check
```

### Production Build
```bash
npm run build
npm start
```

---

## 📖 Artifacts & Documentation
- [Feature Inventory & Parity Report](file:///C:/Users/USER/.gemini/antigravity/brain/29966694-580e-4e12-a069-36cd46bc8ff2/FINVELAYUDHAM_FEATURE_INVENTORY.md)
- [Production Deployment & Custom Domain Guide](file:///C:/Users/USER/.gemini/antigravity/brain/29966694-580e-4e12-a069-36cd46bc8ff2/FINVELAYUDHAM_DEPLOYMENT_GUIDE.md)
- [Administrator Operations Manual](file:///C:/Users/USER/.gemini/antigravity/brain/29966694-580e-4e12-a069-36cd46bc8ff2/FINVELAYUDHAM_ADMIN_GUIDE.md)
