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

      <form @submit.prevent="onSubmit">
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
          <button class="btn" type="submit">提交自評</button>
          <small class="hint">分數僅存於本機（localStorage），你可隨時刪除瀏覽器資料。</small>
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
      <div class="mood-row">
        <button
          v-for="m in moods"
          :key="m.value"
          class="mood-btn"
          :class="{ active: moodToday === m.value }"
          @click="setMood(m.value)"
          :title="m.label"
        >
          {{ m.icon }}
        </button>
      </div>
      <p class="mood-tip">今天感覺如何？選個表情記錄一下</p>
      <div class="streak" v-if="streakDays > 0">
        已連續打卡 <strong>{{ streakDays }}</strong> 天，太棒了！
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
import { reactive, ref, computed } from 'vue'
import wellbeing from '../router/wellbeing' // 之前提供的簡易 store

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

// 本週是否已完成 / 上次時間
const checkedThisWeek = computed(() => wellbeing.checkedThisWeek.value)
const lastTimeText = computed(() => {
  const iso = wellbeing.state.lastCheckISO
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString()
})

function onSubmit() {
  result.value = wellbeing.submit(scores, shareWithHR.value)
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

// 心情打卡（本地儲存）
const moods = [
  { value: 'good', label: '心情不錯', icon: '🙂' },
  { value: 'ok',   label: '普通平穩', icon: '😐' },
  { value: 'bad',  label: '有點低落', icon: '☹️' }
]
const moodToday = ref(loadMoodToday())
const streakDays = ref(loadStreak())

function setMood(val) {
  moodToday.value = val
  const todayKey = getDateKey(new Date())
  const store = JSON.parse(localStorage.getItem('mood-log') || '{}')
  if (store[todayKey] !== val) {
    store[todayKey] = val
    localStorage.setItem('mood-log', JSON.stringify(store))
  }
  streakDays.value = calcStreak(store)
}

function loadMoodToday() {
  const store = JSON.parse(localStorage.getItem('mood-log') || '{}')
  return store[getDateKey(new Date())] || null
}
function loadStreak() {
  const store = JSON.parse(localStorage.getItem('mood-log') || '{}')
  return calcStreak(store)
}
function calcStreak(store) {
  let days = 0
  const d = new Date()
  while (true) {
    const key = getDateKey(d)
    if (store[key]) {
      days++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return days
}
function getDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
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
.mood-row { display: flex; gap: 10px; }
.mood-btn {
  width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid var(--border); background: #fff; cursor: pointer; font-size: 20px;
}
.mood-btn.active { outline: 3px solid #c9dbff; }
.mood-tip { color: var(--text-light); margin-top: 6px; }
.streak { margin-top: 8px; }

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