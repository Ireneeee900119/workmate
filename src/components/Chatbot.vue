<template>
  <div class="chat-window">
    <div class="cat-avatar">
      <img :src="currentImage" alt="Assistant Avatar" />
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.sender]">
        <div class="message-content" v-html="marked(msg.text)"></div>
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="userInput"
        @keyup.enter="sendMessage"
        placeholder="說點什麼..."
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading">傳送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { marked } from 'marked';

// --- 1. 載入所有圖片 ---
import img1 from '@/assets/images/1.png';
import img2 from '@/assets/images/2.png';
import img3 from '@/assets/images/3.png';
import img4 from '@/assets/images/4.png';
import img5 from '@/assets/images/5.png';
import img6 from '@/assets/images/6.png';
import img7 from '@/assets/images/7.png';
import img8 from '@/assets/images/8.png';
import img9 from '@/assets/images/9.png';

// 將導入的圖片變數存入陣列
const talkingImages = [img1, img2, img3, img4, img5, img6];
const idleImages = [img7, img8, img9];

const TALKING_FRAME_RATE = 100; // 說話動畫幀率 (ms)，越小越快
const IDLE_SWITCH_RATE = 200;  // 待機動畫切換頻率 (ms)
const TYPING_SPEED_MS = 50;   // 打字速度 (ms)

const userInput = ref('');
const messages = ref([
  { sender: 'bot', text: '您好，有什麼可以協助您的嗎？' }
]);
const isLoading = ref(false);
const currentImage = ref(idleImages[0]); 
const botState = ref('idle'); 
const messagesContainer = ref(null);

let animationInterval = null; 
let talkingFrameIndex = 0; 

// --- 2. 動畫播放邏輯 ---
const playAnimation = () => {
  if (animationInterval) clearInterval(animationInterval);

  if (botState.value === 'talking') {
    animationInterval = setInterval(() => {
      talkingFrameIndex = (talkingFrameIndex + 1) % talkingImages.length;
      currentImage.value = talkingImages[talkingFrameIndex];
    }, TALKING_FRAME_RATE);
  } else { 
    animationInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * idleImages.length);
      currentImage.value = idleImages[randomIndex];
    }, IDLE_SWITCH_RATE);
  }
};

// --- 3. 打字機效果 ---
const typewriterEffect = (fullText) => {
  botState.value = 'talking'; 
  playAnimation(); 

  const botMessage = { sender: 'bot', text: '' };
  messages.value.push(botMessage);
  scrollToBottom();

  let charIndex = 0;
  const typingInterval = setInterval(() => {
    if (charIndex < fullText.length) {
      botMessage.text += fullText.charAt(charIndex);
      charIndex++;
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botState.value = 'idle'; 
      playAnimation(); 
      isLoading.value = false;
    }
  }, TYPING_SPEED_MS);
};

// --- 4. 訊息發送邏輯 ---
const sendMessage = async () => {
  if (userInput.value.trim() === '' || isLoading.value) return;

  const userMessageText = userInput.value;
  messages.value.push({ sender: 'user', text: userMessageText });
  userInput.value = '';
  scrollToBottom();

  isLoading.value = true;

  try {
    const response = await axios.post('http://localhost:8000/api/chat', {
      message: userMessageText
    });
    const reply = response.data.reply || response.data.error;
    typewriterEffect(reply);
  } catch (error) {
    console.error("API call failed:", error);
    const errorMessage = '抱歉，連線好像有點問題，請稍後再試。';
    typewriterEffect(errorMessage);
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// --- 5. 元件生命週期 ---
onMounted(() => {
  playAnimation(); 
});

onUnmounted(() => {
  if (animationInterval) clearInterval(animationInterval); 
});
</script>

<style scoped>
.chat-window {
  width: 400px;
  height: 500px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Microsoft JhengHei', '微軟正黑體', sans-serif;
}
.cat-avatar {
  text-align: center;
  padding: 10px;
  background-color: #f1f1f1;
  border-bottom: 1px solid #ddd;
}
.cat-avatar img {
  width: 100px; 
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #fff;
}
.messages-container {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}
.message {
  margin-bottom: 12px;
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 85%;
  word-wrap: break-word;
  line-height: 1.5;
}
.message.user {
  background-color: #007bff;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.message.bot {
  background-color: #e9e9eb;
  color: black;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.message-content :deep(p) {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.25;
}

.message-content :deep(hr) {
  border-top: 1px solid #ddd;
  margin: 1rem 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 0.5rem;
}

.message-content :deep(blockquote) {
  margin: 0 0 1rem 0;
  padding: 0.5rem 1rem;
  border-left: 4px solid #ccc;
  background-color: #f8f8f8;
  color: #555;
}

/* 表格樣式 */
.message-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  display: block;
  overflow-x: auto; /* 讓表格可以在手機上滑動 */
}

.message-content :deep(th),
.message-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.message-content :deep(th) {
  background-color: #f2f2f2;
  font-weight: bold;
}
.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
  background-color: #fff;
}
.input-area input {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 10px 15px;
  margin-right: 10px;
  font-size: 14px;
}
.input-area input:focus {
  outline: none;
  border-color: #007bff;
}
.input-area button {
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 20px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.input-area button:hover {
  background-color: #0056b3;
}
.input-area button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
</style>