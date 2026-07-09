# ---------- BUILD STAGE ----------
    FROM node:22.12-alpine AS build

    WORKDIR /app
    
    COPY package*.json ./
    
    RUN npm install
    
    COPY . .
    
    RUN npm run build
    
    
    # ---------- RUNTIME STAGE ----------
    FROM node:22.12-alpine
    
    WORKDIR /app
    
    RUN npm install -g serve
    
    COPY --from=build /app/dist ./dist
    
    EXPOSE 5273
    
    CMD ["serve", "-s", "dist", "-l", "5273"]