<template>
  <div class="page">
    <h1>👥 社群</h1>
    <p>分享生活、職場心得、技術交流，打造多元友善的職場社群。</p>

    <!-- 登入提示 -->
    <div v-if="!isLoggedIn" class="auth-notice">
      <p>請先登入才能發文與互動 📝</p>
      <router-link to="/login" class="login-link">前往登入</router-link>
    </div>

    <!-- 發文框 -->
    <div v-if="isLoggedIn" class="post-box">
      <textarea v-model="newPost" placeholder="分享你的想法..." />
      <div class="actions">
        <select v-model="selectedTag">
          <option value="生活">生活</option>
          <option value="租屋">租屋</option>
          <option value="美食">美食</option>
          <option value="心情">心情</option>
          <option value="技術">技術</option>
        </select>
        <input type="file" @change="onImageUpload" />
        <button :disabled="!newPost.trim() || isPosting" @click="addPost">
          {{ isPosting ? '發佈中...' : '發佈' }}
        </button>
      </div>
    </div>

    <!-- 排序選單 -->
    <div class="sort-bar">
      <label>排序：</label>
      <select v-model="sortBy">
        <option value="latest">最新</option>
        <option value="popular">熱門</option>
        <option value="mine" v-if="isLoggedIn">我的貼文</option>
      </select>
      <button @click="fetchPosts" class="refresh-btn">🔄 重新整理</button>
    </div>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading">載入中...</div>

    <!-- 貼文牆 -->
    <div class="feed">
      <div v-for="post in sortedPosts" :key="post.id" class="post-card">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar">{{ post.authorName?.[0] || '?' }}</div>
            <div>
              <strong>{{ post.authorName }}</strong>
              <div class="dept">{{ post.authorDept }}</div>
              <div class="time">{{ formatTime(post.createdAt) }}</div>
            </div>
          </div>
          <span class="tag">{{ post.tag || '一般' }}</span>
        </div>

        <p class="post-content">{{ post.content }}</p>
        <img v-if="post.imageUrl" :src="post.imageUrl" alt="post image" class="post-image" />

        <div class="post-footer">
          <button
            @click="likePost(post.id)"
            :disabled="!isLoggedIn"
            :class="{ 'liked': post.liked }"
          >
            {{ post.liked ? '❤️' : '👍' }} {{ post.likes || 0 }}
          </button>
          <button @click="toggleComments(post.id)">💬 {{ post.comments?.length || 0 }}</button>
          <button @click="bookmarkPost(post.id)" :disabled="!isLoggedIn">
            ⭐ {{ post.bookmarked ? '已收藏' : '收藏' }}
          </button>
          <button @click="sharePost(post.id)">🔗 分享</button>
        </div>

        <!-- 留言區 -->
        <div v-if="post.showComments" class="comments">
          <div
            v-for="(c, idx) in post.comments"
            :key="idx"
            class="comment"
          >
            <strong>{{ c.user }}：</strong> {{ c.text }}
            <div class="time">{{ c.time }}</div>
          </div>
          <div v-if="isLoggedIn" class="comment-box">
            <input
              v-model="newComments[post.id]"
              placeholder="寫下留言..."
              @keyup.enter="addComment(post.id)"
            />
            <button @click="addComment(post.id)">送出</button>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-if="!isLoading && posts.length === 0" class="empty-state">
        <p>還沒有任何貼文，成為第一個發文的人吧！ 🚀</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 狀態管理
const posts = ref([])
const currentUser = ref(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)
const isPosting = ref(false)

// 表單狀態
const newPost = ref('')
const selectedTag = ref('生活')
const newComments = ref({})
const sortBy = ref('latest')
const uploadedImage = ref(null)

// 檢查登入狀態
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      currentUser.value = data.user
      isLoggedIn.value = true
    } else {
      currentUser.value = null
      isLoggedIn.value = false
    }
  } catch (error) {
    console.error('檢查登入狀態失敗:', error)
    currentUser.value = null
    isLoggedIn.value = false
  }
}

// 載入貼文
async function fetchPosts() {
  isLoading.value = true
  try {
    const response = await fetch('/api/posts', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      // 轉換後端資料格式為前端需要的格式
      posts.value = data.posts.map(post => ({
        ...post,
        likes: post.likes_count || 0,
        comments: [],
        showComments: false,
        bookmarked: false,
        liked: false,
        tag: post.tag || '一般'
      }))

      // 為每個貼文獲取點讚狀態和留言
      for (const post of posts.value) {
        await fetchLikeStatus(post.id)
        await fetchPostComments(post.id)
      }
    } else {
      console.error('載入貼文失敗:', response.status)
    }
  } catch (error) {
    console.error('載入貼文失敗:', error)
  } finally {
    isLoading.value = false
  }
}

