<template>
  <header class="navbar">
    <div class="left">
      <router-link to="/" class="brand">
        <span class="logo">●</span>
        <span class="brand-text">iGrow & iCare</span>
      </router-link>

      <!-- 主要導覽 -->
      <nav class="nav-links" :class="{ open: openMenu }">
        <router-link to="/">首頁</router-link>
        <router-link to="/training">職涯訓練</router-link>
        <router-link to="/wellbeing">心理健康</router-link>
        <router-link to="/community">社群</router-link>
        <router-link to="/notifications">通知</router-link>
      </nav>
    </div>

    <div class="right">
      <!-- 未登入 -->
      <router-link v-if="!auth.isAuthed.value" to="/login" class="btn">
        登入
      </router-link>

      <!-- 已登入 -->
      <div v-else class="user" @click="toggleDropdown" @keydown.enter="toggleDropdown" tabindex="0">
        <div class="avatar" :title="auth.state.user.name">
          <img v-if="auth.state.user.avatarUrl" :src="auth.state.user.avatarUrl" alt="avatar" />
          <span v-else>{{ auth.initials.value }}</span>
        </div>
        <div class="meta">
          <div class="name">{{ auth.state.user.name }}</div>
          <div class="sub">{{ auth.state.user.role }} · {{ auth.state.user.dept }}</div>
        </div>
        <svg class="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>

        <!-- 下拉選單 -->
        <div class="dropdown" v-if="showDropdown" @click.stop>
          <router-link to="/" class="item">個人資料</router-link>
          <router-link to="/notifications" class="item">通知</router-link>
          <div class="sep"></div>
          <button class="item danger" @click="logout">登出</button>
        </div>
      </div>

      <!-- 漢堡 -->
      <button class="hamburger" @click="openMenu = !openMenu" aria-label="menu">
        ☰
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import auth from '../router/auth'

const showDropdown = ref(false)
const openMenu = ref(false)

function toggleDropdown() { showDropdown.value = !showDropdown.value }
function onClickOutside(e) {
  const nav = document.querySelector('.navbar')
  if (nav && !nav.contains(e.target)) showDropdown.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

async function logout() {
  await auth.logout()
  showDropdown.value = false
}
</script>


<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 50;
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}
.left { display: flex; align-items: center; gap: 12px; }

.brand { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
.logo {
  width: 10px; height: 10px; border-radius: 50%;
  display: inline-block; background: var(--primary);
}
.brand-text { color: var(--text); font-weight: 800; letter-spacing: .2px; }

.nav-links { display: flex; gap: 12px; margin-left: 8px; }
.nav-links a {
  color: var(--text); text-decoration: none; padding: 6px 8px; border-radius: 6px;
}
.nav-links a.router-link-active { background: #f0f2f5; }

.right { display: flex; align-items: center; gap: 10px; }

.btn {
  background: var(--primary); color: #fff; border: none; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-weight: 600;
}
.btn:hover { background: var(--primary-dark); }

.user {
  display: flex; align-items: center; gap: 8px; position: relative; cursor: pointer;
}
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: #e6eaf2; color: #3a4a66; display: grid; place-items: center;
  font-weight: 700; border: 1px solid var(--border); overflow: hidden;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.meta { line-height: 1.1; }
.name { font-weight: 700; color: var(--text); }
.sub { font-size: 12px; color: var(--text-light); }
.chev { width: 18px; height: 18px; fill: #888; }

.dropdown {
  position: absolute; right: 0; top: 44px; min-width: 180px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,.08); padding: 6px;
}
.item {
  display: block; width: 100%; text-align: left; padding: 8px 10px;
  background: none; border: none; cursor: pointer; border-radius: 6px;
  color: var(--text); text-decoration: none;
}
.item:hover { background: #f5f7fa; }
.item.danger { color: #c0392b; }
.sep { height: 1px; background: var(--border); margin: 6px 0; }

.hamburger {
  display: none; background: none; border: 1px solid var(--border);
  border-radius: 6px; width: 36px; height: 32px; cursor: pointer;
}

/* RWD */
@media (max-width: 860px) {
  .nav-links {
    position: absolute; left: 0; right: 0; top: 56px;
    background: var(--bg-card); border-bottom: 1px solid var(--border);
    padding: 10px 14px; flex-direction: column; display: none;
  }
  .nav-links.open { display: flex; }
  .hamburger { display: inline-block; }
}
</style>