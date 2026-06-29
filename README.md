# Vendharaa Billing Software

A multi-tenant billing system designed for managing pharmaceutical and agro-mart billing operations. The application consists of a React frontend and an Express/Node.js backend connecting to MongoDB.

---

## 📁 Repository Structure

```
├── backend/                   # Node.js + Express API server
│   ├── config/                # Database configurations (Master/Agro/Pharma)
│   ├── middleware/            # Auth, db selection, logger, and error middlewares
│   ├── models/                # Mongoose models and schemas
│   ├── routes/                # Route controllers (users, settings, ledger, etc.)
│   ├── utils/                 # Utilities and cron jobs
│   ├── Dockerfile             # Production build container settings
│   └── server.js              # Server entry point
│
├── frontend/                  # React + Vite client application
│   ├── src/                   # Source code
│   │   ├── components/        # Reusable UI elements
│   │   ├── context/           # React Context providers (Auth/App)
│   │   ├── layouts/           # Page layouts (Sidebar, Header)
│   │   ├── pages/             # Page components (Billing, Settings, Sessions)
│   │   └── services/          # API services
│   ├── nginx.conf             # Nginx reverse proxy configuration for client image
│   └── Dockerfile             # Multi-stage production client image
│
├── docker-compose.yml         # Compose configuration to orchestrate services
└── package.json               # Root scripts to run both apps concurrently
```

---

## ⚙️ Prerequisites

- **Node.js**: `v20.x` or later (for local development)
- **Docker & Docker Compose**: For containerized deployment
- **MongoDB**: Access to a MongoDB server or connection strings

---

## 🚀 Getting Started

### 1. Local Development Setup

To run the client and server concurrently on your local machine:

1. **Install dependencies** for both the frontend and backend:
   ```bash
   npm install
   ```
   *(This runs a concurrently script to perform `npm install` in both `frontend` and `backend`)*

2. **Configure environment variables**:
   Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=1007
   MONGO_URI=your_master_db_uri
   MONGO_URI_AGRO=your_agro_db_uri
   MONGO_URI_PHARMA=your_pharma_db_uri
   JWT_SECRET=your_jwt_signing_secret
   ```

   And a `.env` file inside the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:1007/api
   ```

3. **Start the development servers**:
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:1008`
   - Backend API runs on: `http://localhost:1007`

---

### 🐳 2. Production Deployment via Docker Compose

To deploy the fully compiled production build using Docker:

1. Build and start the containers in detached mode:
   ```bash
   docker compose up -d --build
   ```
2. The application will be accessible at:
   - **Client App**: `http://localhost:1008`
   - **Backend API**: `http://localhost:1007/api`

---

## 💾 Image Storage (MongoDB Base64)

The application stores all uploaded logos (e.g., pharmacy logos in General Settings and user logos) directly in MongoDB as **Base64-encoded strings**. 
- No files are written to the container file system.
- Avoids the need for container volumes for static upload assets.
- Automatically scales and serves images correctly via base64 data URIs in the frontend and invoice templates.

---

## 📝 Accessing Logs

Errors and application activity logs are directed to `/app/logs` inside the server container.

In production (`docker-compose.yml`), these logs are mounted to the host machine at:
`/home/rubhak/app-data/vendharaa-billing/logs`

### Viewing Logs:
- **Direct file access**: Open the logs directory on the host server.
- **Docker output streaming**:
  ```bash
  docker compose logs -f server
  ```
