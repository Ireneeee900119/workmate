<template>
  <div class="layout">
    <!-- 左側選單 -->
    <aside class="sidebar">
      <SidebarMenu />
    </aside>

    <!-- 中間主內容 -->
    <main class="content">
      <router-view />
    </main>

    <!-- 右側聊天機器人 -->
    <section class="chat">
      <ChatPanel />
    </section>
  </div>
</template>

<script setup lang="ts">
import SidebarMenu from './/components/SidebarMenu.vue'
import ChatPanel from './/components/ChatPanel.vue'
</script>

<style>
:root {
  --bg: #f6f7fb;
  --card: #ffffff;
  --text: #1d2330;
  --muted: #6b7280;
  --primary: #4f46e5;
  --border: #e5e7eb;
}

* { box-sizing: border-box; }
html, body, #app { height: 100%; margin: 0; }

.layout {
  display: grid;
  grid-template-columns: 260px 1fr 360px;
  grid-template-rows: 100vh;
  background: var(--bg);
  color: var(--text);
}

.sidebar {
  border-right: 1px solid var(--border);
  background: #fff;
}

.content {
  padding: 24px;
  overflow: auto;
}

.chat {
  border-left: 1px solid var(--border);
  background: #fff;
}

/* RWD */
@media (max-width: 1080px) {
  .layout { grid-template-columns: 220px 1fr; }
  .chat { display: none; }
}
</style>