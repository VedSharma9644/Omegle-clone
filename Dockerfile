# --- Frontend Build Stage ---
    FROM node:18-alpine as frontend-build

    WORKDIR /app
    
    COPY client/package*.json ./client/
    RUN cd client && npm install
    
    COPY client ./client
    RUN cd client && npm run build
    
    # --- Backend Stage (Production) ---
    FROM node:18-alpine
    
    WORKDIR /app
    
    # Install backend dependencies
    COPY server/package*.json ./server/
    RUN cd server && npm install
    
    # Copy backend source
    COPY server ./server
    
    # Copy built frontend into backend (assuming server serves it)
    COPY --from=frontend-build /app/client/build ./server/client/build
    
    # Set environment variables
    ENV NODE_ENV=production
    ENV PORT=8080
    
    WORKDIR /app/server
    
    EXPOSE 8080
    
    CMD ["node", "server.js"]
    