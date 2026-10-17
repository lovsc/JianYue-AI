<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <router-link class="app-brand" to="/home"
        ><span class="brand-mark">简<i>↗</i></span
        ><b>简跃 <em>AI</em></b></router-link
      >
      <nav>
        <router-link to="/home">首页</router-link>
        <router-link to="/dashboard">工作台</router-link>
        <router-link to="/resumes">我的简历</router-link>
        <router-link to="/analysis">岗位匹配</router-link>
        <router-link to="/exports">导出中心</router-link>
        <router-link to="/chat">AI 助手</router-link>
        <router-link to="/profile">个人中心</router-link>
      </nav>
      <div class="sidebar-user">
        <div class="user-avatar">{{ auth.user?.username?.slice(0, 1)?.toUpperCase() }}</div>
        <div>
          <b>{{ auth.user?.display_name || auth.user?.username }}</b
          ><small>{{ auth.user?.email || '普通用户' }}</small>
        </div>
        <button title="退出登录" @click="logout">退出</button>
      </div>
    </aside>
    <main class="app-main"><slot /><SiteFiling /></main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SiteFiling from '@/components/SiteFiling.vue'

const auth = useAuthStore()
const router = useRouter()
const logout = () => {
  auth.logout()
  router.replace('/')
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #f6f7fb;
  color: #171923;
}
.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 230px;
  padding: 24px 16px;
  background: #171923;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.app-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 10px 30px;
  color: #fff;
  text-decoration: none;
  font-size: 19px;
}
.app-brand span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: #6d4aff;
  font-size: 13px;
  font-weight: 800;
}
.app-brand .brand-mark {
  position: relative;
  overflow: hidden;
  font-size: 16px;
}
.brand-mark i {
  position: absolute;
  top: 1px;
  right: 3px;
  color: #cfc5ff;
  font-size: 8px;
  font-style: normal;
}
.app-brand b {
  font-weight: 700;
}
.app-brand b em {
  margin-left: 3px;
  color: #9c8aff;
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
}
.app-sidebar nav {
  display: grid;
  gap: 8px;
}
.app-sidebar nav a {
  padding: 12px 14px;
  color: #aeb4c3;
  text-decoration: none;
  border-radius: 11px;
}
.app-sidebar nav a:hover,
.app-sidebar nav a.router-link-active {
  color: #fff;
  background: #292d3b;
}
.sidebar-user {
  margin-top: auto;
  padding: 15px 8px 0;
  border-top: 1px solid #303442;
  display: flex;
  align-items: center;
  gap: 9px;
}
.user-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: #6d4aff;
  border-radius: 50%;
  font-weight: 700;
}
.sidebar-user div:nth-child(2) {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}
.sidebar-user b {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
}
.sidebar-user small {
  color: #858b99;
}
.sidebar-user button {
  border: 0;
  background: transparent;
  color: #858b99;
  cursor: pointer;
}
.app-main {
  width: calc(100% - 230px);
  margin-left: 230px;
  padding: 34px 42px;
}
@media (max-width: 760px) {
  .app-sidebar {
    width: 76px;
    padding: 18px 10px;
  }
  .app-brand b,
  .app-sidebar nav a,
  .sidebar-user div:nth-child(2),
  .sidebar-user button {
    font-size: 0;
  }
  .app-sidebar nav a {
    height: 42px;
  }
  .app-main {
    width: calc(100% - 76px);
    margin-left: 76px;
    padding: 24px 16px;
  }
}
</style>
