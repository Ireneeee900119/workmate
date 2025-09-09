<template>
  <div class="wrapper">
    <header class="head">
      <strong>新人小幫手</strong>
      <small>問我：入職、資安、報銷、工具、FAQ</small>
    </header>

    <div class="log" ref="logRef">
      <div v-for="m in messages" :key="m.id" :class="['msg', m.role]">
        <div class="bubble" v-html="m.html"></div>
      </div>
    </div>

    <form class="input" @submit.prevent="send">
      <input v-model="draft" type="text" placeholder="輸入問題，如：如何請款？" />
      <button :disabled="!draft.trim()">送出</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

type Msg = { id: string; role: 'user' | 'bot'; html: string }

const logRef = ref<HTMLDivElement|null>(null)
const messages = ref<Msg[]>([
  { id: 'hello', role: 'bot', html: '嗨！我是新人小幫手。請輸入關鍵字，例如：<b>入職導覽</b>、<b>資安訓練</b>、<b>報銷</b>、<b>工具</b>、<b>FAQ</b>。' }
])
const draft = ref('')

function reply(text: string) {
  const q = text.toLowerCase()

  const lib: Record<string, string> = {
    '入職': `👉 <b>入職導覽</b><br/>• 第一天報到清單<br/>• 公司縮寫對照<br/>• 常用系統帳號申請<br/><a href='/onboarding'>前往頁面</a>`,
    '資安': `👉 <b>資安訓練</b><br/>• SEC-101 課程連結<br/>• 社交工程注意事項<br/>• 檔案分類與加密<br/><a href='/security'>前往頁面</a>`,
    '報銷': `👉 <b>報銷教學</b><br/>• 單據範本下載<br/>• 費用科目說明<br/>• 里程/交通計算器<br/><a href='/expense'>前往頁面</a>`,
    '工具': `👉 <b>常用工具</b><br/>• VPN/郵件/入口網站<br/>• 內部搜尋/知識庫<br/>• 會議室預約<br/><a href='/tools'>前往頁面</a>`,
    'faq': `👉 <b>常見問題</b><br/>• 請假流程與天數<br/>• 打卡補登規則<br/>• 試用期目標怎麼訂<br/><a href='/faq'>前往頁面</a>`
  }

  const key = Object.keys(lib).find(k => q.includes(k))
  return key ? lib[key] : `我先找到了這些關鍵字：<i>入職/資安/報銷/工具/FAQ</i>。或直接點左側選單頁面看看 👈`
}

async function send() {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push({ id: crypto.randomUUID(), role: 'user', html: text })
  draft.value = ''
  // 模擬回覆（可替換成後端 API）
  const ans = reply(text)
  messages.value.push({ id: crypto.randomUUID(), role: 'bot', html: ans })
  await nextTick()
  logRef.value?.scrollTo({ top: logRef.value.scrollHeight, behavior: 'smooth' })
}
</script>

<style scoped>
.wrapper { height: 100%; display: grid; grid-template-rows: auto 1fr auto; }
.head { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; }
.head small { display:block; color:#6b7280; margin-top:4px; }
.log { padding: 14px; overflow: auto; background: #fafafa; }
.msg { display: flex; margin: 8px 0; }
.msg.user { justify-content: flex-end; }
.bubble {
  max-width: 78%;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 10px 12px; line-height: 1.5;
}
.msg.user .bubble { background: #eef2ff; border-color: #dfe3ff; }
.input { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e5e7eb; }
.input input {
  flex: 1; border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; outline: none;
}
.input button {
  border: none; background: var(--primary); color:#fff; padding: 0 16px;
  border-radius: 10px; cursor: pointer;
}
.input button:disabled { opacity: .5; cursor: not-allowed; }
</style>