// 獲取貼文點讚狀態
async function fetchLikeStatus(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}/like-status`, { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.liked = data.liked
      }
    }
  } catch (error) {
    console.error('獲取點讚狀態失敗:', error)
  }
}

// 獲取貼文留言
async function fetchPostComments(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.comments = data.comments
      }
    }
  } catch (error) {
    console.error('獲取留言失敗:', error)
  }
}

// 發文
async function addPost() {
  if (!newPost.value.trim() || !isLoggedIn.value) return

  isPosting.value = true
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content: newPost.value.trim(),
        tag: selectedTag.value,
        imageUrl: uploadedImage.value
      })
    })

    if (response.ok) {
      const data = await response.json()
      // 將新貼文加到列表最前面
      posts.value.unshift({
        ...data.post,
        likes: data.post.likes_count || 0,
        comments: [],
        showComments: false,
        bookmarked: false,
        liked: false,
        tag: selectedTag.value
      })

      // 清空表單
      newPost.value = ''
      uploadedImage.value = null
      selectedTag.value = '生活'
    } else {
      const error = await response.json()
      alert(error.error || '發文失敗')
    }
  } catch (error) {
    console.error('發文失敗:', error)
    alert('發文失敗，請稍後再試')
  } finally {
    isPosting.value = false
  }
}

function onImageUpload(e) {
  const file = e.target.files[0]
  if (file) {
    // 這裡應該上傳到伺服器，目前先用本地預覽
    uploadedImage.value = URL.createObjectURL(file)
  }
}

async function likePost(id) {
  if (!isLoggedIn.value) return

  try {
    const response = await fetch(`/api/posts/${id}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      const post = posts.value.find(p => p.id === id)
      if (post) {
        post.liked = data.liked
        post.likes = data.likes_count
      }
    } else {
      console.error('點讚失敗:', response.status)
    }
  } catch (error) {
    console.error('點讚失敗:', error)
  }
}

function toggleComments(id) {
  const post = posts.value.find(p => p.id === id)
  if (post) post.showComments = !post.showComments
}

async function addComment(id) {
  if (!isLoggedIn.value) return
  const post = posts.value.find(p => p.id === id)
  if (!post) return
  const text = newComments.value[id]
  if (!text || !text.trim()) return

  try {
    const response = await fetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content: text.trim()
      })
    })

    if (response.ok) {
      const data = await response.json()
      post.comments.push(data.comment)
      newComments.value[id] = ''

      // 更新留言數
      post.comments_count = (post.comments_count || 0) + 1
    } else {
      console.error('新增留言失敗:', response.status)
    }
  } catch (error) {
    console.error('新增留言失敗:', error)
  }
}

function bookmarkPost(id) {
  if (!isLoggedIn.value) return
  const post = posts.value.find(p => p.id === id)
  if (post) post.bookmarked = !post.bookmarked
}

function sharePost(id) {
  alert(`已分享貼文 #${id}！`)
}

// 時間格式化
function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '剛剛'
  if (minutes < 60) return `${minutes} 分鐘前`
  if (hours < 24) return `${hours} 小時前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString()
}

const sortedPosts = computed(() => {
  if (sortBy.value === 'latest') {
    return [...posts.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  if (sortBy.value === 'popular') {
    return [...posts.value].sort((a, b) => (b.likes || 0) - (a.likes || 0))
  }
  if (sortBy.value === 'mine' && currentUser.value) {
    return posts.value.filter(p => p.authorId === currentUser.value.id)
  }
  return posts.value
})

// 頁面載入時執行
onMounted(async () => {
  await checkAuthStatus()
  await fetchPosts()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

/* 認證提醒 */
.auth-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  text-align: center;
}
.login-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: bold;
}

/* 發文框 */
.post-box {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}
.post-box textarea {
  width: 100%;
  height: 60px;
  resize: none;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
.post-box .actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.post-box select,
.post-box input[type="file"] {
  font-size: 13px;
}
.post-box button {
  padding: 6px 12px;
  background: #1976d2;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.post-box button:disabled {
  background: #aaa;
  cursor: not-allowed;
}

/* 排序 */
.sort-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.refresh-btn {
  padding: 4px 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* 載入狀態 */
.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* 貼文卡片 */
.feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.post-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 32px;
  height: 32px;
  background: #1976d2;
  color: white;
  font-size: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dept {
  font-size: 12px;
  color: #666;
}
.tag {
  font-size: 12px;
  background: #eee;
  padding: 2px 6px;
  border-radius: 4px;
}
.post-content {
  margin: 8px 0;
}
.post-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 6px;
  margin: 8px 0;
}
.post-footer {
  display: flex;
  gap: 12px;
}
.post-footer button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.post-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.post-footer button.liked {
  color: #e74c3c;
  font-weight: bold;
}

/* 留言 */
.comments {
  margin-top: 10px;
  border-top: 1px solid #ddd;
  padding-top: 8px;
}
.comment {
  font-size: 14px;
  margin-bottom: 4px;
}
.comment .time {
  font-size: 12px;
  color: #666;
}
.comment-box {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.comment-box input {
  flex: 1;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.comment-box button {
  padding: 6px 12px;
  background: #1976d2;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

/* RWD */
@media (max-width: 768px) {
  .page {
    padding: 12px;
  }
  .post-box textarea {
    height: 50px;
  }
  .post-footer {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>