<template>
  <footer class="site-filing" aria-label="网站备案信息">
    <div class="footer-brand">
      <BrandMark />
      <div>
        <b>简跃 AI<span>RESUMELEAP</span></b>
        <p>认真记录每段经历，从容走向下一程。</p>
      </div>
    </div>
    <div class="footer-meta">
      <span class="filing-label"><AppIcon name="shield" />网站备案信息</span>
      <div class="filing-bottom">
        <small>© {{ year }} 简跃 AI</small><span class="filing-divider" aria-hidden="true"></span
        ><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"
          >{{ record }}<AppIcon name="arrow"
        /></a>
      </div>
      <span class="filing-hint">点击备案号，前往工业和信息化部查询</span>
    </div>
  </footer>
</template>
<script setup>
import AppIcon from '@/components/AppIcon.vue'
import BrandMark from '@/components/BrandMark.vue'
const record = import.meta.env.VITE_ICP_RECORD?.trim() || '黔ICP备2025053618号-1'
const year = new Date().getFullYear()
</script>
<style scoped>
.site-filing {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  margin-top: 64px;
  padding: 28px 4px 8px;
  border-top: 1px solid #cac5d6;
  color: #655e74;
  flex-shrink: 0;
}
.site-filing::before {
  content: '';
  position: absolute;
  left: 0;
  top: -2px;
  width: 38px;
  height: 3px;
  background: #51456b;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}
.footer-brand img {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}
.footer-brand b {
  font-size: 17px;
  font-weight: 650;
  color: #393246;
}
.footer-brand b span {
  font-size: 9px;
  letter-spacing: 2px;
  margin-left: 13px;
  font-weight: 400;
  color: #867e97;
}
.footer-brand p {
  font-size: 13px;
  margin-top: 6px;
  color: #837d91;
}
.footer-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
}
.filing-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b627e;
}
.filing-label .app-icon {
  width: 14px;
  height: 14px;
}
.filing-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filing-bottom small {
  font-size: 12px;
  color: #867f95;
}
.filing-divider {
  height: 12px;
  width: 1px;
  background: #d0cbdb;
}
.site-filing a {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #473f58;
  font-size: 13px;
  text-decoration: none;
  border-bottom: 1px solid #bbb4cb;
  padding-bottom: 2px;
  line-height: 1.5;
}
.site-filing a:hover {
  color: #21192d;
  border-bottom-color: #36294c;
}
.site-filing a .app-icon {
  height: 13px;
  width: 13px;
  transform: rotate(-40deg);
}
.filing-hint {
  font-size: 11px;
  color: #8e889c;
}
:global(.login-page) .site-filing {
  display: block;
  text-align: center;
  border: 0;
  padding: 0;
  color: #818795;
}
:global(.login-page) .site-filing::before,
:global(.login-page) .footer-brand,
:global(.login-page) .filing-label,
:global(.login-page) .filing-hint {
  display: none;
}
:global(.login-page) .footer-meta {
  align-items: center;
}
:global(.login-page) .filing-bottom {
  justify-content: center;
}
:global(.login-page) .site-filing a {
  border: 0;
  color: #646b7c;
  font-size: 12px;
}
:global(.login-page) .site-filing a .app-icon {
  display: none;
}
@media (max-width: 700px) {
  .site-filing {
    margin-top: 44px;
    padding-top: 24px;
    align-items: flex-start;
    flex-direction: column;
    gap: 24px;
  }
  .footer-meta {
    align-items: flex-start;
    gap: 10px;
  }
  .footer-brand p {
    font-size: 13px;
  }
  .filing-hint {
    font-size: 11px;
  }
  .filing-bottom {
    gap: 10px;
  }
  .footer-brand b {
    font-size: 17px;
  }
  .site-filing a {
    font-size: 13px;
  }
}
@media print {
  .site-filing {
    display: none !important;
  }
}
</style>
