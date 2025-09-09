<template>
  <nav class="nav">
    <h1 class="logo">新人體驗</h1>
    <ul>
      <li v-for="i in items" :key="i.to">
        <RouterLink :to="i.to" class="link" active-class="active">
          <span class="emoji">{{ i.icon }}</span>{{ i.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const items = [
  { to: '/', label: '總覽 Dashboard', icon: '🏁' },
  { to: '/onboarding', label: '入職導覽', icon: '🧭' },
  { to: '/security', label: '資安訓練', icon: '🛡️' },
  { to: '/expense', label: '報銷教學', icon: '🧾' },
  { to: '/tools', label: '常用工具', icon: '🧰' },
  { to: '/faq', label: '常見問題', icon: '❓' }
]
</script>

<style scoped>
.nav { padding: 20px; }
.logo {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
}
ul { list-style: none; padding: 0; margin: 0; }
.link {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; margin: 6px 0; border-radius: 10px;
  text-decoration: none; color: #1d2330;
  border: 1px solid transparent;
}
.link:hover { background: #f3f4f6; }
.active { border-color: #e5e7eb; background: #f9fafb; }
.emoji { width: 22px; text-align: center; }
</style>