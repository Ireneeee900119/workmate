<template>
  <div class="tour-page">
    <div class="header">
      <div class="title-section">
        <h1>🏢 公司導覽地圖</h1>
        <p class="subtitle">探索我們的工作環境，了解每個部門的功能</p>
      </div>
      <div class="controls">
        <div class="control-hints">
          <span class="hint-item">🎮 方向鍵 / WASD 自由移動</span>
          <span class="hint-item">🏢 碰觸藍色建築物查看詳情</span>
          <span class="hint-item">👆 點擊地圖快速移動</span>
          <span class="hint-item">📍 靠近建築物入口查看資訊</span>
        </div>
        <button @click="resetProgress" class="reset-btn">🔄 重置進度</button>
      </div>
    </div>

    <div class="layout">
      <div class="scene">
        <canvas ref="gameCanvas" class="game-canvas pixelated" :width="canvasSize.w" :height="canvasSize.h" @click="onMapClick"></canvas>
      </div>

      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>📍 已探索區域</h3>
          <div class="progress-badge">{{ discoveredAreas.length }}/{{ buildings.length }}</div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (discoveredAreas.length / buildings.length * 100) + '%' }"></div>
        </div>
        
        <div class="areas-list">
          <div v-if="discoveredAreas.length === 0" class="empty-state">
            <p>🚶‍♂️ 開始探索吧！</p>
            <small>移動到建築物附近來發現新區域</small>
          </div>
          
          <div v-for="area in groupedAreas" :key="area.category" class="area-group">
            <h4 class="group-title">{{ area.category }}</h4>
            <ul class="area-items">
              <li v-for="a in area.items" :key="a.id" class="area-item">
                <button class="area-link" @click="focusArea(a)">
                  <span class="area-name">{{ a.name }}</span>
                  <span class="area-tags">
                    <span v-for="tag in a.tags.slice(0, 2)" :key="tag" class="mini-tag">{{ tag }}</span>
                  </span>
                </button>
          </li>
        </ul>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="modal.open" class="modal" @click.self="closeModal">
      <div class="modal-card">
        <h2>{{ modal.area?.name }}</h2>
        <p class="desc">{{ modal.area?.description }}</p>
        <div class="tags" v-if="modal.area?.tags?.length">
          <span class="tag" v-for="t in modal.area.tags" :key="t">{{ t }}</span>
        </div>
        <div class="actions">
          <button @click="closeModal">關閉</button>
        </div>
      </div>
    </div>

    <!-- RPG 對話框（靠近設施自動顯示） -->
    <div v-if="dialogue.open" class="dialogue-bar">
      <div class="dialogue-inner">
        <div class="speaker">{{ dialogue.area?.name || '設施' }}</div>
        <div class="content">
          <span>{{ dialogue.visibleText }}</span>
          <span v-if="dialogue.typing" class="cursor">▌</span>
          <span v-else class="hint">（Enter 查看詳情 · Esc 關閉）</span>
        </div>
      </div>
    </div>

    <div class="toast" v-if="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { PixiGameRenderer } from '../utils/pixiRenderer.js'
import { PhysicsWorld } from '../utils/physicsWorld.js'

// 地圖尺寸 / 像素格大小 - 使用固定尺寸
const CANVAS_WIDTH = 800  // 固定寬度
const CANVAS_HEIGHT = 600 // 固定高度
const MOVE_SPEED = 3 // 每次移動的像素數

// PixiJS 渲染器和物理世界
const gameCanvas = ref(null)
const canvasSize = reactive({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT, tileSize: 32 })
let pixiRenderer = null
let physicsWorld = null
let playerBodyId = null
const floorBodies = new Map() // 儲存地板碰撞體的 ID

// 固定尺寸 - 不需要響應式計算
// Canvas 尺寸已經在上面定義為固定值

