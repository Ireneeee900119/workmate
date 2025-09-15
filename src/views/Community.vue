<template>
  <div class="page">
    <h1>👥 社群</h1>
    <p>分享生活、職場心得、技術交流，打造多元友善的職場社群。</p>

    <!-- 發文框 -->
    <div class="post-box">
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
        <button :disabled="!newPost.trim()" @click="addPost">發佈</button>
      </div>
    </div>

    <!-- 排序選單 -->
    <div class="sort-bar">
      <label>排序：</label>
      <select v-model="sortBy">
        <option value="latest">最新</option>
        <option value="popular">熱門</option>
        <option value="mine">我的貼文</option>
      </select>
    </div>

    <!-- 貼文牆 -->
    <div class="feed">
      <div v-for="post in sortedPosts" :key="post.id" class="post-card">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar">{{ post.user[0] }}</div>
            <div>
              <strong>{{ post.user }}</strong>
              <div class="time">{{ post.time }}</div>
            </div>
          </div>
          <span class="tag">{{ post.tag }}</span>
        </div>

        <p class="post-content">{{ post.content }}</p>
        <img v-if="post.image" :src="post.image" alt="post image" class="post-image" />

        <div class="post-footer">
          <button @click="likePost(post.id)">👍 {{ post.likes }}</button>
          <button @click="toggleComments(post.id)">💬 {{ post.comments.length }}</button>
          <button @click="bookmarkPost(post.id)">
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
          <div class="comment-box">
            <input
              v-model="newComments[post.id]"
              placeholder="寫下留言..."
              @keyup.enter="addComment(post.id)"
            />
            <button @click="addComment(post.id)">送出</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const posts = ref([
  {
    id: 1,
    user: 'Ivy',
    tag: '租屋',
    content: '有人推薦新竹靠近園區的租屋地點嗎？',
    time: '2 小時前',
    likes: 3,
    comments: [
      { user: 'Ben', text: '竹北比較方便喔！', time: '1 小時前' }
    ],
    showComments: false,
    bookmarked: false
  },
  {
    id: 2,
    user: 'Ben',
    tag: '美食',
    content: '園區附近有家牛肉麵超好吃，推推！',
    time: '昨天',
    likes: 25,
    comments: [
      { user: 'Ivy', text: '下次帶我去！', time: '23 小時前' }
    ],
    showComments: false,
    bookmarked: true
  },
  {
    id: 3,
    user: 'Alice',
    tag: '心情',
    content: '第一週 onboarding 有點緊張，不過同事人都很好，漸漸適應中。',
    time: '3 天前',
    likes: 12,
    comments: [
      { user: '你', text: '加油！有需要幫忙可以問我～', time: '2 天前' }
    ],
    showComments: false,
    bookmarked: false
  },
  {
    id: 4,
    user: '你',
    tag: '技術',
    content: 'Vue 3 的 Composition API 比 Options API 更靈活，推薦大家學習！',
    time: '5 天前',
    likes: 7,
    comments: [
      { user: 'Ben', text: '同意！`script setup` 超方便！', time: '4 天前' }
    ],
    showComments: false,
    bookmarked: true
  },
  {
    id: 5,
    user: '你',
    tag: '生活',
    content: '週末去九份走走，山城夜景超漂亮 🌃',
    time: '1 週前',
    likes: 30,
    comments: [
      { user: 'Alice', text: '超美！我也想去！', time: '6 天前' },
      { user: 'Ivy', text: '天氣好才有這種景色～', time: '5 天前' }
    ],
    showComments: false,
    bookmarked: false
  },
  {
    id: 6,
    user: 'David',
    tag: '職場',
    content: '完成新人導向課程 🎯，下一步挑戰資安訓練！',
    time: '2 週前',
    likes: 18,
    comments: [],
    showComments: false,
    bookmarked: false
  }
])

const newPost = ref('')
const selectedTag = ref('生活')
const newComments = ref({})
const sortBy = ref('latest')
const uploadedImage = ref(null)

function addPost() {
  if (!newPost.value.trim()) return
  posts.value.unshift({
    id: Date.now(),
    user: '你',
    tag: selectedTag.value,
    content: newPost.value,
    time: '剛剛',
    likes: 0,
    comments: [],
    showComments: false,
    bookmarked: false,
    image: uploadedImage.value
  })
  newPost.value = ''
  uploadedImage.value = null
}

function onImageUpload(e) {
  const file = e.target.files[0]
  if (file) uploadedImage.value = URL.createObjectURL(file)
}

function likePost(id) {
  const post = posts.value.find(p => p.id === id)
  if (post) post.likes++
}

function toggleComments(id) {
  const post = posts.value.find(p => p.id === id)
  if (post) post.showComments = !post.showComments
}

function addComment(id) {
  const post = posts.value.find(p => p.id === id)
  if (!post) return
  const text = newComments.value[id]
  if (!text || !text.trim()) return
  post.comments.push({ user: '你', text, time: '剛剛' })
  newComments.value[id] = ''
}

function bookmarkPost(id) {
  const post = posts.value.find(p => p.id === id)
  if (post) post.bookmarked = !post.bookmarked
}

function sharePost(id) {
  alert(`已分享貼文 #${id}！`)
}

const sortedPosts = computed(() => {
  if (sortBy.value === 'latest') {
    return [...posts.value].sort((a, b) => b.id - a.id)
  }
  if (sortBy.value === 'popular') {
    return [...posts.value].sort((a, b) => b.likes - a.likes)
  }
  if (sortBy.value === 'mine') {
    return posts.value.filter(p => p.user === '你')
  }
  return posts.value
})
</script>

<style scoped>
.page {
  padding: 20px;
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