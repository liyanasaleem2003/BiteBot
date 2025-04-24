# Deployment Guide for BiteBot

## Prerequisites
- Docker and Docker Compose installed
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key
- Render account (or alternative hosting platform)

## Deployment Steps

### 1. Environment Setup
1. Copy `.env.example` to `.env` in the root directory
2. Fill in all required environment variables in `.env`
3. Make sure your MongoDB connection string is correct
4. Add your OpenAI API key

### 2. Local Deployment with Docker
```bash
# Build and start all services
docker-compose up --build

# To run in detached mode
docker-compose up -d --build
```

### 3. Deployment to Render

#### Backend Deployment
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:
   - Name: bitebot-backend
   - Environment: Docker
   - Branch: main
   - Root Directory: backend
   - Environment Variables: Add all variables from .env
   - Build Command: docker build -t bitebot-backend .
   - Start Command: docker run -p 8000:8000 bitebot-backend

#### Frontend Deployment
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Configure the following:
   - Name: bitebot-frontend
   - Environment: Node
   - Branch: main
   - Root Directory: frontend
   - Build Command: npm install && npm run build
   - Publish Directory: build
   - Environment Variables:
     - REACT_APP_API_BASE_URL: Your backend URL

### 4. MongoDB Setup
1. Use MongoDB Atlas for production
2. Create a new cluster
3. Set up proper security rules
4. Update the MONGODB_URL in your environment variables

### 5. Domain and SSL Setup
1. Configure custom domain in Render
2. Set up SSL certificates
3. Update CORS settings in backend if needed

## Monitoring and Maintenance
- Set up logging in Render
- Monitor MongoDB Atlas metrics
- Set up alerts for API usage
- Regular backups of MongoDB data

## Troubleshooting
- Check Render logs for errors
- Verify environment variables
- Ensure MongoDB connection is working
- Check OpenAI API key validity

## Security Considerations
- Keep API keys secure
- Use environment variables
- Implement proper CORS policies
- Set up rate limiting
- Use HTTPS for all connections 