// 建築物定義
const buildings = [
  {
    id: 'lobby',
    name: '大廳 Lobby',
    description: '公司入口與接待區，歡迎你的到來。這裡是所有訪客的第一站。',
    tags: ['接待', '起點'],
    x: 200, y: 400, width: 150, height: 100,
    color: 0x3b82f6, // 藍色
    entrance: { x: 275, y: 450 }
  },
  {
    id: 'engineering',
    name: '工程部 Engineering',
    description: '技術團隊的核心工作區域，這裡進行軟體開發、系統設計與技術創新。',
    tags: ['工程', 'IT', '研發'],
    x: 400, y: 200, width: 180, height: 120,
    color: 0x10b981, // 綠色
    entrance: { x: 490, y: 260 }
  },
  {
    id: 'meeting_room',
    name: '會議室 Meeting Room',
    description: '團隊協作與重要決策的討論空間，配備先進的視訊會議設備。',
    tags: ['會議', '協作'],
    x: 50, y: 200, width: 140, height: 80,
    color: 0xf59e0b, // 橙色
    entrance: { x: 120, y: 240 }
  },
  {
    id: 'hr_department',
    name: '人資部 HR Department',
    description: '人力資源管理中心，負責員工招募、培訓發展與福利規劃。',
    tags: ['HR', '行政'],
    x: 600, y: 400, width: 160, height: 90,
    color: 0x8b5cf6, // 紫色
    entrance: { x: 680, y: 445 }
  },
  {
    id: 'cafeteria',
    name: '員工餐廳 Cafeteria',
    description: '提供美味餐點與舒適用餐環境的員工餐廳，也是同事交流的好地方。',
    tags: ['餐飲', '休息', 'Wellbeing'],
    x: 50, y: 50, width: 200, height: 100,
    color: 0xef4444, // 紅色
    entrance: { x: 150, y: 100 }
  },
  {
    id: 'wellness_center',
    name: '健康中心 Wellness Center',
    description: '員工身心健康的照護中心，提供健康諮詢、放鬆空間與運動設施。',
    tags: ['Wellbeing', '健康', '休息'],
    x: 550, y: 50, width: 170, height: 110,
    color: 0x06b6d4, // 青色
    entrance: { x: 635, y: 105 }
  },
  {
    id: 'training_room',
    name: '培訓教室 Training Room',
    description: '員工學習與發展的專業空間，定期舉辦技能培訓與知識分享活動。',
    tags: ['學習', '培訓'],
    x: 320, y: 50, width: 150, height: 90,
    color: 0x84cc16, // 萊姆綠
    entrance: { x: 395, y: 95 }
  },
  {
    id: 'executive_office',
    name: '主管辦公室 Executive Office',
    description: '公司高層主管的辦公空間，重要的策略規劃與決策在此進行。',
    tags: ['管理', '決策'],
    x: 600, y: 250, width: 130, height: 100,
    color: 0x6366f1, // 靛色
    entrance: { x: 665, y: 300 }
  }
]

// 簡化道路定義（測試用）
const roads = [
  // 一條橫向主幹道，穿過地圖中央
  { x: 0, y: 300, width: 800, height: 30, type: 'horizontal' }
]

// 建立快速查詢的 Map
const buildingById = new Map(buildings.map(building => [building.id, building]))

// 障礙物就是建築物本身（不能穿越建築物）
const walls = buildings

// 狀態 - 起始位置設在大廳外面的空曠區域
const player = reactive({ x: 150, y: 450 }) // 起點：大廳外面的空曠區域
const visitedAreas = ref(new Set()) // 已造訪的區域 ID
const discovered = ref(new Set()) // 已探索的區域 id
const toast = ref('')
const modal = reactive({ open: false, area: null })
// 對話框狀態（靠近設施）
const dialogue = reactive({ open: false, text: '', visibleText: '', typing: false, area: null })
let typeTimer = null

// 按鍵狀態追蹤
const keyPressed = reactive({ up: false, down: false, left: false, right: false })

// 已探索區域計算

// 計算已發現的建築物
const discoveredAreas = computed(() => {
  return buildings.filter(building => discovered.value.has(building.id))
})

// 將已探索區域按類別分組
const groupedAreas = computed(() => {
  const areas = discoveredAreas.value
  const groups = {}
  
  areas.forEach(area => {
    let category = '其他'
    
    if (area.tags.includes('接待') || area.tags.includes('服務')) {
      category = '🏛️ 接待服務'
    } else if (area.tags.includes('HR') || area.tags.includes('財務') || area.tags.includes('行政')) {
      category = '📊 行政管理'
    } else if (area.tags.includes('工程') || area.tags.includes('IT') || area.tags.includes('研發')) {
      category = '💻 技術開發'
    } else if (area.tags.includes('會議') || area.tags.includes('協作')) {
      category = '🤝 會議協作'
    } else if (area.tags.includes('餐飲') || area.tags.includes('休息') || area.tags.includes('娛樂') || area.tags.includes('Wellbeing')) {
      category = '🌟 休閒福利'
    } else if (area.tags.includes('學習') || area.tags.includes('培訓')) {
      category = '📚 學習培訓'
    } else if (area.tags.includes('管理') || area.tags.includes('決策')) {
      category = '👔 高層管理'
    }
    
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(area)
  })
  
  return Object.entries(groups).map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.name.localeCompare(b.name))
  })).sort((a, b) => a.category.localeCompare(b.category))
})

