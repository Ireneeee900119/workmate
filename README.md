# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

# Training Hub

此專案新增了使用 MySQL 的登入／註冊系統（Express + JWT）。

## 後端啟動

1. 建立資料庫與資料表

```sql
CREATE DATABASE IF NOT EXISTS workmate DEFAULT CHARACTER SET utf8mb4;
USE workmate;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(60) DEFAULT 'Member',
  dept VARCHAR(60) DEFAULT 'General',
  avatar_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. 安裝後端相依

```bash
cd server
npm i
```

3. 建立 `.env`

```env
PORT=5174
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=workmate
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES=7d
```

4. 啟動後端

```bash
npm run dev
```

## 前端開發

- 根目錄已設定 Vite 代理 `/api -> http://localhost:5174`
- 開發時啟動：

```bash
npm run dev
```

## API 一覽
- POST `/api/auth/register` { name, email, password }
- POST `/api/auth/login` { email, password }
- GET `/api/auth/me`
- POST `/api/auth/logout`

Cookie 使用 httpOnly JWT，前端請求需附帶 `credentials: 'include'`（已在 `auth.js` 內處理）。
