# Node.js LTS версия с Alpine для минимального размера
FROM node:20-alpine

WORKDIR /app

# Копируем package.json и lock-файл для кэширования зависимостей
# Тот же принцип что и в Python - сначала зависимости, потом код
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код (перезаписывается volumes в dev)
COPY . .

# Порт Vite dev server
EXPOSE 5173

# Запуск dev-сервера с доступом извне контейнера
# --host важен: по умолчанию Vite слушает только localhost
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
