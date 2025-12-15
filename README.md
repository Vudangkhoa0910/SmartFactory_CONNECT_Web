# SmartFactory CONNECT

Enterprise-grade Smart Manufacturing Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)](https://www.postgresql.org)
[![MongoDB](https://img.shields.io/badge/mongodb-7.0-green.svg)](https://www.mongodb.com)
[![React](https://img.shields.io/badge/react-19.0.0-61dafb.svg)](https://react.dev)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

SmartFactory CONNECT is a comprehensive intelligent management platform designed for modern manufacturing environments. The system supports 2000-3000 concurrent users with real-time incident tracking, continuous improvement workflows, and AI-powered analytics.

### Project Goals

- Digitalize factory floor operations and incident reporting
- Enable real-time communication across departments
- Track and analyze production issues systematically
- Facilitate continuous improvement through structured idea management
- Provide actionable insights through data analytics

## Key Features

### Incident Management System
- Real-time incident reporting with multimedia support (photos, videos, voice recordings)
- Multi-level approval workflow: Worker to Team Leader to Supervisor to Manager
- Cross-department task assignment and collaboration
- SLA monitoring with automatic escalation mechanisms
- AI-powered solution suggestions using RAG (Retrieval-Augmented Generation)
- Post-resolution rating and feedback collection

### Idea Box Platform
- White Box: Public process improvement submissions
- Pink Box: Anonymous sensitive feedback channel
- Multi-tier approval process with difficulty classification (A, B, C, D levels)
- Feasibility and impact assessment scoring
- Implementation tracking with benefit realization analysis

### News and Communication
- Department-targeted content publishing system
- Priority notification distribution
- Read receipt tracking and analytics
- Rich media content support with multi-language translation
- Scheduled publishing capabilities

### Real-time Notifications
- WebSocket-based instant notification delivery (Socket.io)
- Firebase Cloud Messaging (FCM) for mobile push notifications
- Configurable notification preferences per user
- In-app and desktop notification support

### Analytics and Reporting
- Real-time KPI monitoring dashboards
- Incident trend analysis and statistics
- SLA compliance tracking and reporting
- Department performance metrics
- Custom report generation and export

### Room Booking System
- Conference room reservation management
- Scheduling conflict detection
- Recurring booking support
- Check-in/out tracking
- Equipment and catering request handling

### User Management
- Role-based access control with 11 distinct roles
- Hierarchical department structure management
- User activity logging and audit trails
- Bulk user operations

### Multi-language Support
- Vietnamese (vi)
- Japanese (ja)
- English (en)
- AI-powered translation using Google Gemini

### AI Chat Assistant
- Natural language query processing
- Quick data lookup and retrieval
- Automated report generation
- Powered by Google Gemini AI

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Users (2000-3000 concurrent)               │
│     Workers | Team Leaders | Supervisors | Managers         │
└─────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React 19)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Incidents │  │  Ideas   │  │   News   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    Nginx Reverse Proxy (Port 80)            │
└─────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   REST   │  │Socket.io │  │  Gemini  │   │
│  │   JWT    │  │   API    │  │Real-time │  │    AI    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    Express Server (Port 3000)               │
└─────────────────────────────────────────────────────────────┘
                              |
                              v
┌───────────────────┬─────────────────────────────────────────┐
│   PostgreSQL 15   │          MongoDB 7.0                    │
│   (Port 5432)     │        (Port 27017)                     │
├───────────────────┼─────────────────────────────────────────┤
│ - 18 Core Tables  │ - GridFS Media Storage                  │
│ - 7 ENUM Types    │ - Images & Documents                    │
│ - Views/Functions │ - Incident Attachments                  │
│ - Triggers/Index  │ - User Avatars                          │
│ - Connection Pool │ - Binary Files (>16MB)                  │
│   Max: 50 conns   │ - Automatic Chunking                    │
└───────────────────┴─────────────────────────────────────────┘
```

### Project Structure

```
SmartFactory_CONNECT_Web/
│
├── backend/                      # Node.js API Server
│   ├── src/
│   │   ├── config/              # Configuration (DB, Socket, Swagger)
│   │   ├── controllers/         # Request handlers (11 controllers)
│   │   ├── services/            # Business logic layer
│   │   ├── routes/              # API route definitions
│   │   ├── middlewares/         # Auth, Upload, Validation, Error
│   │   └── database/            # Database schemas & migrations
│   ├── uploads/                 # Local file storage
│   ├── logs/                    # Application logs
│   ├── scripts/                 # Utility scripts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                     # React Application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   ├── contexts/            # React contexts (Auth, Language, Theme)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   ├── i18n/                # Internationalization files
│   │   └── layout/              # Layout components
│   ├── public/                  # Static assets
│   ├── nginx.conf               # Nginx configuration
│   ├── Dockerfile
│   └── package.json
│
├── rag_service/                  # RAG AI Service (Python)
│   ├── main.py                  # FastAPI application
│   ├── embedding_service.py     # Vector embeddings
│   ├── incident_router.py       # Incident search API
│   └── requirements.txt
│
├── data/                         # Database backups
│   └── smartfactory_db_backup.sql
│
├── scripts/                      # DevOps scripts
│   ├── import-database.sh       # Database import utility
│   └── README.md
│
├── docs/                         # Documentation
│
├── docker-compose.yml            # Multi-container orchestration
└── README.md
```

## Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL 15 with pgvector extension
- **NoSQL**: MongoDB 7.0 for media storage
- **Real-time**: Socket.io 4.7.2
- **Authentication**: JSON Web Tokens (JWT)
- **File Upload**: Multer with GridFS
- **Password**: Bcrypt hashing
- **Validation**: Express Validator
- **API Docs**: Swagger/OpenAPI

### Frontend Technologies
- **Library**: React 19.0.0
- **Language**: TypeScript
- **Build Tool**: Vite 6.0
- **Styling**: TailwindCSS
- **Routing**: React Router 7.1.5
- **HTTP Client**: Axios
- **Charts**: ApexCharts
- **Real-time**: Socket.io Client
- **Icons**: Lucide React
- **Forms**: React Hook Form

### AI/ML Services
- **RAG Service**: Python FastAPI
- **Embeddings**: Sentence Transformers
- **Vector DB**: pgvector (PostgreSQL extension)
- **AI Model**: Google Gemini API

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Process Manager**: PM2 (optional)
- **Version Control**: Git
- **CI/CD**: GitHub Actions (planned)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 15.0
- MongoDB >= 7.0
- Docker & Docker Compose (recommended)
- Git

### Quick Start with Docker (Recommended)

This is the fastest way to get the entire system running:

```bash
# 1. Clone the repository
git clone https://github.com/Vudangkhoa0910/SmartFactory_CONNECT_Web.git
cd SmartFactory_CONNECT_Web

# 2. Start all services
docker-compose up -d

# 3. Check service status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

### Service Endpoints

After starting Docker containers:

- **Frontend Application**: http://localhost
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics

### Docker Container Details

| Container | Image | Port | Description |
|-----------|-------|------|-------------|
| smartfactory_frontend | nginx:alpine + React | 80 | Web application |
| smartfactory_backend | node:18-alpine | 3000 | API server |
| smartfactory_database | pgvector/pgvector:pg15 | 5432 | PostgreSQL database |
| smartfactory_mongodb | mongo:7.0 | 27017 | MongoDB storage |

### Manual Installation (Development)

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Required environment variables:**

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory_db
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smartfactory_media
```

#### 2. Database Setup

```bash
# Create PostgreSQL database
createdb smartfactory_db

# Import database schema and data
cd /path/to/SmartFactory_CONNECT_Web
./scripts/import-database.sh

# Or manually:
psql -U postgres -d smartfactory_db < data/smartfactory_db_backup.sql
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Frontend environment variables:**

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

#### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Development Workflow

### Branch Strategy

The project uses a structured branching model:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **khoadev**: Khoa's development branch
- **namdev**: Nam's development branch
- **tuandev**: Tuan's development branch
- **toandev**: Toan's development branch

### Workflow Process

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: description of changes"

# 4. Push to remote
git push origin feature/your-feature-name

# 5. Create Pull Request to develop
# Review and merge via GitHub

# 6. After approval, merge to main
git checkout main
git merge develop
git push origin main
```

### Commit Message Convention

Follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example:
```bash
git commit -m "feat: add incident export to Excel"
git commit -m "fix: resolve date picker timezone issue"
git commit -m "docs: update API documentation"
```

## Database Setup

### Import Production Database

The project includes a complete database backup with sample data:

```bash
# Using the automated script
./scripts/import-database.sh

# The script will:
# - Verify Docker container is running
# - Drop existing database
# - Create fresh database
# - Import schema and data
# - Verify import success
```

### Database Information

**Connection Details:**
- Host: localhost
- Port: 5432
- Database: smartfactory_db
- Username: smartfactory
- Password: smartfactory123

**Schema Overview:**
- 18 core tables
- 7 ENUM types
- Multiple indexes and constraints
- Triggers for updated_at timestamps
- Views for analytics

**Sample Data:**
- 10 users (various roles)
- 9 departments
- 215 incidents
- 44 ideas
- 16 news articles

### Default Admin Account

**Email**: admin@smartfactory.com  
**Password**: admin123

**Note**: Change the password after first login in production environments.

## API Documentation

### API Overview

The backend exposes RESTful APIs with the following base URL:

```
Base URL: http://localhost:3000/api/v1
```

### Main API Endpoints

#### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/profile
PUT    /api/v1/auth/profile
```

#### Incidents
```
GET    /api/v1/incidents
POST   /api/v1/incidents
GET    /api/v1/incidents/:id
PUT    /api/v1/incidents/:id
DELETE /api/v1/incidents/:id
POST   /api/v1/incidents/:id/assign
POST   /api/v1/incidents/:id/resolve
```

#### Ideas
```
GET    /api/v1/ideas
POST   /api/v1/ideas
GET    /api/v1/ideas/:id
PUT    /api/v1/ideas/:id
DELETE /api/v1/ideas/:id
POST   /api/v1/ideas/:id/approve
POST   /api/v1/ideas/:id/reject
```

#### News
```
GET    /api/v1/news
POST   /api/v1/news
GET    /api/v1/news/:id
PUT    /api/v1/news/:id
DELETE /api/v1/news/:id
POST   /api/v1/news/:id/publish
```

#### Departments
```
GET    /api/v1/departments
POST   /api/v1/departments
GET    /api/v1/departments/:id
PUT    /api/v1/departments/:id
DELETE /api/v1/departments/:id
```

#### Users
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
```

### Interactive API Documentation

Swagger UI is available at:
```
http://localhost:3000/api-docs
```

This provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication testing

## Deployment

### Production Deployment with Docker

```bash
# 1. Set environment to production
export NODE_ENV=production

# 2. Build production images
docker-compose -f docker-compose.prod.yml build

# 3. Start services
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify deployment
docker-compose ps
curl http://your-domain.com/health
```

### Production Environment Variables

Ensure these are properly configured:

```env
NODE_ENV=production
DB_PASSWORD=strong-password-here
JWT_SECRET=secure-random-string
CORS_ORIGIN=https://your-domain.com
```

### SSL/TLS Configuration

For production, configure Nginx with SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # ... rest of configuration
}
```

### Health Monitoring

Monitor application health using:

```bash
# Health check endpoint
curl http://localhost:3000/health

# Metrics endpoint
curl http://localhost:3000/metrics

# Container health
docker-compose ps
```

## Contributing

### How to Contribute

1. Fork the repository
2. Create your feature branch from `develop`
3. Make your changes
4. Write or update tests as needed
5. Ensure all tests pass
6. Commit with conventional commit messages
7. Push to your fork
8. Create a Pull Request to `develop` branch

### Code Standards

- Follow ESLint configuration
- Use TypeScript for frontend
- Write meaningful commit messages
- Document new features
- Add comments for complex logic
- Keep functions small and focused

### Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run linting
npm run lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions:

- GitHub Issues: https://github.com/Vudangkhoa0910/SmartFactory_CONNECT_Web/issues
- Email: support@smartfactory.com

## Acknowledgments

- Development Team: Khoa, Nam, Tuan, Toan
- Technologies: React, Node.js, PostgreSQL, MongoDB
- AI Services: Google Gemini

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready
