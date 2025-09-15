<template>
  <div>
    <NavBar />
   <div class="app">
    <main class="main">
      <router-view />
    </main>

    <footer class="site-footer">
      ＠黑客松板烤肉出版
    </footer>
  </div>
  </div>
    
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
/* 讓頁尾固定在視窗底部（內容不足時），內容多時會被推到最下方 */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
}

/* 頁尾樣式（沿用你現有的配色變數） */
.site-footer {
  text-align: center;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-light);
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}
</style>