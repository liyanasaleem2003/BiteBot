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
- Deployed at: https://bitebot.onrender.com
- Service: Render Web Service (Python)
- Environment Variables: Set in Render dashboard (see below)

#### Frontend Deployment
- Deployed at: https://bitebot-frontend.onrender.com
- Service: Render Web Service (Node)
- Environment Variables:
  - REACT_APP_API_BASE_URL: https://bitebot.onrender.com

### 4. MongoDB Setup
- Use MongoDB Atlas for production
- Connection string must use SSL/TLS (no ssl=false or tls=false)
- Example: mongodb+srv://<user>:<pass>@<cluster-url>.mongodb.net/<dbname>?retryWrites=true&w=majority
- Update the MONGO_URI in your Render backend environment variables

### 5. CI/CD
- Both GitHub Actions and GitLab CI/CD are supported
- Pushing to either platform will trigger builds and deployments to Render

### 6. Domain and SSL Setup
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