<template>
  <div class="login-page" @mousemove="handleMouseMove">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="container">
      <!-- 左侧：插画互动区 -->
      <div class="illustration-side">
        <div class="character-group">
          <!-- 紫色方块人物 -->
          <div class="char purple-rect" :style="bodyStyle">
            <div class="eye-pair">
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
            </div>
          </div>
          <!-- 黑色高个人物 -->
          <div class="char black-tall" :style="bodyStyle">
            <div class="eye-pair">
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
            </div>
          </div>
          <!-- 橙色圆头人物 -->
          <div class="char orange-round" :style="bodyStyle">
            <div class="eye-pair">
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
            </div>
          </div>
          <!-- 黄色胶囊人物 -->
          <div class="char yellow-capsule" :style="bodyStyle">
            <div class="eye-pair">
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
              <div class="eye-white"><div class="pupil" :style="eyeStyle"></div></div>
            </div>
            <div class="mouth"></div>
          </div>
        </div>
      </div>

      <!-- 右侧：表单区 -->
      <div class="form-side">
        <div class="form-wrapper">
          <div class="login-brand">
            <span>简<i>↗</i></span>
            <div><b>简跃 AI</b><small>RESUMELEAP</small></div>
          </div>
          <!-- 切换 Tab -->
          <div class="tab-header">
            <div class="tab-slider" :class="{ 'to-register': !isLogin }"></div>
            <button type="button" @click="toggleMode(true)" :class="{ active: isLogin }">
              登录
            </button>
            <button type="button" @click="toggleMode(false)" :class="{ active: !isLogin }">
              注册
            </button>
          </div>

          <div class="form-body">
            <header>
              <h1>{{ isLogin ? '欢迎回来' : '立即加入' }}</h1>
              <p>{{ isLogin ? 'AI 赋能您的职业生涯' : '开启 30s 智能简历优化' }}</p>
            </header>

            <transition name="fade-slide" mode="out-in">
              <div :key="isLogin" class="form-content">
                <!-- 融合 Element Plus 的表单组件，继承原有校验规则逻辑 -->
                <el-form
                  ref="formRef"
                  :model="formData"
                  :rules="formRules"
                  label-position="top"
                  status-icon
                  @mouseenter="isDodging = true"
                  @mouseleave="isDodging = false"
                >
                  <!-- 账号/邮箱 (登录与注册共有) -->
                  <el-form-item prop="username">
                    <el-input
                      v-model="formData.username"
                      placeholder="请输入用户名/邮箱"
                      clearable
                    />
                  </el-form-item>

                  <!-- 密码 (登录与注册共有) -->
                  <el-form-item prop="password">
                    <el-input
                      v-model="formData.password"
                      type="password"
                      placeholder="请输入密码"
                      show-password
                    />
                  </el-form-item>

                  <!-- 确认密码 (仅注册模式显示) -->
                  <el-form-item v-if="!isLogin" prop="confirmPassword">
                    <el-input
                      v-model="formData.confirmPassword"
                      type="password"
                      placeholder="请再次输入密码"
                      show-password
                    />
                  </el-form-item>

                  <!-- 提交按钮 -->
                  <el-form-item class="submit-item">
                    <el-button
                      type="primary"
                      class="submit-btn shadow-anim"
                      :loading="loading"
                      @click="handleSubmit"
                    >
                      {{ isLogin ? '登 录' : '注 册' }}
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </transition>

            <div class="form-footer">
              <a href="#">忘记密码？</a>
              <span class="divider"></span>
              <a href="#">隐私条款</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// --- 路由实例 ---
const router = useRouter()
const authStore = useAuthStore()

// --- 状态定义 ---
const isLogin = ref(true) // 模式切换：true-登录，false-注册
const loading = ref(false) // 按钮加载状态
const formRef = ref(null) // 表单实例引用
const isDodging = ref(false) // 是否处于闪躲状态

// --- 动效样式定义 ---
const eyeStyle = reactive({ transform: 'translate(0, 0)' })
const bodyStyle = reactive({ transform: 'rotate(0deg) translateX(0px)' })

// --- 数据模型 ---
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

// --- 自定义校验规则：确认密码是否一致 ---
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== formData.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

