# FreelanceHub - Full-Stack Freelance Bidding Platform

A production-ready, visually stunning freelance bidding platform built with the MERN stack, featuring real-time chat, AI-powered proposal generation, secure payments, and a premium glass-morphism UI.

## 🚀 Features
- Dual user roles: Client & Freelancer
- Job posting, bidding, and contract management
- Real-time chat (Socket.IO)
- Stripe payment integration (test mode)
- GPT-4 powered proposal assistant
- Secure JWT authentication
- FAANG-level black-glass UI (TailwindCSS, framer-motion)
- Fully mobile responsive

## 🛠 Tech Stack
- **Frontend:** React.js, TailwindCSS, shadcn/ui, framer-motion, lucide-react
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt
- **Realtime:** Socket.IO
- **AI:** OpenAI GPT-4
- **Payment:** Stripe (Test Mode)

## 📋 Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Stripe account (for test keys)
- OpenAI account (for API key)

## ⚡ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <project-root>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your secrets:
```bash
cp .env.example .env
```
Edit `.env`:
```
MONGODB_URI=your-mongodb-uri
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### 4. Start MongoDB
- Local: `mongod`
- Atlas: Use your connection string in `.env`

### 5. Run the App
- **Dev mode (frontend + backend):**
  ```bash
  npm run dev
  # or, in separate terminals:
  npm run server
  npm run dev
  ```
- **Production build:**
  ```bash
  npm run build
  npm start
  ```

## 🗂️ File Structure
```
/client
  /components
  /pages
  /lib
  /hooks
  /layouts
/server
  /routes
  /controllers
  /models
  /middleware
  /sockets
  /utils
.env.example
README.md
```

## 🔑 API Keys Needed
- MongoDB URI
- OpenAI API Key
- Stripe Secret Key, Publishable Key, Webhook Secret
- JWT Secret

## 🧪 Testing Payments
- Use Stripe test keys
- Test cards: [Stripe test cards](https://stripe.com/docs/testing)
- Webhooks: Use Stripe CLI or ngrok for local development

## 🛠️ Dev Scripts
- `npm run dev` - Start frontend & backend (Vite + Express)
- `npm run server` - Start backend only
- `npm run build` - Build frontend
- `npm start` - Start production server
- `npm run lint` - Lint code

## 📚 API Route Structure
- `/api/auth` - Auth (register, login, profile)
- `/api/jobs` - Job posting & management
- `/api/bids` - Bidding system
- `/api/contracts` - Contract management
- `/api/messages` - Real-time chat
- `/api/notifications` - User notifications
- `/api/payments` - Stripe payments

## 🧠 AI Proposal Assistant
- On bid form, click "Write Proposal with AI"
- Requires OpenAI API key in `.env`

## 🖥️ UI/UX
- Black-glass, FAANG-style design
- Responsive, animated, and production-ready

## 🚀 Deployment
- **Frontend:** Vercel, Netlify
- **Backend:** Render, Cyclic, Railway
- **DB:** MongoDB Atlas

---
**Built with ❤️ for the freelance community**# Freelance-Bidding-Platfrom