// 工具函數

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

// 初始化物理世界
async function initPhysicsWorld() {
  physicsWorld = new PhysicsWorld()
  const success = await physicsWorld.init()
  
  if (!success) {
    console.error('物理世界初始化失敗')
    return false
  }

  // 創建地板碰撞體
  createFloorBodies()
  
  // 創建玩家碰撞體
  createPlayerBody()
  
  console.log('物理世界初始化完成')
  return true
}

// 創建地板碰撞體
function createFloorBodies() {
  if (!physicsWorld) return

  // 清除現有的地板碰撞體
  for (const bodyId of floorBodies.values()) {
    physicsWorld.removeBody(bodyId)
  }
  floorBodies.clear()

  // 整張圖都是灰色地板，不需要創建背景碰撞體
  // 只需要創建建築物碰撞體作為障礙物

  // 創建建築物碰撞體
  for (const [index, building] of buildings.entries()) {
    const buildingBodyId = physicsWorld.createRectangleBody(
      building.x, building.y, building.width, building.height,
      physicsWorld.bodyTypes.STATIC,
      {
        floorType: physicsWorld.floorTypes.BLUE,
        name: building.name,
        buildingId: building.id,
        building: building,
        isSensor: true // 用於觸發事件，不阻擋移動
      }
    )
    floorBodies.set(`building_${building.id}`, buildingBodyId)
  }
}

// 創建玩家物理體
function createPlayerBody() {
  if (!physicsWorld) return

  // 移除現有的玩家碰撞體
  if (playerBodyId) {
    physicsWorld.removeBody(playerBodyId)
  }

  // 創建新的玩家碰撞體（圓形，半徑 16px）
  playerBodyId = physicsWorld.createCircleBody(
    player.x, player.y, 16,
    physicsWorld.bodyTypes.DYNAMIC,
    {
      name: 'player',
      isPlayer: true
    }
  )
}

// 檢查位置的地板類型
function getFloorTypeAtPosition(x, y, playerSize = 16) {
  // 檢查是否在建築物上（藍色）
  for (const building of buildings) {
    if (x + playerSize > building.x && 
        x - playerSize < building.x + building.width &&
        y + playerSize > building.y && 
        y - playerSize < building.y + building.height) {
      return 'blue' // 建築物區域
    }
  }
  
  // 檢查是否在道路上（灰色）
  for (const road of roads) {
    if (x + playerSize > road.x && 
        x - playerSize < road.x + road.width &&
        y + playerSize > road.y && 
        y - playerSize < road.y + road.height) {
      return 'gray' // 道路區域
    }
  }
  
  // 其他地方都是草地（綠色）
  return 'green' // 草地區域
}

// 檢查位置是否在道路上（保留向後相容性）
function isOnRoad(x, y, playerSize = 16) {
  return getFloorTypeAtPosition(x, y, playerSize) === 'gray'
}

// 檢查是否與建築物碰撞
function checkBuildingCollision(x, y, playerSize = 16) {
  for (const building of buildings) {
    if (x + playerSize > building.x && 
        x - playerSize < building.x + building.width &&
        y + playerSize > building.y && 
        y - playerSize < building.y + building.height) {
      return true
    }
  }
  return false
}

// 檢查位置是否有效（在道路上且不與建築物碰撞）
function isValidPosition(x, y, playerSize = 16) {
  return isOnRoad(x, y, playerSize) && !checkBuildingCollision(x, y, playerSize)
}

// 檢查玩家是否在某個建築物入口附近
function getBuildingAtPosition(x, y) {
  for (const building of buildings) {
    const distance = Math.sqrt((x - building.entrance.x) ** 2 + (y - building.entrance.y) ** 2)
    if (distance <= 25) { // 25像素範圍內算靠近入口
      return building
    }
  }
  return null
}

