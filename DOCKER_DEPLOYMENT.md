# SmartFactory CONNECT - Docker Deployment Guide

## 📋 Overview

Hướng dẫn triển khai toàn bộ hệ thống SmartFactory CONNECT trên Docker, bao gồm:
- **Backend API**: Node.js 18 Alpine
- **Frontend**: React + Vite trên Nginx
- **PostgreSQL 15**: Database chính với pgvector extension
- **MongoDB 7.0**: Lưu trữ media (GridFS)

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Docker Network (smartfactory_network)        │
├───────────────┬──────────────┬──────────────┬─────────────────-┤
│   Frontend    │   Backend    │  PostgreSQL  │     MongoDB      │
│  (Port 80)    │ (Port 3000)  │ (Port 5432)  │   (Port 27017)   │
│   nginx       │   node:18    │ pgvector:pg15│    mongo:7.0     │
└───────────────┴──────────────┴──────────────┴─────────────────-┘
```

## 🚀 Quick Start

### 1. Prerequisites
- Docker Desktop >= 4.0
- Docker Compose v2
- 4GB RAM minimum

### 2. Start All Services

```bash
cd SmartFactory_CONNECT_Web
docker compose up -d --build
```

### 3. Wait for Health Checks

```bash
# Check all services are healthy
docker compose ps

# Verify backend health
curl http://localhost:3000/health
```

### 4. Seed Database via API

```bash
cd backend
npm run seed:docker
# OR
node src/database/seed_via_api.js
```

## 📁 Container Details

### Backend Container
- **Image**: Node 18 Alpine
- **Port**: 3000
- **Health Check**: `GET /health`
- **Features**:
  - dumb-init for proper signal handling
  - Non-root user (node)
  - Production dependencies only

### Frontend Container  
- **Image**: Nginx Alpine
- **Port**: 80
- **Features**:
  - Production-optimized build
  - API proxy to backend
  - SPA routing support

### PostgreSQL Container
- **Image**: pgvector/pgvector:pg15
- **Port**: 5432
- **Extensions**: uuid-ossp, pgvector
- **Config**:
  - max_connections: 200
  - shared_buffers: 512MB
  - work_mem: 16MB

### MongoDB Container
- **Image**: mongo:7.0
- **Port**: 27017
- **Database**: smartfactory_media
- **Usage**: GridFS for file uploads

## 🔧 Configuration

### Environment Variables

```env
# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=your-jwt-secret

# PostgreSQL
POSTGRES_USER=smartfactory
POSTGRES_PASSWORD=SmartFactory2025!
POSTGRES_DB=smartfactory_connect

# MongoDB
MONGO_INITDB_ROOT_USERNAME=smartfactory
MONGO_INITDB_ROOT_PASSWORD=SmartFactoryMongo2025!
```

### Volumes

| Volume | Purpose |
|--------|---------|
| smartfactory_postgres_data | PostgreSQL data |
| smartfactory_mongodb_data | MongoDB data |
| smartfactory_mongodb_config | MongoDB config |
| smartfactory_uploads | File uploads |
| smartfactory_logs | Backend logs |

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Current user

### Core APIs
- `GET /api/departments` - List departments
- `GET /api/users` - List users
- `GET /api/incidents` - List incidents
- `GET /api/ideas` - List ideas
- `GET /api/news` - List news

### Health
- `GET /health` - System health check

## 🧪 Testing

### Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartfactory.com","password":"Admin@123456"}'
```

### API Test with Token
```bash
TOKEN="your-token"
curl http://localhost:3000/api/departments \
  -H "Authorization: Bearer $TOKEN"
```

## 🔄 Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f database

# Restart specific service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes (reset database)
docker compose down -v

# Rebuild and restart
docker compose up -d --build

# Shell into container
docker exec -it smartfactory_backend sh
docker exec -it smartfactory_database psql -U smartfactory smartfactory_connect
```

## 📈 Monitoring

### Container Health Status
```bash
docker compose ps
```

### Resource Usage
```bash
docker stats
```

### Database Connections
```bash
curl http://localhost:3000/health | jq '.databases'
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Check health
curl http://localhost:3000/health
```

### Database connection issues
```bash
# Verify database is healthy
docker compose ps database

# Connect manually
docker exec -it smartfactory_database psql -U smartfactory smartfactory_connect
```

### Rate Limiting during seed
- Seed script has built-in retry logic
- Increase delay if needed in `seed_via_api.js`

### Port conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5432
lsof -i :80

# Stop conflicting services
docker stop $(docker ps -q)
```

## 📦 Seed Data Summary

After seeding, the database contains:
- **9 Departments** (SX, KT, VC, LOG, TB, MA, KTH, QA, QLSX)
- **75+ Users** (admin, managers, supervisors, operators, etc.)
- **8 Incidents** (safety, quality, equipment issues)
- **8 Ideas** (Kaizen, cost reduction, safety improvements)
- **7 News** (announcements, alerts, achievements)

## 🔐 Default Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@smartfactory.com | Admin@123456 | admin |

## 📝 Schema Version

Schema aligned with SRS v2.1:
- Users table with preferred_language support
- Role-based access control (10 roles)
- Multi-language support (vi, ja)
- Incident workflow with escalation
- IdeaBox with voting and evaluation

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-13  
**Maintained by**: SmartFactory CONNECT Team
