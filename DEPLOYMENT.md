# Tanawal Admin Portal - Azure Deployment Guide

## Overview
This guide covers deploying the Tanawal Admin Portal to Azure App Service with authentication and .NET API integration.

## Prerequisites
- Azure subscription
- Azure CLI installed
- Node.js 18+ installed
- Your .NET API deployed on Azure

## Deployment Options

### Option 1: Azure App Service (Recommended)

#### 1. Create Azure App Service
```bash
# Create resource group
az group create --name tanawal-rg --location eastus

# Create App Service plan
az appservice plan create --name tanawal-plan --resource-group tanawal-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group tanawal-rg --plan tanawal-plan --name tanawal-admin-portal --runtime "NODE|18-lts"
```

#### 2. Configure Environment Variables
```bash
# Set API URL
az webapp config appsettings set --resource-group tanawal-rg --name tanawal-admin-portal --settings NEXT_PUBLIC_API_URL=https://your-api.azurewebsites.net

# Set authentication secret
az webapp config appsettings set --resource-group tanawal-rg --name tanawal-admin-portal --settings NEXTAUTH_SECRET=your-secret-key

# Set production environment
az webapp config appsettings set --resource-group tanawal-rg --name tanawal-admin-portal --settings NODE_ENV=production
```

#### 3. Deploy from GitHub
```bash
# Configure deployment source
az webapp deployment source config --resource-group tanawal-rg --name tanawal-admin-portal --repo-url https://github.com/your-username/tanawal-admin --branch main --manual-integration
```

### Option 2: Azure Container Instances

#### 1. Build Docker Image
```bash
# Build image
docker build -t tanawal-admin .

# Tag for Azure Container Registry
docker tag tanawal-admin your-registry.azurecr.io/tanawal-admin:latest

# Push to registry
docker push your-registry.azurecr.io/tanawal-admin:latest
```

#### 2. Deploy Container
```bash
# Create container group
az container create --resource-group tanawal-rg --name tanawal-admin-container --image your-registry.azurecr.io/tanawal-admin:latest --ports 3000 --environment-variables NEXT_PUBLIC_API_URL=https://your-api.azurewebsites.net NODE_ENV=production
```

## Configuration

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_API_URL=https://your-api.azurewebsites.net
NEXTAUTH_SECRET=your-secret-key
NODE_ENV=production
```

### API Integration
Update `src/lib/auth.ts` with your .NET API endpoints:
```typescript
private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.azurewebsites.net'
```

## Security Considerations

### 1. HTTPS Only
- Enable HTTPS redirect in Azure App Service
- Set secure cookies for authentication

### 2. CORS Configuration
Configure your .NET API to allow requests from your admin portal domain:
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AdminPortal", builder =>
    {
        builder.WithOrigins("https://your-admin-portal.azurewebsites.net")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});
```

### 3. Authentication
- Use JWT tokens for API authentication
- Implement token refresh mechanism
- Set secure cookie options

## Monitoring

### Application Insights
```bash
# Enable Application Insights
az monitor app-insights component create --app tanawal-admin-insights --location eastus --resource-group tanawal-rg

# Get connection string
az monitor app-insights component show --app tanawal-admin-insights --resource-group tanawal-rg --query connectionString
```

### Log Analytics
- Enable Azure Monitor
- Set up alerts for errors and performance issues
- Monitor API response times

## Performance Optimization

### 1. CDN
- Enable Azure CDN for static assets
- Configure caching headers

### 2. Compression
- Enable gzip compression in Azure App Service
- Optimize images and assets

### 3. Caching
- Implement Redis cache for session data
- Use Azure Cache for Redis

## Backup and Recovery

### 1. Database Backup
- Configure automated backups for your database
- Test restore procedures

### 2. Application Backup
- Use Azure Backup for App Service
- Implement disaster recovery plan

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Authentication Issues
- Verify API endpoints are accessible
- Check CORS configuration
- Validate JWT token format

#### 3. Performance Issues
- Monitor Application Insights
- Check database connection pool
- Optimize API queries

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor security advisories
- Review and rotate secrets
- Test backup and recovery procedures

### Scaling
- Use Azure Auto Scale for traffic spikes
- Implement load balancing for high availability
- Consider Azure Front Door for global distribution

## Support
For issues and questions:
- Check Azure App Service logs
- Review Application Insights
- Monitor API health endpoints
- Contact Azure support if needed