function tryMove(dx, dy) {
  if (!physicsWorld || !playerBodyId) {
    console.warn('物理世界或玩家碰撞體尚未初始化')
    return
  }

  const speed = MOVE_SPEED
  const nx = clamp(player.x + dx * speed, 16, CANVAS_WIDTH - 16)
  const ny = clamp(player.y + dy * speed, 16, CANVAS_HEIGHT - 16)
  
  // 使用 Box2D 檢測目標位置的碰撞
  const collisionTest = physicsWorld.testPosition(nx, ny, 16, playerBodyId)
  
  // 分析碰撞結果
  let touchingBuilding = null
  
  for (const collision of collisionTest.collisions) {
    if (collision.floorType === physicsWorld.floorTypes.BLUE) {
      // 碰撞建築物：觸發事件
      touchingBuilding = collision.building
      break
    }
  }
  
  // 如果碰撞到建築物，只在首次發現時彈出介紹
  if (touchingBuilding) {
    // 首次發現建築物時才彈出介紹
    if (!discovered.value.has(touchingBuilding.id)) {
      discovered.value.add(touchingBuilding.id)
      showToast(`發現建築：${touchingBuilding.name}`)
      // 只在首次發現時彈出建築物介紹
      openBuilding(touchingBuilding)
    }
    // 不 return，允許玩家移動穿過建築物
  }
  
  // 整張圖都是灰色地板，預設可以移動（除非碰撞建築物）
  player.x = nx
  player.y = ny
  
  // 更新物理世界中的玩家位置
  physicsWorld.moveBody(playerBodyId, nx, ny)
  
  // 檢查是否靠近建築物入口
  const currentBuilding = getBuildingAtPosition(player.x, player.y)
  if (currentBuilding) {
    const wasNew = !visitedAreas.value.has(currentBuilding.id)
    visitedAreas.value.add(currentBuilding.id)
    
    if (!discovered.value.has(currentBuilding.id)) {
      discovered.value.add(currentBuilding.id)
      showToast(`新建築解鎖：${currentBuilding.name}`)
    }
  }
  
  updateProximity()
  updatePixiRenderer()
}

function onKeyDown(e) {
  // 更新按鍵狀態
  updateKeyState(e.key, true)
  
  // 對話框優先處理
  if (dialogue.open) {
    if (e.key === 'Escape') { e.preventDefault(); closeDialogue(); return }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (dialogue.typing) { finishTyping() }
      else if (dialogue.area) { openArea(dialogue.area) }
      return
    }
  }
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': e.preventDefault(); tryMove(0, -1); break
    case 'ArrowDown': case 's': case 'S': e.preventDefault(); tryMove(0, 1); break
    case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); tryMove(-1, 0); break
    case 'ArrowRight': case 'd': case 'D': e.preventDefault(); tryMove(1, 0); break
    case 'Enter': case ' ': openCurrent(); break
  }
}

function onKeyUp(e) {
  updateKeyState(e.key, false)
}

function updateKeyState(key, pressed) {
  switch (key.toLowerCase()) {
    case 'arrowup': case 'w': keyPressed.up = pressed; break
    case 'arrowdown': case 's': keyPressed.down = pressed; break
    case 'arrowleft': case 'a': keyPressed.left = pressed; break
    case 'arrowright': case 'd': keyPressed.right = pressed; break
  }
}

function simulateKey(key) {
  const event = new KeyboardEvent('keydown', { key })
  onKeyDown(event)
}

function releaseKey(direction) {
  keyPressed[direction] = false
}

function openCurrent() {
  const here = getBuildingAtPosition(player.x, player.y)
  if (here) openBuilding(here)
}

// 建築物相關函數
function openBuilding(building) { modal.open = true; modal.area = building }
function closeModal() { modal.open = false; modal.area = null }

function focusArea(a) {
  const building = buildingById.get(a.id)
  if (building) {
    player.x = building.entrance.x
    player.y = building.entrance.y
    visitedAreas.value.add(building.id)
    updatePixiRenderer()
    openBuilding(building)
  }
}

