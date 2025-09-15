// src/stores/wellbeing.js
import { reactive, computed } from 'vue'

// 狀態
const state = reactive({
  lastCheckISO: null,              // 上次自評時間
  scores: { q1: 0, q2: 0, q3: 0, q4: 0 }, // PHQ-4 四題
  level: null,                     // low | mild | moderate | high
  advice: '',                      // 建議文字
  shareWithHR: false               // 是否同意通知 HR
})

// 計算總分
const totalScore = computed(() =>
  (state.scores.q1 || 0) +
  (state.scores.q2 || 0) +
  (state.scores.q3 || 0) +
  (state.scores.q4 || 0)
)

// 判斷本週是否已完成
const checkedThisWeek = computed(() => {
  if (!state.lastCheckISO) return false
  const last = new Date(state.lastCheckISO)
  const now = new Date()
  const diffDays = (now - last) / (1000 * 60 * 60 * 24)
  return diffDays < 7
})

// 分級邏輯
function levelBy(total) {
  if (total <= 2) return 'low'
  if (total <= 5) return 'mild'
  if (total <= 8) return 'moderate'
  return 'high'
}

// 建議文字
function adviceBy(level) {
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

// 儲存到 localStorage
function save() {
  localStorage.setItem(
    'wellbeing',
    JSON.stringify({
      lastCheckISO: state.lastCheckISO,
      scores: { ...state.scores },
      level: state.level,
      advice: state.advice,
      shareWithHR: state.shareWithHR
    })
  )
}

// 載入 localStorage
function load() {
  const raw = localStorage.getItem('wellbeing')
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    state.lastCheckISO = data.lastCheckISO || null
    state.scores = { ...(data.scores || {}) }
    state.level = data.level || null
    state.advice = data.advice || ''
    state.shareWithHR = !!data.shareWithHR
  } catch (e) {
    console.warn('Load wellbeing store failed', e)
  }
}
load()

// 提交問卷
function submit(scores, shareWithHR = false) {
  state.scores = { ...scores }
  const total = totalScore.value
  state.level = levelBy(total)
  state.advice = adviceBy(state.level)
  state.shareWithHR = !!shareWithHR
  state.lastCheckISO = new Date().toISOString()
  save()
  return { total, level: state.level, advice: state.advice }
}

export default {
  state,
  totalScore,
  checkedThisWeek,
  submit
}