# Docker Setup for TaskFlow

This project includes Docker and Docker Compose configurations for both development and production environments.

## 🚀 Quick Start

### Production Environment

1. **Start the entire stack:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - TaskFlow App: http://localhost:3000
   - CouchDB Fauxton (Admin UI): http://localhost:5984/_utils
   - CouchDB Admin: `admin` / `password`

### Development Environment

1. **Start development stack with hot reload:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the development app:**
   - TaskFlow Dev: http://localhost:9002
   - CouchDB: http://localhost:5984/_utils
   - CouchDB Admin: `admin` / `devpassword`

## 📁 Files Overview

- `Dockerfile` - Production build (multi-stage, optimized)
- `Dockerfile.dev` - Development build (with hot reload)
- `docker-compose.yml` - Production stack
- `docker-compose.dev.yml` - Development stack
- `.dockerignore` - Files excluded from Docker build
- `.env.example` - Production environment template
- `.env.dev.example` - Development environment template

## 🛠️ Setup Instructions

### First Time Setup

1. **Copy environment files:**
   ```bash
   cp .env.example .env
   cp .env.dev.example .env.dev
   ```

2. **Customize environment variables** in `.env` and `.env.dev` as needed

3. **Build and start services:**
   ```bash
   # For production
   docker-compose up --build -d
   
   # For development  
   docker-compose -f docker-compose.dev.yml up --build -d
   ```

### Database Initialization

The CouchDB service will automatically:
- Create the admin user
- Set up authentication
- Create required databases on first connection

## 🔧 Common Commands

### Production Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up --build -d

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Development Commands
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Watch logs
docker-compose -f docker-compose.dev.yml logs -f taskflow-dev

# Restart just the app (after code changes)
docker-compose -f docker-compose.dev.yml restart taskflow-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Database Management
```bash
# Connect to CouchDB container
docker exec -it taskflow-couchdb bash

# View CouchDB logs
docker-compose logs -f couchdb

# Backup CouchDB data
docker run --rm -v taskflow_couchdb_data:/data -v $(pwd):/backup alpine tar czf /backup/couchdb-backup.tar.gz -C /data .

# Restore CouchDB data
docker run --rm -v taskflow_couchdb_data:/data -v $(pwd):/backup alpine tar xzf /backup/couchdb-backup.tar.gz -C /data
```

## 🌐 Environment Variables

### CouchDB Configuration
- `COUCHDB_URL` - Full CouchDB connection URL
- `COUCHDB_USER` - CouchDB admin username
- `COUCHDB_PASS` - CouchDB admin password
- `COUCHDB_HOST` - CouchDB host and port
- `COUCHDB_TASKS_DB` - Tasks database name
- `COUCHDB_TEMPLATES_DB` - Templates database name
- `COUCHDB_META_DB` - Metadata database name

### Next.js Configuration
- `NODE_ENV` - Environment (development/production)
- `HOSTNAME` - Server hostname
- `PORT` - Server port

## 🔒 Security Notes

### Production Deployment
1. **Change default passwords** in production
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** with a reverse proxy (nginx/traefik)
4. **Restrict CouchDB access** to internal network only
5. **Regular backups** of CouchDB data

### Development
- Development uses separate database names to avoid conflicts
- Development passwords are different from production defaults
- Development environment includes hot reload for faster development

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check if ports are in use
   lsof -i :3000,5984,9002
   
   # Change ports in docker-compose files if needed
   ```

2. **CouchDB connection fails:**
   ```bash
   # Check if CouchDB is healthy
   docker-compose ps
   
   # Check CouchDB logs
   docker-compose logs couchdb
   
   # Test connection manually
   curl http://localhost:5984/_up
   ```

3. **App won't connect to CouchDB:**
   - Verify environment variables are correct
   - Check that CouchDB is healthy before app starts
   - Review app logs: `docker-compose logs taskflow-app`

4. **Development hot reload not working:**
   - Ensure volumes are mounted correctly
   - Check that `node_modules` are not being overwritten
   - Restart the development container

### Cleanup
```bash
# Remove all containers, networks, and volumes
docker-compose down -v
docker system prune -a

# Remove only TaskFlow related containers/volumes
docker-compose down -v
docker volume rm taskflow_couchdb_data taskflow_couchdb_config
```

## 📊 Health Checks

The CouchDB service includes health checks that:
- Ensure the database is responding
- Verify the `_up` endpoint returns successfully
- Automatically restart if unhealthy

Monitor health status:
```bash
docker-compose ps
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up --build -d
```

### Updating CouchDB
```bash
# Backup data first
docker-compose exec couchdb curl -X GET http://admin:password@localhost:5984/_all_dbs

# Update docker-compose.yml with new CouchDB version
# Restart services
docker-compose up -d
```