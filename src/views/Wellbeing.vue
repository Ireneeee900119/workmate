<template>
  <div class="page">
    <!-- Hero / 狀態 -->
    <section class="card hero">
      <div>
        <h1>💙 心理健康關懷</h1>
        <p class="sub">每週 1 次 PHQ-4 快速自評（約 1 分鐘），建立穩定的自我關照節奏。</p>
      </div>
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-num">{{ checkedThisWeek ? '✔' : '—' }}</div>
          <div class="kpi-label">{{ checkedThisWeek ? '本週已完成' : '本週未完成' }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-num">{{ lastTimeText }}</div>
          <div class="kpi-label">上次自評</div>
        </div>
      </div>
    </section>

    <!-- 本週 Check-in 表單 -->
    <section class="card">
      <h2>📝 本週 Check-in</h2>

      <!-- 已完成提示 -->
      <div v-if="checkedThisWeek" class="completed-notice">
        <div class="completed-icon">✅</div>
        <div class="completed-text">
          <h3>您已完成本週心理健康自評</h3>
          <p>感謝您的配合，下週同一時間再次提醒您進行自評。</p>
          <p class="next-time">下次可填寫時間：{{ nextAvailableTime }}</p>
        </div>
      </div>

      <form v-else @submit.prevent="onSubmit">
        <ol class="q-list">
          <li v-for="q in questions" :key="q.key">
            <label class="q-title">{{ q.label }}</label>
            <div class="choices">
              <label v-for="opt in options" :key="opt.v" class="choice">
                <input
                  type="radio"
                  :name="q.key"
                  :value="opt.v"
                  v-model.number="scores[q.key]"
                />
                <span>{{ opt.t }}</span>
              </label>
            </div>
          </li>
        </ol>

        <label class="share">
          <input type="checkbox" v-model="shareWithHR" />
          願意在「高壓」時（僅等級與聯絡意願）匿名通知 HR 協助
        </label>

        <div class="actions">
          <button class="btn" type="submit" :disabled="loading">
            {{ loading ? '提交中...' : '提交自評' }}
          </button>
          <small class="hint">分數將安全儲存至伺服器，僅供個人心理健康追蹤使用。</small>
        </div>
      </form>
    </section>

    <!-- 自評結果 -->
    <section v-if="result" class="card result">
      <h2>📊 自評結果</h2>
      <div class="result-grid">
        <div>
          <div class="metric">總分</div>
          <div class="value">{{ result.total }} / 12</div>
        </div>
        <div>
          <div class="metric">等級</div>
          <div :class="['pill', levelClass(result.level)]">{{ levelText(result.level) }}</div>
        </div>
        <div>
          <div class="metric">HR 通知意願</div>
          <div class="value">{{ shareWithHR ? '同意（高壓才啟用）' : '不同意' }}</div>
        </div>
      </div>
      <p class="advice">{{ result.advice }}</p>
      <div class="links">
        <a href="#" @click.prevent="openResources">查看舒壓資源牆 →</a>
      </div>
    </section>

    <!-- 每日心情打卡 -->
    <section class="card">
      <h2>🙂 每日心情打卡</h2>
      
      <!-- 今日已打卡提示 -->
      <div v-if="moodToday !== null && !showMoodSelector" class="mood-completed">
        <div class="mood-status">
          <div class="current-mood">
            <span class="mood-icon-large">{{ getCurrentMoodIcon() }}</span>
            <div class="mood-info">
              <h3>今日心情已記錄</h3>
              <p>{{ getCurrentMoodLabel() }}</p>
              <small class="mood-time">記錄時間：{{ todayDateText }}</small>
            </div>
          </div>
          <button @click="showMoodSelector = true" class="change-mood-btn">
            修改心情
          </button>
        </div>
      </div>

      <!-- 心情選擇器 -->
      <div v-else>
        <div v-if="moodToday !== null" class="change-notice">
          <p>⚠️ 您今日已記錄心情，確定要修改嗎？</p>
        </div>
        
        <div class="mood-row">
          <button
            v-for="m in moods"
            :key="m.value"
            class="mood-btn"
            :class="{ 
              active: selectedMood === m.value,
              current: moodToday === m.value && selectedMood === null 
            }"
            @click="selectMood(m.value)"
            :title="m.label"
          >
            {{ m.icon }}
          </button>
        </div>
        
        <p class="mood-tip">
          {{ moodToday === null ? '今天感覺如何？選個表情記錄一下' : '選擇新的心情狀態' }}
        </p>
        
        <!-- 確認按鈕 -->
        <div v-if="selectedMood !== null" class="mood-actions">
          <button @click="confirmMood" class="confirm-btn" :disabled="submittingMood">
            {{ submittingMood ? '記錄中...' : '確認記錄' }}
          </button>
          <button @click="cancelMoodSelection" class="cancel-btn">
            取消
          </button>
        </div>
      </div>
      
      <div class="streak" v-if="streakDays > 0">
        已連續打卡 <strong>{{ streakDays }}</strong> 天，太棒了！🎉
      </div>
    </section>

    <!-- 資源牆 -->
    <section class="card">
      <h2>📚 資源牆（精選）</h2>
      <div class="res-grid">
        <div class="res-col">
          <h3>舒壓工具</h3>
          <ul>
            <li>4-7-8 呼吸法（步驟圖解）</li>
            <li>3 分鐘身體掃描（漸進式肌肉放鬆）</li>
            <li>番茄鐘專注（25/5）</li>
          </ul>
        </div>
        <div class="res-col">
          <h3>求助與支持</h3>
          <ul>
            <li>員工協助方案（EAP）｜公司內部協助窗口</li>
            <li>同儕支持社群（匿名分享）</li>
            <li>外部心理諮商資源（清單）</li>
          </ul>
        </div>
        <div class="res-col">
          <h3>工作與生活</h3>
          <ul>
            <li>睡眠衛教：固定就寢儀式</li>
            <li>新人入職 FAQ：壓力與時間管理</li>
            <li>自我關懷清單（5 分鐘版）</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import notificationStore from '../stores/notifications'

