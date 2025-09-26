# Деплой и разработка AI Coach

## Быстрый старт

### Локальная разработка
```bash
# Frontend
npm run dev  # http://localhost:5173

# Backend API (в отдельном терминале)
cd api
npm run dev  # http://localhost:3001
```

### Деплой на продакшн
```bash
git add .
git commit -m "Описание изменений"
git push origin main  # Автодеплой на Vercel
```

## Архитектура

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Express.js API в папке `/api`
- **Деплой**: Vercel (автодеплой из main)
- **URL**: https://jobify-ai-coach.vercel.app

## Workflow разработки

### Для небольших изменений:
1. Работай локально
2. Тестируй в браузере
3. Коммить + пуш в main

### Для больших фич:
1. Создай feature-ветку: `git checkout -b feature/new-feature`
2. Разрабатывай локально
3. Пуш в feature-ветку: `git push origin feature/new-feature`
4. Создай PR на GitHub
5. После ревью мердж в main

## Vercel конфигурация

### vercel.json настроен для:
- SPA роутинг (все запросы → index.html)
- API routes (/api/* → /api/*)
- Автоматический билд: `npm run build`
- Output: папка `dist/`

### Важно для деплоя:
- Build-зависимости в `dependencies` (не devDependencies)
- Это включает: vite, tailwindcss, autoprefixer, postcss

## Откат изменений

### Локально:
```bash
git reset --hard HEAD~1  # Откат последнего коммита
git revert <commit-hash>  # Безопасный откат
```

### На продакшене:
1. **Через Vercel Dashboard**: Deployments → Promote previous
2. **Через Git**: `git revert <commit> && git push origin main`

## Тестирование перед деплоем

```bash
# Локальная сборка
npm run build
npm run preview  # Тест продакшн сборки

# Проверка API
cd api
npm start  # Продакшн режим API
```

## Мониторинг

- **Vercel Dashboard**: статус деплоя, логи
- **GitHub Actions**: при настройке CI/CD
- **Логи ошибок**: Vercel Functions логи для API

## API Endpoints

### Локально:
- Frontend: http://localhost:5173
- API: http://localhost:3001/api

### Продакшн:
- Frontend: https://jobify-ai-coach.vercel.app
- API: https://jobify-ai-coach.vercel.app/api

## Переменные окружения

### Локально (.env):
```
GEMINI_API_KEY=your_key_here
NODE_ENV=development
```

### Vercel:
Настрой в Dashboard → Settings → Environment Variables
