import express from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../index.js'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

async function authRequired(req, res, next) {
	try {
		const token = req.cookies?.token
		if (!token) return res.status(401).json({ error: '未登入' })
		let payload
		try {
			payload = jwt.verify(token, JWT_SECRET)
		} catch {
			return res.status(401).json({ error: '登入逾期' })
		}
		req.userId = payload.uid
		next()
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: '伺服器錯誤' })
	}
}

router.post('/', authRequired, async (req, res) => {
	try {
		const { content, imageUrl = null } = req.body || {}
		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			return res.status(400).json({ error: '內容不可為空' })
		}
		const [result] = await db.query(
			'INSERT INTO posts (author_id, content, image_url) VALUES (?,?,?)',
			[req.userId, content.trim(), imageUrl]
		)
		const [rows] = await db.query(
			`SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at AS createdAt, p.updated_at AS updatedAt,
				u.id AS authorId, u.name AS authorName, u.avatar_url AS authorAvatarUrl, u.dept AS authorDept
				FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = ?`,
			[result.insertId]
		)
		res.status(201).json({ post: rows[0] })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

router.get('/', async (req, res) => {
	try {
		const [rows] = await db.query(
			`SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at AS createdAt, p.updated_at AS updatedAt,
				u.id AS authorId, u.name AS authorName, u.avatar_url AS authorAvatarUrl, u.dept AS authorDept
				FROM posts p JOIN users u ON u.id = p.author_id
				ORDER BY p.created_at DESC`
		)
		res.json({ posts: rows })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

export default router 