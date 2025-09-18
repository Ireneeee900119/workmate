// src/stores/notifications.js
import { reactive, computed } from 'vue'

// 通知狀態
const state = reactive({
  notifications: []
})

// 計算未讀通知數量
const unreadCount = computed(() => 
  state.notifications.filter(n => !n.read).length
)

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

// 檢查心理健康狀態並生成通知
async function checkWellbeingNotification() {
  try {
    const response = await apiCall('/wellbeing/assessment/latest')
    
    // 檢查是否本週已完成
    let needsReminder = true
    if (response.data) {
      const lastDate = new Date(response.data.created_at)
      const now = new Date()
      const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24)
      needsReminder = diffDays >= 7
    }
    
    // 檢查是否已有心理健康提醒通知
    const existingNotification = state.notifications.find(
      n => n.type === 'wellbeing' && !n.read && n.message.includes('本週心理健康')
    )
    
    if (needsReminder && !existingNotification) {
      // 添加新的提醒通知
      addNotification({
        title: '💙 心理健康提醒',
        message: '您本週尚未完成心理健康自評，請抽空填寫以維護您的身心健康。',
        type: 'wellbeing',
        priority: 'high'
      })
    } else if (!needsReminder && existingNotification) {
      // 如果已完成，標記相關通知為已讀
      markAsRead(existingNotification.id)
    }
    
  } catch (error) {
    console.error('檢查心理健康狀態失敗:', error)
  }
}

// 添加新通知
function addNotification(notification) {
  const newNotification = {
    id: Date.now(), // 簡單的 ID 生成
    time: '剛剛',
    read: false,
    ...notification
  }
  
  // 如果是高優先級，插入到最前面
  if (notification.priority === 'high') {
    state.notifications.unshift(newNotification)
  } else {
    state.notifications.push(newNotification)
  }
}

// 標記為已讀
function markAsRead(id) {
  const notification = state.notifications.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

// 標記所有為已讀
function markAllAsRead() {
  state.notifications.forEach(n => n.read = true)
}

// 刪除通知
function removeNotification(id) {
  const index = state.notifications.findIndex(n => n.id === id)
  if (index > -1) {
    state.notifications.splice(index, 1)
  }
}

// 初始化 - 檢查心理健康狀態
async function initialize() {
  try {
    // 檢查登入狀態
    const response = await fetch('http://localhost:5174/api/auth/me', {
      credentials: 'include'
    })
    if (response.ok) {
      await checkWellbeingNotification()
    }
  } catch (error) {
    console.error('初始化通知系統失敗:', error)
  }
}

export default {
  state,
  unreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  checkWellbeingNotification,
  initialize
}