// --- 校验规则配置 ---
const formRules = reactive({
  username: [
    { required: true, message: '账号不能为空', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
})

// --- 方法 ---

// 切换登录/注册模式
const toggleMode = (mode) => {
  isLogin.value = mode
  formRef.value?.resetFields() // 切换时重置表单状态和校验信息
}

// 提交逻辑
const handleSubmit = async () => {
  if (!formRef.value) return

  // 执行表单全校验
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      console.log('校验通过，准备发送请求:', formData)
      handleApiCall()
    } else {
      console.log('校验失败:', fields)
    }
  })
}

//  API 调用 (连接 Node 后端)
const handleApiCall = async () => {
  loading.value = true
  try {
    const data = await authStore.submit(
      {
        username: formData.username,
        password: formData.password,
      },
      isLogin.value ? 'login' : 'register',
    )

    // 成功
    if (data.success) {
      ElMessage.success(data.message)
      // 跳转到首页
      router.push('/home')
      console.log('用户信息：', data.data.user)
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    console.log(error)
    ElMessage.error(error.response?.data?.message || '请求失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

// 眼神与身体随鼠标移动/闪躲逻辑
const handleMouseMove = (e) => {
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window

  // 计算基础偏移量
  let ex = ((clientX - innerWidth / 4) / (innerWidth / 2)) * 8
  let ey = ((clientY - innerHeight / 2) / (innerHeight / 2)) * 7
  let br = ((clientX - innerWidth / 4) / (innerWidth / 2)) * 6
  let bx = ((clientX - innerWidth / 4) / (innerWidth / 2)) * 10

  if (isDodging.value) {
    // 【闪躲逻辑】
    ex = -ex * 1.5
    ey = -ey * 1.2
    br = -br * 0.5
    bx = -bx * 0.5

    ex = Math.max(-10, Math.min(10, ex))
    ey = Math.max(-8, Math.min(8, ey))
  } else {
    // 正常跟随
    ex = Math.max(-9, Math.min(9, ex))
    ey = Math.max(-8, Math.min(8, ey))
    br = Math.max(-7, Math.min(7, br))
  }

  eyeStyle.transform = `translate(${ex}px, ${ey}px)`
  bodyStyle.transform = `rotate(${br}deg) translateX(${bx}px)`
}

onMounted(() => window.addEventListener('mousemove', handleMouseMove))
onUnmounted(() => window.removeEventListener('mousemove', handleMouseMove))
</script>

<style lang="scss" scoped>
$purple: #6d4aff;
$black: #1a1a1a;
$orange: #ff9d6a;
$yellow: #f0d949;

.login-page {
  position: relative;
  height: 100vh;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family:
    'Inter',
    -apple-system,
    sans-serif;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba($purple, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba($purple, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, black, transparent 80%);
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba($purple, 0.1) 0%, transparent 70%);
  top: 50%;
  left: 30%;
  transform: translate(-50%, -50%);
  filter: blur(80px);
}

.container {
  position: relative;
  z-index: 10;
  display: flex;
  width: 1050px;
  height: 650px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px);
  border-radius: 48px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.illustration-side {
  flex: 1.1;
  background-color: #f9fbff;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 50px;

  .character-group {
    position: relative;
    width: 440px;
    height: 440px;
  }

  .char {
    position: absolute;
    bottom: 0;
    transform-origin: bottom center;
    transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);

    .eye-pair {
      position: absolute;
      display: flex;
      gap: 10px;
      .eye-white {
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        animation: blink 3s infinite;
        .pupil {
          width: 10px;
          height: 10px;
          background: #000;
          border-radius: 50%;
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      }
    }
  }

  .purple-rect {
    width: 170px;
    height: 320px;
    background: $purple;
    left: 60px;
    bottom: 120px;
    border-radius: 20px;
    z-index: 1;
    .eye-pair {
      top: 60px;
      left: 55px;
    }
  }
  .black-tall {
    width: 110px;
    height: 280px;
    background: $black;
    left: 230px;
    bottom: 40px;
    border-radius: 20px;
    z-index: 2;
    .eye-pair {
      top: 55px;
      left: 28px;
    }
  }
  .orange-round {
    width: 260px;
    height: 200px;
    background: $orange;
    left: -10px;
    bottom: 0;
    border-radius: 130px 130px 0 0;
    z-index: 3;
    .eye-pair {
      top: 95px;
      left: 105px;
      .eye-white {
        width: 16px;
        height: 16px;
        .pupil {
          width: 7px;
          height: 7px;
        }
      }
    }
  }
  .yellow-capsule {
    width: 150px;
    height: 240px;
    background: $yellow;
    right: 10px;
    bottom: 0;
    border-radius: 75px 75px 0 0;
    z-index: 4;
    .eye-pair {
      top: 90px;
      left: 48px;
    }
    .mouth {
      position: absolute;
      width: 50px;
      height: 4px;
      background: #222;
      top: 145px;
      left: 50px;
      border-radius: 3px;
    }
  }
}

.form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;

  .form-wrapper {
    width: 100%;
    max-width: 360px;

    .login-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
      > span {
        position: relative;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 11px;
        background: $purple;
        color: white;
        font-weight: 800;
      }
      i {
        position: absolute;
        top: 1px;
        right: 3px;
        color: #d9d1ff;
        font-size: 8px;
        font-style: normal;
      }
      div {
        display: flex;
        flex-direction: column;
      }
      b {
        color: $black;
        font-size: 17px;
        font-weight: 750;
      }
      small {
        color: #a0a4ad;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 1.5px;
      }
    }

    .tab-header {
      position: relative;
      display: flex;
      background: #f0f2f5;
      padding: 5px;
      border-radius: 14px;
      margin-bottom: 40px;

      button {
        position: relative;
        z-index: 2;
        flex: 1;
        padding: 10px;
        border: none;
        background: transparent;
        font-weight: 600;
        color: #7f8c8d;
        cursor: pointer;
        transition: color 0.3s;
        &.active {
          color: white;
        }
      }

      .tab-slider {
        position: absolute;
        width: calc(50% - 5px);
        height: calc(100% - 10px);
        background: $black;
        border-radius: 10px;
        transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
        &.to-register {
          transform: translateX(100%);
        }
      }
    }

    header {
      margin-bottom: 35px;
      h1 {
        font-size: 32px;
        font-weight: 800;
        color: $black;
        margin: 0;
      }
      p {
        color: #95a5a6;
        font-size: 15px;
        margin-top: 8px;
      }
    }

    /* 样式深度穿透：将 Element Plus 的 Input 样式统一整合成要求的设计风格 */
    ::v-deep(.el-form-item) {
      margin-bottom: 22px;

      .el-input__wrapper {
        width: 100%;
        padding: 14px 20px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 18px;
        box-shadow: none !important; /* 去除Element默认阴影 */
        transition: all 0.3s;
        box-sizing: border-box;

        &:hover {
          border-color: #cbd5e1;
        }

        &.is-focus {
          background: white;
          border-color: $purple !important;
          box-shadow: 0 8px 24px rgba($purple, 0.12) !important;
          transform: translateY(-2px);
        }

        .el-input__inner {
          font-size: 16px;
          height: 24px;
          color: $black;
          &::placeholder {
            color: #cbd5e1;
          }
        }
      }

      /* 错误校验信息的排版微调 */
      .el-form-item__error {
        padding-top: 4px;
        padding-left: 8px;
      }
    }

    /* 提交按钮容器样式重置 */
    ::v-deep(.submit-item) {
      margin-top: 25px;
      .el-form-item__content {
        margin-left: 0 !important;
      }
    }

    .submit-btn {
      width: 100%;
      height: auto;
      padding: 18px;
      background: $purple;
      border-color: $purple;
      color: white;
      border-radius: 18px;
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;

      &.shadow-anim:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 35px rgba($purple, 0.4);
        filter: brightness(1.1);
      }
    }

    .form-footer {
      margin-top: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      a {
        color: #95a5a6;
        text-decoration: none;
        &:hover {
          color: $purple;
        }
      }
      .divider {
        width: 1px;
        height: 12px;
        background: #ddd;
      }
    }
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes blink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

@media (max-width: 900px) {
  .container {
    width: 95%;
    height: auto;
    flex-direction: column;
    border-radius: 30px;
  }
  .illustration-side {
    height: 350px;
    padding-bottom: 20px;
  }
  .form-side {
    padding: 40px 20px;
  }
}
</style>
