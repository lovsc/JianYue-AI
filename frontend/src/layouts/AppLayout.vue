<template>
  <div class="app-shell" :class="{ public: !auth.isAuthenticated }">
    <aside v-if="auth.isAuthenticated" class="app-sidebar">
      <router-link class="brand" to="/"
        ><BrandMark /><span>简跃 <em>AI</em></span></router-link
      >
      <nav aria-label="主导航">
        <router-link v-for="item in links" :key="item.to" :to="item.to"
          ><AppIcon :name="item.icon" /><span>{{ item.label }}</span
          ><i v-if="activeLink === item.to"></i
        ></router-link>
      </nav>
      <div class="sidebar-user">
        <router-link class="account-link" to="/profile" aria-label="进入个人中心">
          <span class="user-avatar">{{ initial }}</span>
          <span class="account-name"
            ><b>{{ auth.user?.display_name || auth.user?.username }}</b
            ><small>个人账号</small></span
          >
        </router-link>
        <button title="退出登录" @click="logout"><AppIcon name="export" /></button>
      </div>
    </aside>
    <header v-else class="public-header">
      <router-link class="brand" to="/"
        ><BrandMark /><span>简跃 <em>AI</em></span></router-link
      >
      <nav aria-label="网站导航">
        <a href="/#capabilities">产品能力</a><a href="/#templates">简历模板</a
        ><a href="/#workflow">使用流程</a>
      </nav>
      <router-link class="login-link" to="/login">登录 / 注册<AppIcon name="arrow" /></router-link>
    </header>
    <main class="app-main">
      <header v-if="auth.isAuthenticated" class="workspace-topbar">
        <span
          >WORKSPACE <i>/</i><b>{{ currentLabel }}</b></span
        >
        <div><span class="local-dot"></span>你的下一程，从这里开始</div>
      </header>
      <div class="page-content"><slot /></div>
      <SiteFiling />
    </main>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SiteFiling from '@/components/SiteFiling.vue'
import AppIcon from '@/components/AppIcon.vue'
import BrandMark from '@/components/BrandMark.vue'
const auth = useAuthStore(),
  router = useRouter(),
  route = useRoute()
