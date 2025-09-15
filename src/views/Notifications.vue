<template>
  <div class="page">
    <h1>🔔 通知中心</h1>
    <p>查看你的最新通知，保持與課程、社群的即時連結。</p>

    <div class="notification-list">
      <div 
        v-for="n in notifications" 
        :key="n.id" 
        class="notification-item" 
        :class="{ unread: !n.read }"
      >
        <div class="notification-content">
          <h3>{{ n.title }}</h3>
          <p>{{ n.message }}</p>
          <small class="time">{{ n.time }}</small>
        </div>
        <button class="mark-btn" v-if="!n.read" @click="markRead(n.id)">
          標記已讀
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref([
  { id: 1, title: '課程提醒', message: '新人導向課程尚未完成，記得本週結束前完成。', time: '2 小時前', read: false },
  { id: 2, title: '社群互動', message: '你的貼文「竹科租屋小技巧」有 5 則新留言。', time: '1 天前', read: false },
  { id: 3, title: '心理健康', message: '本週心理健康 Check-in 已開放，記得填寫。', time: '2 天前', read: true }
])

function markRead(id) {
  const n = notifications.value.find(item => item.id === id)
  if (n) n.read = true
}
</script>

<style scoped>
.page {
  padding: 20px;
}

.notification-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: background 0.2s;
}

.notification-item.unread {
  background: #f0f7ff;
  border-left: 4px solid #1976d2;
}

.notification-content h3 {
  margin: 0;
  font-size: 16px;
}

.notification-content p {
  margin: 4px 0;
  font-size: 14px;
  color: #555;
}

.time {
  font-size: 12px;
  color: #888;
}

.mark-btn {
  font-size: 12px;
  background: #1976d2;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.mark-btn:hover {
  background: #1565c0;
}
</style>