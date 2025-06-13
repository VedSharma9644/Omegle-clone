# Random Chat Application

A full-stack web application similar to Omegle with text, voice, and video chat capabilities.

## Features

- Random text chat
- Random voice chat
- Random video chat
- Real-time matchmaking
- Global online user count
- Responsive design for mobile and desktop
- WebRTC peer-to-peer connections
- No login required
- No data storage

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Project Structure

```
random-chat/
├── client/                 # React frontend
│   ├── public/
│   └── src/
├── server/                 # Node.js backend
│   ├── server.js
│   └── package.json
├── package.json           # Root package.json
├── Dockerfile
├── .dockerignore
└── cloudbuild.yaml
```

## Setup

1. Install all dependencies:
   ```bash
   npm run install-all
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Building for Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. The backend will serve the built frontend files automatically

## Deployment

The application is designed to be deployed on Google Cloud Run. Follow these steps to deploy:

1. Install the Google Cloud SDK and initialize your project:
   ```bash
   gcloud init
   ```

2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   ```

3. Build and deploy using Cloud Build:
   ```bash
   gcloud builds submit
   ```

4. Set environment variables in Cloud Run:
   ```bash
   gcloud run services update random-chat \
     --update-env-vars REACT_APP_SOCKET_URL=https://your-service-url
   ```

### Environment Variables

The following environment variables need to be set in production:

- `REACT_APP_SOCKET_URL`: The URL of your deployed service
- `PORT`: The port the server will listen on (default: 8080)
- `NODE_ENV`: Set to 'production' in production

### Manual Deployment

If you prefer to deploy manually:

1. Build the Docker image:
   ```bash
   docker build -t gcr.io/[PROJECT_ID]/random-chat .
   ```

2. Push to Google Container Registry:
   ```bash
   docker push gcr.io/[PROJECT_ID]/random-chat
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy random-chat \
     --image gcr.io/[PROJECT_ID]/random-chat \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

Replace `[PROJECT_ID]` with your Google Cloud project ID.

## Technical Details

- Frontend: React with React Router and styled-components
- Backend: Node.js with Express and Socket.IO
- WebRTC: simple-peer for peer-to-peer connections
- UI Components: lucide-react for icons and UI elements
- STUN Server: Google's public STUN server (stun:stun.l.google.com:19302)

## Dependencies

### Backend
- express
- socket.io
- cors
- dotenv

### Frontend
- react
- react-dom
- react-router-dom
- styled-components
- socket.io-client
- simple-peer
- lucide-react

## Security Notes

- No user data is stored
- No moderation system
- No analytics
- Uses WebRTC for peer-to-peer connections
- HTTPS required for media access in production

## License

MIT 