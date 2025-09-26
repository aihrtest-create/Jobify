# Настройка деплоя на Vercel

## Структура проекта

- **Фронтенд**: React + Vite (корневая папка) → статический сайт на Vercel
- **Бэкенд**: Node.js + Express (папка `/api`) → Vercel Functions

## Переменные окружения для Vercel

После создания проекта на Vercel, добавьте следующие переменные окружения в настройках проекта:

### Обязательные переменные:
```
NODE_ENV=production
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Опциональные переменные:
```
FRONTEND_URL=https://your-domain.vercel.app
```

## Инструкции по деплою:

1. **Создайте репозиторий на GitHub** (если еще не создан)
2. **Подключите к Vercel**:
   - Зайдите на [vercel.com](https://vercel.com)
   - Нажмите "New Project"
   - Импортируйте ваш GitHub репозиторий
   - Vercel автоматически определит настройки из `vercel.json`

3. **Настройте переменные окружения**:
   - В настройках проекта Vercel перейдите в "Environment Variables"
   - Добавьте переменные из списка выше

4. **Деплой**:
   - Vercel автоматически задеплоит при push в main ветку
   - Фронтенд будет доступен по основному URL
   - API будет доступно по `/api/*` маршрутам

## Локальная разработка:

```bash
# Установка зависимостей
npm install
cd api && npm install

# Запуск фронтенда
npm run dev

# Запуск бэкенда (в отдельном терминале)
cd api && npm run dev
```

## Структура API маршрутов:

- `GET /api/health` - проверка здоровья API
- `POST /api/chat` - чат с ИИ
- `POST /api/plan-interview` - планирование интервью
- `POST /api/feedback` - генерация обратной связи
- `POST /api/cover-letter` - генерация сопроводительного письма
- `GET /api/test-gemini` - тестирование Gemini API
