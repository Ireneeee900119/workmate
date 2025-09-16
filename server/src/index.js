import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createPool } from 'mysql2/promise'

const app = express()
const PORT = process.env.PORT || 5174

// DB pool
export const db = createPool({
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'workmate',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
})

async function initTables() {
	const DB_NAME = process.env.DB_NAME || 'workmate'

	// users 表（若不存在則建立）。若已存在，不會改變其現有引擎與結構。
	await db.query(`CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(255) NOT NULL UNIQUE,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(50) DEFAULT 'Member',
		dept VARCHAR(100) DEFAULT 'General',
		avatar_url VARCHAR(500) NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

	// 讀取 users.id 型別與 users 表的引擎
	const [colRows] = await db.query(
		"SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'",
		[DB_NAME]
	)
	const authorColumnType = colRows[0]?.COLUMN_TYPE || 'INT'

	const [tblRows] = await db.query(
		"SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
		[DB_NAME]
	)
	const usersEngine = (tblRows[0]?.ENGINE || 'InnoDB').toUpperCase()
	const useForeignKey = usersEngine === 'INNODB'
	const engineClause = `ENGINE=${usersEngine} DEFAULT CHARSET=utf8mb4`

	const baseCreate = `CREATE TABLE IF NOT EXISTS posts (
		id INT AUTO_INCREMENT PRIMARY KEY,
		author_id ${authorColumnType} NOT NULL,
		content TEXT NOT NULL,
		image_url VARCHAR(500) NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

	const fkOrIndex = useForeignKey
		? ', FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE'
		: ', INDEX idx_posts_author_id (author_id)'

	const createSql = baseCreate + fkOrIndex + `) ${engineClause}`

	try {
		await db.query(createSql)
	} catch (err) {
		console.warn('建立 posts（含外鍵）失敗，改用無外鍵版本：', err?.code || err)
		const fallbackSql = baseCreate + ', INDEX idx_posts_author_id (author_id)) ' + engineClause
		await db.query(fallbackSql)
	}
}

// middlewares
app.use(cors({
	origin: (origin, cb) => cb(null, true),
	credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => {
	res.json({ ok: true })
})

// auth routes
import authRouter from './routes/auth.js'
app.use('/api/auth', authRouter)

// posts routes
import postsRouter from './routes/posts.js'

await initTables().catch(err => {
	console.error('資料表初始化失敗', err)
	process.exit(1)
})

app.use('/api/posts', postsRouter)

app.listen(PORT, () => {
	console.log(`[server] listening on http://localhost:${PORT}`)
}) 