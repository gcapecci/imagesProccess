# Troubleshooting Docker Build Issues

## Common Issues and Solutions

### Issue: `npm ci` fails with "package-lock.json not found"

**Cause:** The package-lock.json file is not being copied to the Docker build context.

**Solution:**
1. Make sure you're in the project root directory when running docker compose
2. Verify package-lock.json exists: `ls -la package-lock.json`
3. Clean Docker cache: `docker builder prune -a`
4. Rebuild: `docker compose build --no-cache`

### Issue: Build fails with "frontend builder" stage not found

**Cause:** You may have a custom Dockerfile that references stages not in the provided configuration.

**Solution:**
Use the provided Dockerfiles:
- `Dockerfile` - for production builds
- `Dockerfile.dev` - for development builds

### Issue: Sharp library compilation errors

**Cause:** Missing build dependencies or architecture mismatch.

**Solution:**
The Dockerfiles include all necessary dependencies. If you still have issues:
```bash
docker compose down
docker system prune -a
docker compose up --build
```

### Issue: Permission denied on uploads directory

**Cause:** The container user doesn't have write permissions.

**Solution:**
```bash
mkdir -p public/uploads
chmod 777 public/uploads
```

### Issue: Frontend fails with "ENOENT: no such file or directory" for index.html

**Cause:** Angular cache corruption (`.angular/cache`) inside the Docker volume. This often happens after checking out a different branch or interrupting the container abruptly.

**Solution:**
Clear the local cache and rebuild:
```bash
docker compose --profile dev down
rm -rf frontend/.angular
docker compose --profile dev up -d --build
```

## Clean Build Steps

If you're experiencing persistent issues, follow these steps:

```bash
# 1. Stop all containers
docker compose down

# 2. Remove all images
docker rmi $(docker images -q imagesproccess* 2>/dev/null) 2>/dev/null || true

# 3. Clean build cache
docker builder prune -af

# 4. Verify files exist
ls -la package*.json Dockerfile docker-compose.yml

# 5. Build fresh
docker compose build --no-cache

# 6. Start
docker compose up -d
```

## Development vs Production

### Development Mode
```bash
docker compose -f docker-compose.dev.yml up
```
- Hot reload enabled
- Source code mounted as volume
- Full logging

### Production Mode
```bash
docker compose up -d
```
- Optimized build
- No source code mounting
- Production dependencies only

## Checking Logs

```bash
# View logs
docker compose logs -f

# Check specific service
docker compose logs -f app

# Check build output
docker compose build
```

## System Requirements

- Docker 20.10+
- Docker Compose V2
- At least 2GB free disk space
- Internet connection for downloading dependencies
