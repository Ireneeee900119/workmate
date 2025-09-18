import express from 'express'
import { db } from '../index.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// JWT 驗證中間件
function verifyToken(req, res, next) {
	const token = req.cookies.token
	console.log('Wellbeing API - Token 檢查:', !!token)
	
	if (!token) {
		console.log('Wellbeing API - 沒有找到 token')
		return res.status(401).json({ error: '需要登入' })
	}

	try {
		const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
		const decoded = jwt.verify(token, JWT_SECRET)
		console.log('Wellbeing API - Token 解碼成功:', decoded)
		
		// 使用 uid 而不是 id，與 auth.js 保持一致
		req.userId = decoded.uid
		console.log('Wellbeing API - 設定 userId:', req.userId)
		next()
	} catch (err) {
		console.error('Wellbeing API - JWT 驗證失敗:', err.message)
		return res.status(401).json({ error: '無效的 token' })
	}
}

// 計算壓力等級
function calculateLevel(totalScore) {
	if (totalScore <= 2) return 'low'
	if (totalScore <= 5) return 'mild'
	if (totalScore <= 8) return 'moderate'
	return 'high'
}

// 提交心理自評
router.post('/assessment', verifyToken, async (req, res) => {
	try {
		const { q1, q2, q3, q4, shareWithHR } = req.body
		const userId = req.userId

		// 驗證分數範圍 (0-3)
		const scores = [q1, q2, q3, q4]
		for (const score of scores) {
			if (score < 0 || score > 3 || !Number.isInteger(score)) {
				return res.status(400).json({ error: '分數必須為 0-3 的整數' })
			}
		}

		const totalScore = q1 + q2 + q3 + q4
		const level = calculateLevel(totalScore)

		// 插入資料庫
		const [result] = await db.query(
			`INSERT INTO wellbeing_assessments 
			(user_id, q1_score, q2_score, q3_score, q4_score, total_score, level, share_with_hr) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[userId, q1, q2, q3, q4, totalScore, level, shareWithHR ? 1 : 0]
		)

		// 回傳建議文字
		const advice = getAdvice(level)

		res.json({
			success: true,
			id: result.insertId,
			total: totalScore,
			level,
			advice
		})
	} catch (error) {
		console.error('提交心理自評失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 取得使用者的心理自評歷史
router.get('/assessment/history', verifyToken, async (req, res) => {
	try {
		const userId = req.userId
		const limit = parseInt(req.query.limit) || 10
		
		const [rows] = await db.query(
			`SELECT * FROM wellbeing_assessments 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT ?`,
			[userId, limit]
		)

		res.json({ success: true, data: rows })
	} catch (error) {
		console.error('取得心理自評歷史失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 取得最新的心理自評
router.get('/assessment/latest', verifyToken, async (req, res) => {
	try {
		const userId = req.userId
		
		const [rows] = await db.query(
			`SELECT * FROM wellbeing_assessments 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT 1`,
			[userId]
		)

		if (rows.length === 0) {
			return res.json({ success: true, data: null })
		}

		res.json({ success: true, data: rows[0] })
	} catch (error) {
		console.error('取得最新心理自評失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 提交每日心情打卡
router.post('/mood', verifyToken, async (req, res) => {
	try {
		const { moodValue } = req.body
		const userId = req.userId
		const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式

		// 驗證心情值 (0-2: 0=bad, 1=ok, 2=good)
		if (moodValue < 0 || moodValue > 2 || !Number.isInteger(moodValue)) {
			return res.status(400).json({ error: '心情值必須為 0-2 的整數' })
		}

		// 使用 ON DUPLICATE KEY UPDATE 來處理同一天重複打卡
		await db.query(
			`INSERT INTO mood_checkins (user_id, mood_value, mood_date) 
			VALUES (?, ?, ?) 
			ON DUPLICATE KEY UPDATE mood_value = VALUES(mood_value), updated_at = CURRENT_TIMESTAMP`,
			[userId, moodValue, today]
		)

		res.json({ success: true, message: '心情打卡成功' })
	} catch (error) {
		console.error('心情打卡失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 取得心情打卡歷史
router.get('/mood/history', verifyToken, async (req, res) => {
	try {
		const userId = req.userId
		const days = parseInt(req.query.days) || 30
		
		const [rows] = await db.query(
			`SELECT mood_value, mood_date FROM mood_checkins 
			WHERE user_id = ? AND mood_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			ORDER BY mood_date DESC`,
			[userId, days]
		)

		res.json({ success: true, data: rows })
	} catch (error) {
		console.error('取得心情歷史失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 計算連續打卡天數
router.get('/mood/streak', verifyToken, async (req, res) => {
	try {
		const userId = req.userId
		
		// 取得最近的打卡記錄，按日期倒序
		const [rows] = await db.query(
			`SELECT mood_date FROM mood_checkins 
			WHERE user_id = ? 
			ORDER BY mood_date DESC`,
			[userId]
		)

		if (rows.length === 0) {
			return res.json({ success: true, streak: 0 })
		}

		// 計算連續天數
		let streak = 0
		const today = new Date()
		let currentDate = new Date(today)

		for (const row of rows) {
			const moodDate = new Date(row.mood_date)
			const expectedDateStr = currentDate.toISOString().split('T')[0]
			const moodDateStr = moodDate.toISOString().split('T')[0]

			if (expectedDateStr === moodDateStr) {
				streak++
				currentDate.setDate(currentDate.getDate() - 1)
			} else {
				break
			}
		}

		res.json({ success: true, streak })
	} catch (error) {
		console.error('計算連續打卡天數失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 取得今日心情
router.get('/mood/today', verifyToken, async (req, res) => {
	try {
		const userId = req.userId
		const today = new Date().toISOString().split('T')[0]
		
		const [rows] = await db.query(
			`SELECT mood_value FROM mood_checkins 
			WHERE user_id = ? AND mood_date = ?`,
			[userId, today]
		)

		const moodValue = rows.length > 0 ? rows[0].mood_value : null
		res.json({ success: true, moodValue })
	} catch (error) {
		console.error('取得今日心情失敗:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

// 建議文字函數
function getAdvice(level) {
	switch (level) {
		case 'low':
			return '狀態良好，持續規律作息與運動，維持社交互動。'
		case 'mild':
			return '輕度壓力，試試呼吸練習、散步、與同事/朋友聊聊。'
		case 'moderate':
			return '中度壓力，建議使用資源牆，或與主管/HR 討論調整。'
		case 'high':
			return '高壓指標，建議儘速使用員工協助方案或預約專業諮詢。'
		default:
			return ''
	}
}

export default router
