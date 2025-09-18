<template>
  <div class="page">
    <h1>🔔 通知中心</h1>
    <p>查看你的最新通知，保持與課程、社群的即時連結。</p>

    <!-- 操作按鈕 -->
    <div class="notification-actions" v-if="notificationStore.unreadCount.value > 0">
      <button @click="markAllAsRead" class="mark-all-btn">
        全部標記為已讀 ({{ notificationStore.unreadCount.value }})
      </button>
    </div>

    <div class="notification-list">
      <div 
        v-for="n in notificationStore.state.notifications" 
        :key="n.id" 
        class="notification-item" 
        :class="{ 
          unread: !n.read,
          'high-priority': n.priority === 'high'
        }"
      >
        <div class="notification-icon">
          <span v-if="n.type === 'wellbeing'">💙</span>
          <span v-else-if="n.type === 'training'">📚</span>
          <span v-else-if="n.type === 'community'">👥</span>
          <span v-else>🔔</span>
        </div>
        
        <div class="notification-content">
          <h3>{{ n.title }}</h3>
          <p>{{ n.message }}</p>
          <small class="time">{{ n.time }}</small>
        </div>
        
        <div class="notification-actions-item">
          <button class="mark-btn" v-if="!n.read" @click="markRead(n.id)">
            標記已讀
          </button>
          <button class="delete-btn" @click="deleteNotification(n.id)" :title="'刪除通知'">
            ×
          </button>
        </div>
      </div>
      
      <!-- 空狀態 -->
      <div v-if="notificationStore.state.notifications.length === 0" class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>暫無通知</h3>
        <p>當有新的課程、社群或健康提醒時，會在這裡顯示。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import notificationStore from '../stores/notifications'

function markRead(id) {
  notificationStore.markAsRead(id)
}

function markAllAsRead() {
  notificationStore.markAllAsRead()
}

function deleteNotification(id) {
  if (confirm('確定要刪除這則通知嗎？')) {
    notificationStore.removeNotification(id)
  }
}

// 當進入通知頁面時，重新檢查心理健康狀態
onMounted(() => {
  notificationStore.checkWellbeingNotification()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.notification-actions {
  margin: 16px 0;
  display: flex;
  justify-content: flex-end;
}

.mark-all-btn {
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

.mark-all-btn:hover {
  background: #059669;
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
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.2s;
  position: relative;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.notification-item.unread {
  background: #f0f7ff;
  border-left: 4px solid #1976d2;
}

.notification-item.high-priority {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
}

.notification-item.high-priority.unread {
  background: #fef2f2;
  animation: highlight 3s ease-in-out;
}

@keyframes highlight {
  0%, 100% { background: #fef2f2; }
  50% { background: #fee2e2; }
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
}

.notification-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.time {
  font-size: 12px;
  color: #9ca3af;
}

.notification-actions-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.mark-btn {
  font-size: 12px;
  background: #1976d2;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mark-btn:hover {
  background: #1565c0;
}

.delete-btn {
  font-size: 16px;
  background: none;
  color: #9ca3af;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 18px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .notification-item {
    padding: 12px;
  }
  
  .notification-actions-item {
    flex-direction: row;
    align-items: center;
  }
  
  .notification-actions {
    justify-content: center;
  }
}
</style>