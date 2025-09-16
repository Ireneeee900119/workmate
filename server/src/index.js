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

app.listen(PORT, () => {
	console.log(`[server] listening on http://localhost:${PORT}`)
}) 