function onMapClick(e) {
  if (!pixiRenderer || !gameCanvas.value || !physicsWorld || !playerBodyId) return
  
  const rect = gameCanvas.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  
  // 使用 Box2D 檢測點擊位置的碰撞
  const collisionTest = physicsWorld.testPosition(mx, my, 16)
  
  // 分析點擊位置是否有建築物
  let clickedBuilding = null
  
  for (const collision of collisionTest.collisions) {
    if (collision.floorType === physicsWorld.floorTypes.BLUE) {
      clickedBuilding = collision.building
      break
    }
  }
  
  // 如果點擊建築物，只在首次發現時彈出介紹
  if (clickedBuilding) {
    if (!discovered.value.has(clickedBuilding.id)) {
      discovered.value.add(clickedBuilding.id)
      showToast(`發現建築：${clickedBuilding.name}`)
      // 只在首次發現時彈出介紹
      openBuilding(clickedBuilding)
    } else {
      // 已發現的建築物，點擊時顯示提示但不彈出介紹
      showToast(`已探索：${clickedBuilding.name}`)
    }
    return
  }
  
  // 檢查是否點擊了已探索的建築物入口附近
  const nearbyBuilding = getBuildingAtPosition(mx, my)
  if (nearbyBuilding && visitedAreas.value.has(nearbyBuilding.id)) {
    // 移動到建築物入口附近
    const entranceX = nearbyBuilding.entrance.x
    const entranceY = nearbyBuilding.entrance.y
    
    // 檢查入口周圍的空地
    const offsets = [
      {x: 0, y: -40}, {x: 0, y: 40}, {x: -40, y: 0}, {x: 40, y: 0}, // 四個方向
      {x: -30, y: -30}, {x: 30, y: -30}, {x: -30, y: 30}, {x: 30, y: 30} // 對角線
    ]
    
    let targetX = entranceX
    let targetY = entranceY
    
    for (const offset of offsets) {
      const testX = entranceX + offset.x
      const testY = entranceY + offset.y
      const testCollision = physicsWorld.testPosition(testX, testY, 16)
      const hasBuilding = testCollision.collisions.some(c => c.floorType === physicsWorld.floorTypes.BLUE)
      if (!hasBuilding) {
        targetX = testX
        targetY = testY
        break
      }
    }
    
    player.x = targetX
    player.y = targetY
    physicsWorld.moveBody(playerBodyId, targetX, targetY)
    showToast(`移動到：${nearbyBuilding.name} 附近`)
    updateProximity()
    updatePixiRenderer()
    return
  }
  
  // 整張圖都是灰色地板，可以點擊移動（距離限制）
  const distance = Math.sqrt((mx - player.x) ** 2 + (my - player.y) ** 2)
  if (distance < 150) { // 150像素內可以直接移動
    player.x = mx
    player.y = my
    physicsWorld.moveBody(playerBodyId, mx, my)
    updateProximity()
    updatePixiRenderer()
  } else if (distance >= 150) {
    showToast('距離太遠，請逐步移動！')
  }
}

// Toast
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 1800)
}

// 對話框（打字機效果）
function startDialogue(area) {
  if (!area) return
  // 若已顯示相同區域則不重覆觸發
  if (dialogue.open && dialogue.area?.id === area.id && !dialogue.typing) return
  stopTyping()
  dialogue.open = true
  dialogue.area = area
  dialogue.text = `${area.description}`
  dialogue.visibleText = ''
  dialogue.typing = true
  let i = 0
  typeTimer = setInterval(() => {
    if (i >= dialogue.text.length) { finishTyping(); return }
    dialogue.visibleText += dialogue.text[i]
    i++
  }, 18)
}
function finishTyping() { stopTyping(); dialogue.visibleText = dialogue.text }
function stopTyping() { if (typeTimer) { clearInterval(typeTimer); typeTimer = null } dialogue.typing = false }
function closeDialogue() { stopTyping(); dialogue.open = false; dialogue.area = null }

function updateProximity() {
  // 檢查玩家附近是否有建築物入口（30像素範圍內）
  const proximityRange = 30
  let nearestBuilding = null
  let minDistance = Infinity
  
  for (const building of buildings) {
    const distance = Math.sqrt((player.x - building.entrance.x) ** 2 + (player.y - building.entrance.y) ** 2)
    if (distance <= proximityRange && distance < minDistance) {
      minDistance = distance
      nearestBuilding = building
    }
  }
  
  if (nearestBuilding) {
    startDialogue(nearestBuilding)
  } else if (dialogue.open) {
    closeDialogue()
  }
}

