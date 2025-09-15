<template>
  <div class="page">
    <h1>iGrow & iCare</h1>
    <p>歡迎回來，這裡是你的學習與職場支持總覽。</p>

    <div class="grid">
      <!-- 職涯訓練總覽 -->
      <section class="card">
        <h2>📚 職涯訓練</h2>
        <p>必修完成率：<strong>{{ trainingProgress }}%</strong></p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: trainingProgress + '%' }"></div>
        </div>
        <p class="link"><router-link to="/training">查看課程 →</router-link></p>
      </section>

      <!-- 心理健康 -->
      <section class="card">
        <h2>💙 心理健康關懷</h2>
        <p>本週尚未完成心理健康 Check-in</p>
        <button @click="goWellbeing">立即自評</button>
      </section>

      <!-- 通知預覽 -->
      <section class="card">
        <h2>🔔 最新通知</h2>
        <ul>
          <li v-for="n in notifications" :key="n.id">
            <span>{{ n.title }}</span>
            <small class="time">{{ n.time }}</small>
          </li>
        </ul>
        <p class="link"><router-link to="/notifications">更多通知 →</router-link></p>
      </section>

      <!-- 社群精選 -->
      <section class="card">
        <h2>👥 社群精選</h2>
        <ul>
          <li v-for="p in posts" :key="p.id">
            <strong>{{ p.user }}：</strong> {{ p.content }}
          </li>
        </ul>
        <p class="link"><router-link to="/community">前往社群 →</router-link></p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const trainingProgress = ref(65)

const notifications = ref([
  { id: 1, title: '新人導向課程已完成 80%', time: '2 小時前' },
  { id: 2, title: '本週心理健康 Check-in 開放填寫', time: '1 天前' },
])

const posts = ref([
  { id: 1, user: 'Ivy', content: '竹科租屋小技巧分享～' },
  { id: 2, user: 'Ben', content: '溝通技巧課程好實用！' },
])

function goWellbeing() {
  router.push('/wellbeing')
}
</script>

<style scoped>
.page {
  padding: 20px;
}

.grid {
  margin-top: 20px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card h2 {
  margin-top: 0;
  font-size: 18px;
  margin-bottom: 8px;
}

.progress-bar {
  background: #eee;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}
.progress-fill {
  height: 100%;
  background: #1976d2;
  transition: width 0.3s ease;
}

.link {
  margin-top: 10px;
  font-size: 14px;
}
.link a {
  color: #1976d2;
  text-decoration: none;
}
.link a:hover {
  text-decoration: underline;
}

.time {
  font-size: 12px;
  color: #666;
  margin-left: 6px;
}
</style>