const initial = computed(() =>
  (auth.user?.display_name || auth.user?.username || 'U').slice(0, 1).toUpperCase(),
)
const logout = () => {
  auth.logout()
  router.replace('/')
}
const links = [
  { to: '/home', label: '探索首页', icon: 'home' },
  { to: '/dashboard', label: '工作台', icon: 'dashboard' },
  { to: '/resumes', label: '我的简历', icon: 'resume' },
  { to: '/analysis', label: '岗位匹配', icon: 'match' },
  { to: '/exports', label: '导出中心', icon: 'export' },
  { to: '/chat', label: 'AI 助手', icon: 'chat' },
  { to: '/profile', label: '个人中心', icon: 'user' },
]
const currentLabel = computed(
  () => links.find((item) => item.to === activeLink.value)?.label || '探索首页',
)
const activeLink = computed(() =>
  route.path === '/' ? '/home' : links.find((item) => route.path.startsWith(item.to))?.to,
)
</script>
<style scoped>
.app-shell {
  --el-color-primary: #6d4aff;
  --el-color-primary-light-3: #796a92;
  --el-color-primary-light-5: #a89eb8;
  --el-color-primary-light-7: #cac4d5;
  --el-color-primary-light-8: #dbd7e3;
  --el-color-primary-light-9: #ebe8f2;
  --el-color-primary-dark-2: #5738d5;
  --el-border-radius-base: 9px;
  --el-font-size-base: 15px;
  min-height: 100dvh;
  background: #f7f7fb;
  color: #25202c;
  font-size: 15px;
}
.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 232px;
  z-index: 20;
  background: #171c2c;
  color: #ebe8f4;
  padding: 30px 18px 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2b213b;
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  font-size: 24px;
  font-weight: 750;
  letter-spacing: -1px;
}
.brand img {
  width: 42px;
  height: 42px;
}
.brand > span {
  line-height: 1.2;
}
.brand em {
  font-size: 12px;
  font-style: normal;
  color: #928aa2;
  font-weight: 500;
  letter-spacing: 0;
}
.app-sidebar nav {
  margin-top: 32px;
  display: grid;
  gap: 7px;
}
.app-sidebar nav a {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 15px;
  border-radius: 9px;
  text-decoration: none;
  color: #b0a9bd;
  font-size: 15px;
  transition:
    background 0.18s,
    color 0.18s;
}
.app-sidebar nav a:hover {
  background: #2b213a;
  color: #fff;
}
.app-sidebar nav a.router-link-active {
  background: #c8b5ff;
  color: #251c35;
  font-weight: 650;
}
.app-sidebar nav a i {
  margin-left: auto;
  width: 5px;
  height: 5px;
  background: #3e3452;
  border-radius: 50%;
}
.app-sidebar .app-icon {
  height: 19px;
  width: 19px;
}
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid #403650;
}
.account-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  text-decoration: none;
}
.user-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 50%;
  background: #3a314a;
  color: #c8bce7;
  font-size: 15px;
}
.account-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.account-name b {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.account-name small {
  font-size: 11px;
  color: #958fa1;
}
.sidebar-user button {
  border: 0;
  background: transparent;
  color: #a69db8;
  padding: 6px;
}
.sidebar-user button .app-icon {
  width: 17px;
  height: 17px;
  transform: rotate(-90deg);
}
.app-main {
  margin-left: 232px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0 36px 26px;
  min-width: 0;
}
.workspace-topbar {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid #dad7e2;
  font-size: 11px;
  color: #888491;
  letter-spacing: 1.1px;
}
.workspace-topbar > span {
  display: flex;
  align-items: center;
  gap: 14px;
}
.workspace-topbar b {
  font-size: 13px;
  color: #575262;
  letter-spacing: 0;
  font-weight: 500;
}
.workspace-topbar i {
  font-style: normal;
  color: #bbb6c5;
}
.workspace-topbar > div {
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0;
  font-size: 12px;
  color: #858090;
}
.local-dot {
  height: 5px;
  width: 5px;
  background: #7f7498;
  border-radius: 50%;
}
.page-content {
  flex: 1;
  min-width: 0;
}
.public .app-main {
  margin: auto;
  max-width: 1512px;
  width: 100%;
  padding: 12px 48px 24px;
  min-height: calc(100dvh - 94px);
}
.public-header {
  max-width: 1512px;
  margin: auto;
  height: 94px;
  padding: 0 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.public-header .brand {
  font-size: 25px;
}
.public-header nav {
  display: flex;
  gap: 38px;
  font-size: 15px;
  color: #615c6a;
}
.public-header nav a {
  text-decoration: none;
}
.public-header nav a:hover {
  color: #311d50;
}
.login-link {
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  padding: 11px 18px;
  border: 1px solid #bcb7c7;
  border-radius: 7px;
  font-size: 14px;
  color: #3b324b;
}
.login-link .app-icon {
  width: 17px;
}
@media (max-width: 1100px) {
  .app-main {
    padding-left: 24px;
    padding-right: 24px;
  }
  .workspace-topbar > div {
    display: none;
  }
}
@media (max-width: 760px) {
  .app-sidebar {
    position: sticky;
    top: 0;
    width: 100%;
    padding: 11px 12px;
    border: 0;
    backdrop-filter: blur(15px);
  }
  .app-sidebar > .brand,
  .sidebar-user {
    display: none;
  }
  .app-sidebar nav {
    margin-top: 0;
    display: flex;
    overflow: auto;
    gap: 6px;
    scrollbar-width: none;
  }
  .app-sidebar nav a {
    flex: none;
    padding: 10px 12px;
    font-size: 14px;
    gap: 8px;
  }
  .app-sidebar .app-icon {
    height: 17px;
    width: 17px;
  }
  .app-sidebar nav a i {
    display: none;
  }
  .app-main {
    margin: 0;
    padding: 0 17px 20px;
    min-height: calc(100dvh - 66px);
  }
  .workspace-topbar {
    height: 50px;
    margin-bottom: 20px;
    font-size: 10px;
  }
  .public .app-main {
    padding: 4px 16px 20px;
    min-height: calc(100dvh - 76px);
  }
  .public-header {
    height: 76px;
    padding: 0 18px;
  }
  .public-header nav {
    display: none;
  }
  .public-header .brand {
    font-size: 22px;
  }
  .public-header .brand img {
    width: 36px;
    height: 36px;
  }
  .login-link {
    padding: 9px 12px;
    font-size: 13px;
    gap: 12px;
  }
}
</style>
