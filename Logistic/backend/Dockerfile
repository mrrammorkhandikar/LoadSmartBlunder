FROM node:20-alpine

WORKDIR /workspace/backend

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY backend/package*.json ./
RUN npm install --include=dev

COPY backend/. .

RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

EXPOSE 5000

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run start; else npm run dev; fi"]