// 問卷題目（PHQ-4）
const questions = [
  { key: 'q1', label: '過去 2 週，感到緊張或焦慮的頻率？' },
  { key: 'q2', label: '過去 2 週，無法停止或控制擔心的頻率？' },
  { key: 'q3', label: '過去 2 週，對做事缺乏興趣或樂趣的頻率？' },
  { key: 'q4', label: '過去 2 週，感到沮喪、憂鬱或絕望的頻率？' }
]
const options = [
  { v: 0, t: '沒有' },
  { v: 1, t: '幾天' },
  { v: 2, t: '一半以上天數' },
  { v: 3, t: '幾乎每天' }
]

const scores = reactive({ q1: 0, q2: 0, q3: 0, q4: 0 })
const shareWithHR = ref(false)
const result = ref(null)
const lastAssessment = ref(null)
const loading = ref(false)

// 本週是否已完成 / 上次時間
const checkedThisWeek = computed(() => {
  if (!lastAssessment.value) return false
  const lastDate = new Date(lastAssessment.value.created_at)
  const now = new Date()
  const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24)
  return diffDays < 7
})

const lastTimeText = computed(() => {
  if (!lastAssessment.value) return '—'
  const d = new Date(lastAssessment.value.created_at)
  return d.toLocaleString()
})

const nextAvailableTime = computed(() => {
  if (!lastAssessment.value) return '—'
  const lastDate = new Date(lastAssessment.value.created_at)
  const nextDate = new Date(lastDate)
  nextDate.setDate(nextDate.getDate() + 7)
  return nextDate.toLocaleString()
})

