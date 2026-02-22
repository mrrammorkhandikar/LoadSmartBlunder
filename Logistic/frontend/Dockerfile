FROM node:20-alpine

WORKDIR /workspace/frontend

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

COPY frontend/package*.json ./
RUN npm install

COPY frontend/. .

RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

EXPOSE 5173

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run preview -- --host 0.0.0.0 --port 5173; else npm run dev -- --host 0.0.0.0 --port 5173; fi"]
