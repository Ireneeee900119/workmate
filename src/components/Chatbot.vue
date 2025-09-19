<template>
  <div class="chat-window">
    <div class="cat-avatar">
      <img :src="currentImage" alt="Assistant Avatar" />
    </div>

    <div v-if="chatState === 'chatting'" class="points-display">
      您的積分：{{ totalPoints }} ✨
    </div>

    <div v-if="chatState === 'moodSelection'" class="mood-selection">
      <div class="mood-prompt">您好，我是您的 AI 助理松坂烤肉。<br>在開始前，可以先告訴我您今天的心情嗎？</div>
      <div class="mood-emojis">
        <span @click="selectMood('Very Happy', '😀')">😀</span>
        <span @click="selectMood('Pretty Good', '🙂')">🙂</span>
        <span @click="selectMood('Okay', '😐')">😐</span>
        <span @click="selectMood('Not So Good', '🙁')">🙁</span>
        <span @click="selectMood('Very Sad', '😢')">😢</span>
      </div>
    </div>

    <div v-if="chatState === 'chatting'" class="messages-container" ref="messagesContainer">
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.sender]">
        <div class="message-content" v-html="marked(msg.text)"></div>
      </div>
    </div>

    <div v-if="chatState === 'chatting'" class="input-area">
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

// --- 圖片載入 (維持不變) ---
import img1 from '@/assets/images/1.png';
import img2 from '@/assets/images/2.png';
import img3 from '@/assets/images/3.png';
import img4 from '@/assets/images/4.png';
import img5 from '@/assets/images/5.png';
import img6 from '@/assets/images/6.png';
import img7 from '@/assets/images/7.png';
import img8 from '@/assets/images/8.png';
import img9 from '@/assets/images/9.png';

const talkingImages = [img1, img2, img3, img4, img5, img6];
const idleImages = [img7, img8, img9];

// --- 常數設定 (維持不變) ---
const TALKING_FRAME_RATE = 100;
const IDLE_SWITCH_RATE = 200;
const TYPING_SPEED_MS = 50;

// --- Vue Refs (狀態) ---
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const currentImage = ref(null); // 初始值設為 null
const botState = ref('idle');
const messagesContainer = ref(null);
const sessionId = ref('');
const chatState = ref('moodSelection');
const totalPoints = ref(0);

let animationInterval = null;
let talkingFrameIndex = 0;

// --- 動畫與打字機效果函式 (維持不變) ---
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

const fetchTotalPoints = async () => {
  try {
    // 假設 user_id=1, 未來應從登入狀態取得
    const response = await axios.get('http://localhost:5174/api/points', { // 請確認埠號
      params: { user_id: 1 }
    });
    totalPoints.value = response.data.total_points;
  } catch (error) {
    console.error("獲取總積分失敗:", error);
    // 即使獲取失敗，也讓聊天繼續
  }
};

const selectMood = async (moodText, moodEmoji) => {
  chatState.value = 'chatting';
  messages.value.push({ sender: 'user', text: moodEmoji });
  scrollToBottom();
  isLoading.value = true;
  const firstMessage = `Today I'm feeling: ${moodText}.`;
  
  try {
    const response = await axios.post('http://localhost:5174/api/chat', { // 請再次確認埠號
      message: firstMessage,
      session_id: sessionId.value,
      mood: moodText
    });

    let finalReply = response.data.reply || response.data.error;

    if (response.data.total_points !== null && response.data.total_points !== undefined) {
      totalPoints.value = response.data.total_points;
    }

    if (finalReply && response.data.points_earned > 0) {
      // 只有在 points_earned > 0 的時候，才組合這條訊息
      const pointsMessage = `\n\n✨ 您今天首次記錄心情，獲得 1 點積分！總積分：${totalPoints.value}`;
      finalReply += pointsMessage;
    }
    
    typewriterEffect(finalReply);

  } catch (error) {
    console.error("API call failed:", error);
    const errorMessage = '抱歉，連線好像有點問題，請稍後再試。';
    typewriterEffect(errorMessage);
  }
};

const sendMessage = async () => {
  if (userInput.value.trim() === '' || isLoading.value) return;
  const userMessageText = userInput.value;
  messages.value.push({ sender: 'user', text: userMessageText });
  userInput.value = '';
  scrollToBottom();
  isLoading.value = true;
  try {
    const response = await axios.post('http://localhost:5174/api/chat', {
      message: userMessageText,
      session_id: sessionId.value
    });
    const reply = response.data.reply || response.data.error;
    typewriterEffect(reply);
  } catch (error)
 {
    console.error("API call failed:", error);
    const errorMessage = '抱歉，連線好像有點問題，請稍後再試。';
    typewriterEffect(errorMessage);
  }
};

// --- 畫面滾動函式 (維持不變) ---
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

onMounted(async () => {
  sessionId.value = crypto.randomUUID();
  console.log(`New chat session started with ID: ${sessionId.value}`);
  playAnimation();

  try {
    const response = await axios.get('http://localhost:5174/api/mood/check', { // 請確認埠號
        params: { user_id: 1 }
    });

    if (response.data.has_recorded) {
      chatState.value = 'chatting';
      // ===== 修改點 5: 如果直接進入聊天，也要獲取一次總積分 =====
      await fetchTotalPoints(); 
      typewriterEffect("歡迎回來！很高興再次見到您，今天有什麼我可以協助您的嗎？");
    } else {
      chatState.value = 'moodSelection';
    }
  } catch (error) {
    console.error("檢查心情記錄失敗:", error);
    chatState.value = 'moodSelection';
  }
});

onUnmounted(() => {
  if (animationInterval) clearInterval(animationInterval);
});

</script>

<style scoped>
.mood-selection {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  padding: 20px;
  text-align: center;
}
.mood-prompt {
  font-size: 16px;
  color: #333;
  margin-bottom: 25px;
  line-height: 1.6;
}
.mood-emojis {
  display: flex;
  gap: 15px;
}
.mood-emojis span {
  font-size: 36px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.mood-emojis span:hover {
  transform: scale(1.3);
}
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
.points-display {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 15px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  font-weight: bold;
  color: #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
}
.chat-window {
  position: relative; 
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