// 儲存/載入
const STORAGE_KEY = 'office_tour_state_v2' // 版本更新
function saveState() {
  const data = {
    player: { x: player.x, y: player.y },
    visitedAreas: Array.from(visitedAreas.value),
    discovered: Array.from(discovered.value)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    // 初始造訪起點並發現該建築物
    const startBuilding = getBuildingAtPosition(player.x, player.y)
    if (startBuilding) {
      visitedAreas.value.add(startBuilding.id)
      discovered.value.add(startBuilding.id)
    }
    return
  }
  try {
    const data = JSON.parse(raw)
    if (data?.player) {
      player.x = data.player.x || 150
      player.y = data.player.y || 450
    }
    visitedAreas.value = new Set(data?.visitedAreas || [])
    discovered.value = new Set(data?.discovered || [])
  } catch {}
}
function resetProgress() {
  localStorage.removeItem(STORAGE_KEY)
  visitedAreas.value = new Set()
  discovered.value = new Set()
  player.x = 150
  player.y = 450
  // 重新發現起始建築物（如果有的話）
  const startBuilding = getBuildingAtPosition(player.x, player.y)
  if (startBuilding) {
    visitedAreas.value.add(startBuilding.id)
    discovered.value.add(startBuilding.id)
  }
  updatePixiRenderer()
  showToast('已重置探索進度')
}

watch([() => player.x, () => player.y, visitedAreas, discovered], saveState, { deep: true })

// 更新 PixiJS 渲染器
function updatePixiRenderer() {
  if (pixiRenderer) {
    console.log('更新玩家位置:', player.x, player.y)
    console.log('道路範圍:', roads[0])
    console.log('建築物範圍:', buildings[0])
    pixiRenderer.updateGame({
      player,
      visitedAreas: visitedAreas.value,
      buildings,
      roads,
      discovered: discovered.value
    })
  }
}