// API 呼叫函數
async function apiCall(url, options = {}) {
  const response = await fetch(`http://localhost:5174/api${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '請求失敗')
  }
  
  return response.json()
}

async function onSubmit() {
  if (loading.value) return
  
  // 檢查是否已完成本週評估
  if (checkedThisWeek.value) {
    alert('您本週已完成心理健康自評，請下週再來填寫。')
    return
  }
  
  try {
    loading.value = true
    const response = await apiCall('/wellbeing/assessment', {
      method: 'POST',
      body: JSON.stringify({
        q1: scores.q1,
        q2: scores.q2,
        q3: scores.q3,
        q4: scores.q4,
        shareWithHR: shareWithHR.value
      })
    })

    result.value = {
      total: response.total,
      level: response.level,
      advice: response.advice
    }

    // 重新載入最新評估
    await loadLatestAssessment()
    
    // 更新通知狀態 - 標記心理健康相關通知為已讀
    notificationStore.checkWellbeingNotification()
    
  } catch (error) {
    console.error('提交心理自評失敗:', error)
    alert('提交失敗：' + error.message)
  } finally {
    loading.value = false
  }
}

// 載入最新的心理自評
async function loadLatestAssessment() {
  try {
    const response = await apiCall('/wellbeing/assessment/latest')
    lastAssessment.value = response.data
  } catch (error) {
    console.error('載入最新評估失敗:', error)
  }
}

// 等級顯示
function levelText(lvl) {
  return ({ low: '低壓', mild: '輕度壓力', moderate: '中度壓力', high: '高壓' })[lvl] || '-'
}
function levelClass(lvl) {
  // 不使用紅色：低=綠、輕度=藍、 中度=橘、 高壓=深灰藍（primary）
  return ({
    low: 'low',
    mild: 'mild',
    moderate: 'moderate',
    high: 'high'
  })[lvl] || ''
}
function openResources() {
  // 你可以把這裡導到 /wellbeing/resources 或外部連結
  alert('可導向更完整的資源頁面（/wellbeing/resources）')
}

// 心情打卡（API 版本）
const moods = [
  { value: 2, label: '心情不錯', icon: '🙂' },
  { value: 1, label: '普通平穩', icon: '😐' },
  { value: 0, label: '有點低落', icon: '☹️' }
]
const moodToday = ref(null)
const streakDays = ref(0)
const selectedMood = ref(null)
const showMoodSelector = ref(false)
const submittingMood = ref(false)
const moodRecordTime = ref(null)

// 選擇心情（不直接提交）
function selectMood(val) {
  selectedMood.value = val
}

// 確認心情記錄
async function confirmMood() {
  if (selectedMood.value === null) return
  
  try {
    submittingMood.value = true
    await apiCall('/wellbeing/mood', {
      method: 'POST',
      body: JSON.stringify({ moodValue: selectedMood.value })
    })
    
    moodToday.value = selectedMood.value
    moodRecordTime.value = new Date().toISOString()
    selectedMood.value = null
    showMoodSelector.value = false
    
    // 重新載入連續打卡天數
    await loadStreak()
    
    // 顯示成功提示
    alert('心情記錄成功！感謝您的分享 😊')
    
  } catch (error) {
    console.error('心情打卡失敗:', error)
    alert('心情打卡失敗：' + error.message)
  } finally {
    submittingMood.value = false
  }
}

// 取消選擇
function cancelMoodSelection() {
  selectedMood.value = null
  showMoodSelector.value = false
}

// 獲取當前心情圖示
function getCurrentMoodIcon() {
  const mood = moods.find(m => m.value === moodToday.value)
  return mood ? mood.icon : '😐'
}

// 獲取當前心情標籤
function getCurrentMoodLabel() {
  const mood = moods.find(m => m.value === moodToday.value)
  return mood ? mood.label : '未知'
}

// 今日日期文字
const todayDateText = computed(() => {
  return new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// 載入今日心情
async function loadMoodToday() {
  try {
    const response = await apiCall('/wellbeing/mood/today')
    moodToday.value = response.moodValue
    if (response.recordTime) {
      moodRecordTime.value = response.recordTime
    }
    // 如果已有心情記錄，預設不顯示選擇器
    if (moodToday.value !== null) {
      showMoodSelector.value = false
    } else {
      showMoodSelector.value = true
    }
  } catch (error) {
    console.error('載入今日心情失敗:', error)
    // 如果載入失敗，預設顯示選擇器
    showMoodSelector.value = true
  }
}

// 載入連續打卡天數
async function loadStreak() {
  try {
    const response = await apiCall('/wellbeing/mood/streak')
    streakDays.value = response.streak
  } catch (error) {
    console.error('載入連續打卡天數失敗:', error)
  }
}

// 檢查登入狀態
async function checkAuthStatus() {
  try {
    const response = await fetch('http://localhost:5174/api/auth/me', {
      credentials: 'include'
    })
    if (!response.ok) {
      console.error('使用者未登入或登入已過期')
      alert('請先登入才能使用心理健康功能')
      return false
    }
    const data = await response.json()
    console.log('當前登入使用者:', data.user)
    return true
  } catch (error) {
    console.error('檢查登入狀態失敗:', error)
    return false
  }
}

// 初始化資料
onMounted(async () => {
  const isLoggedIn = await checkAuthStatus()
  if (isLoggedIn) {
    await Promise.all([
      loadLatestAssessment(),
      loadMoodToday(),
      loadStreak()
    ])
  }
})
</script>

<style scoped>
.page { padding: 20px; }

/* Hero / KPI */
.hero {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; margin-bottom: 12px;
}
.hero h1 { margin: 0; color: var(--text); }
.sub { color: var(--text-light); margin: 4px 0 0; }
.kpis { display: flex; gap: 16px; }
.kpi {
  background: #f0f0f0; border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 14px; min-width: 140px; text-align: center;
}
.kpi-num { color: var(--primary); font-size: 22px; font-weight: 800; line-height: 1; }
.kpi-label { color: var(--text-light); font-size: 12px; margin-top: 4px; }

/* 已完成提示 */
.completed-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-bottom: 16px;
}

.completed-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.completed-text h3 {
  margin: 0 0 8px 0;
  color: #1e40af;
  font-size: 18px;
}

.completed-text p {
  margin: 4px 0;
  color: #374151;
}

.next-time {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* 問卷 */
.q-list { padding-left: 18px; }
.q-title { display: block; margin: 10px 0 6px; font-weight: 600; color: var(--text); }
.choices { display: flex; gap: 12px; flex-wrap: wrap; }
.choice { display: inline-flex; gap: 6px; align-items: center; }
.share { display: block; margin: 12px 0; font-size: 14px; color: var(--text-light); }

.actions { display: flex; align-items: center; gap: 10px; }
.btn {
  padding: 8px 14px; background: var(--primary); color: #fff; border: none;
  border-radius: 6px; cursor: pointer; font-weight: 600;
}
.btn:hover { background: var(--primary-dark); }
.btn:disabled {
  background: #ccc; cursor: not-allowed; opacity: 0.6;
}
.hint { color: var(--text-light); }

/* 結果 */
.result .result-grid {
  display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin: 6px 0 10px;
}
.metric { font-size: 12px; color: var(--text-light); }
.value { font-weight: 700; color: var(--text); }
.pill {
  display: inline-block; padding: 4px 10px; border-radius: 999px; color: #fff; font-weight: 700;
}
.pill.low      { background: var(--success); }  /* 綠 */
.pill.mild     { background: #4682B4; }        /* 藍 */
.pill.moderate { background: #FB8C00; }        /* 橘 */
.pill.high     { background: var(--primary); } /* 深灰藍（不紅） */
.advice { margin-top: 4px; color: var(--text); }
.links a { color: #4682B4; text-decoration: none; }
.links a:hover { text-decoration: underline; }

/* 心情打卡 */
.mood-completed {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.mood-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.current-mood {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mood-icon-large {
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  border: 2px solid #3b82f6;
}

.mood-info h3 {
  margin: 0 0 4px 0;
  color: #1e40af;
  font-size: 16px;
}

.mood-info p {
  margin: 0 0 4px 0;
  color: #374151;
  font-weight: 500;
}

.mood-time {
  color: #6b7280;
  font-size: 12px;
}

.change-mood-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.change-mood-btn:hover {
  background: #e5e7eb;
}

.change-notice {
  background: #fef3cd;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.change-notice p {
  margin: 0;
  color: #92400e;
  font-size: 14px;
  font-weight: 500;
}

.mood-row { 
  display: flex; 
  gap: 10px; 
  margin-bottom: 12px;
}

.mood-btn {
  width: 44px; 
  height: 44px; 
  border-radius: 50%;
  border: 2px solid var(--border); 
  background: #fff; 
  cursor: pointer; 
  font-size: 20px;
  transition: all 0.2s ease;
  position: relative;
}

.mood-btn:hover {
  transform: scale(1.05);
  border-color: #3b82f6;
}

.mood-btn.active { 
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.1);
}

.mood-btn.current {
  border-color: #10b981;
  background: #d1fae5;
}

.mood-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.confirm-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: #059669;
}

.confirm-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.mood-tip { 
  color: var(--text-light); 
  margin: 6px 0 0 0;
  font-size: 14px;
}

.streak { 
  margin-top: 16px;
  padding: 12px;
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 6px;
  color: #065f46;
  font-weight: 500;
  text-align: center;
}

/* 資源牆 */
.res-grid {
  display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.res-col h3 { margin: 0 0 6px; color: var(--text); }
.res-col ul { margin: 0; padding-left: 18px; }
.res-col li { margin: 4px 0; color: var(--text-light); }

/* 卡片通用（沿用你的全域變數） */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

/* RWD */
@media (max-width: 768px) {
  .hero { flex-direction: column; align-items: flex-start; }
  .kpis { width: 100%; }
}
</style>