onMounted(async () => {
  loadState()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  
  // 延遲一幀以確保 DOM 已渲染
  await new Promise(resolve => requestAnimationFrame(resolve))
  
  try {
    // 初始化物理世界
    const physicsSuccess = await initPhysicsWorld()
    if (!physicsSuccess) {
      throw new Error('物理世界初始化失敗')
    }
    
    // 初始化 PixiJS 渲染器
    const canvas = gameCanvas.value
    if (canvas) {
      pixiRenderer = new PixiGameRenderer(canvas, {
        tileSize: canvasSize.tileSize,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      })
      
      // 等待初始化完成
      await pixiRenderer.init()
      console.log('PixiJS 初始化成功')
      updateProximity()
      updatePixiRenderer()
    }
  } catch (error) {
    console.error('初始化失敗:', error)
    showToast('遊戲初始化失敗，請重新整理頁面')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (pixiRenderer) {
    pixiRenderer.destroy()
  }
  if (physicsWorld) {
    physicsWorld.destroy()
  }
})

// PixiJS 已取代 Canvas 繪製
</script>

<style scoped>
.tour-page { 
  padding: 16px; 
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.header { 
  display: flex; 
  align-items: flex-start; 
  justify-content: space-between; 
  gap: 16px; 
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.title-section h1 { 
  margin: 0 0 8px 0; 
  font-size: 28px; 
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.025em;
}

.subtitle { 
  margin: 0; 
  color: #64748b; 
  font-size: 16px; 
  line-height: 1.5;
}

.controls { 
  display: flex; 
  flex-direction: column;
  align-items: flex-end; 
  gap: 12px; 
}

.control-hints {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.hint-item { 
  color: #64748b; 
  font-size: 14px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.reset-btn { 
  background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
  color: #fff; 
  border: none; 
  padding: 8px 16px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.reset-btn:hover { 
  background: linear-gradient(135deg, #1d4ed8, #1e40af); 
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.layout { 
  display: grid; 
  grid-template-columns: 1fr 280px; /* 讓左側充分利用空間 */
  gap: 20px; 
  min-height: calc(100vh - 200px);
  align-items: start;
  width: 100%;
  max-width: 100vw;
}

.map {
  display: grid;
  gap: 4px;
  background: #f3f4f6;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  user-select: none;
}

.tile {
  width: var(--tile-size); height: var(--tile-size);
  border-radius: 6px;
  background: #e5e7eb;
  position: relative;
  display: grid; place-items: center;
  transition: background .15s ease, box-shadow .15s ease;
}
.tile.wall { background: #cbd5e1; box-shadow: inset 0 0 0 2px #94a3b8; }
.tile.visited { background: #dbeafe; }
.tile.poi.visited { background: #c7d2fe; }
.tile.current { outline: 2px solid #3b82f6; background: #bfdbfe; }
.tile.unseen { filter: grayscale(1) brightness(0.85); }
.tile:hover { box-shadow: 0 0 0 2px rgba(59,130,246,.3); }

.player {
  width: calc(var(--tile-size) * .6);
  height: calc(var(--tile-size) * .6);
  border-radius: 4px;
  background: #0f172a;
  box-shadow: 0 0 0 2px #22d3ee inset, 0 0 8px rgba(34,211,238,.5);
}

.poi-dot { width: 6px; height: 6px; border-radius: 1px; background: #111827; opacity: .7; box-shadow: 0 0 0 1px #111827 inset; }

.sidebar { 
  background: #fff; 
  border: 1px solid #e2e8f0; 
  border-radius: 12px; 
  padding: 20px; 
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sidebar-header h3 { 
  margin: 0; 
  font-size: 18px; 
  font-weight: 600;
  color: #1e293b;
}

.progress-badge {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.progress-bar {
  background: #f1f5f9;
  height: 6px;
  border-radius: 3px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.empty-state small {
  font-size: 14px;
  color: #94a3b8;
}

.area-group {
  margin-bottom: 20px;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.area-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}

.area-item {
  margin: 0;
}

.area-link {
  background: none;
  border: 1px solid #e2e8f0;
  color: #334155;
  cursor: pointer;
  padding: 12px; 
  border-radius: 8px;
  text-align: left;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.area-link:hover {
  background: #f8fafc;
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.area-name {
  font-weight: 500;
  font-size: 14px;
}

.area-tags {
  display: flex;
  gap: 4px;
}

.mini-tag {
  font-size: 10px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.modal { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: grid; place-items: center; padding: 16px; z-index: 100; }
.modal-card { background: #fff; border-radius: 12px; padding: 16px; width: min(520px, 92vw); box-shadow: 0 10px 30px rgba(0,0,0,.2); }
.modal-card h2 { margin: 0 0 6px 0; }
.modal-card .desc { color: #4b5563; line-height: 1.6; }
.modal-card .tags { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.tag { font-size: 12px; background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 999px; border: 1px solid #e2e8f0; }
.actions { margin-top: 14px; display: flex; justify-content: flex-end; }
.actions button { background: #111827; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.actions button:hover { background: #0b1220; }

.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 18px; background: #111827; color: #fff; padding: 6px 10px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.2); z-index: 120; }

/* 像素化視覺 */
.pixelated { image-rendering: pixelated; }


.scene {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin: 0 auto;
}

.game-canvas {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  background: #ffffff;
  width: 800px;
  height: 600px;
}

/* RPG 對話框 */
.dialogue-bar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 110;
  padding: 8px 10px 12px; background: linear-gradient(to top, rgba(15,23,42,.92), rgba(15,23,42,.75));
  border-top: 1px solid rgba(148,163,184,.4);
}
.dialogue-inner {
  max-width: 980px; margin: 0 auto; color: #e5e7eb; font-size: 14px;
}
.dialogue-inner .speaker { font-weight: 800; color: #f472b6; margin-bottom: 4px; letter-spacing: .3px; }
.dialogue-inner .content { line-height: 1.7; }
.dialogue-inner .cursor { margin-left: 4px; animation: blink 1s steps(1,end) infinite; }
.dialogue-inner .hint { margin-left: 8px; color: #94a3b8; font-size: 12px; }

@keyframes blink { 50% { opacity: 0; } }

@media (max-width: 860px) {
  .layout { 
    grid-template-columns: 1fr; 
    gap: 16px;
  }
  
  .scene {
    min-height: 300px;
    padding: 12px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }
  
  .title-section h1 {
    font-size: 24px;
  }
  
  .controls {
    align-items: flex-start;
    width: 100%;
  }
  
  .control-hints {
    align-items: flex-start;
    text-align: left;
  }
  
  .hint-item {
    font-size: 13px;
  }
  
  .sidebar {
    min-width: auto;
    max-width: none;
    max-height: none;
  }
}

@media (max-width: 480px) {
  .tour-page {
    padding: 8px;
  }
  
  .scene {
    min-height: auto;
    padding: 6px;
  }
  
  .sidebar {
    padding: 8px;
  }
  
  .modal-card {
    padding: 12px;
    width: min(400px, 95vw);
  }
}
</style>




