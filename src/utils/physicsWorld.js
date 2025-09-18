// 簡化的物理世界管理器（使用原生碰撞檢測）
export class PhysicsWorld {
  constructor() {
    this.world = null
    this.bodies = new Map() // 儲存所有物理體的參考
    this.bodyTypes = {
      STATIC: 'static',     // 靜態物體（地板、牆壁）
      DYNAMIC: 'dynamic',   // 動態物體（玩家）
      KINEMATIC: 'kinematic' // 運動學物體（移動平台等）
    }
    this.floorTypes = {
      GREEN: 'green',   // 草地
      GRAY: 'gray',     // 道路
      BLUE: 'blue'      // 建築物
    }
  }

  async init() {
    try {
      // 使用簡化的物理系統，不依賴外部庫
      this.world = {
        initialized: true
      }
      
      console.log('物理世界初始化成功（簡化版本）')
      return true
    } catch (error) {
      console.error('物理世界初始化失敗:', error)
      return false
    }
  }

  // 創建矩形碰撞體
  createRectangleBody(x, y, width, height, type = this.bodyTypes.STATIC, userData = {}) {
    if (!this.world) {
      console.error('物理世界尚未初始化')
      return null
    }

    // 儲存碰撞體資料（簡化版本）
    const bodyId = this.generateBodyId()
    this.bodies.set(bodyId, {
      userData: {
        id: bodyId,
        originalX: x,
        originalY: y,
        width,
        height,
        type,
        shape: 'rectangle',
        ...userData
      }
    })

    return bodyId
  }

  // 創建圓形碰撞體（用於玩家）
  createCircleBody(x, y, radius, type = this.bodyTypes.DYNAMIC, userData = {}) {
    if (!this.world) {
      console.error('物理世界尚未初始化')
      return null
    }

    // 儲存碰撞體資料（簡化版本）
    const bodyId = this.generateBodyId()
    this.bodies.set(bodyId, {
      userData: {
        id: bodyId,
        originalX: x,
        originalY: y,
        radius,
        type,
        shape: 'circle',
        ...userData
      }
    })

    return bodyId
  }

  // 檢測指定位置是否會發生碰撞
  testPosition(x, y, radius = 16, ignoreBodyId = null) {
    if (!this.world) return { canMove: true, collisions: [] }

    const collisions = []
    let canMove = true

    // 檢查所有物理體的碰撞
    for (const [bodyId, bodyData] of this.bodies) {
      if (bodyId === ignoreBodyId) continue

      const userData = bodyData.userData
      let isColliding = false

      // 根據形狀類型進行碰撞檢測
      if (userData.shape === 'rectangle') {
        // 圓形與矩形的碰撞檢測
        isColliding = this.circleRectangleCollision(
          x, y, radius,
          userData.originalX, userData.originalY, userData.width, userData.height
        )
      } else if (userData.shape === 'circle') {
        // 圓形與圓形的碰撞檢測
        const distance = Math.sqrt((x - userData.originalX) ** 2 + (y - userData.originalY) ** 2)
        isColliding = distance < (radius + userData.radius)
      }

      if (isColliding) {
        collisions.push(userData)
        
        // 根據碰撞物體類型決定是否可以移動
        if (userData.floorType === this.floorTypes.GREEN && !userData.isSensor) {
          canMove = false // 不能踏上草地
        } else if (userData.floorType === this.floorTypes.BLUE && !userData.isSensor) {
          canMove = false // 不能穿越建築物實體
        }
      }
    }

    return { canMove, collisions }
  }

  // 圓形與矩形的碰撞檢測
  circleRectangleCollision(cx, cy, radius, rx, ry, rw, rh) {
    // 找到矩形上最接近圓心的點
    const closestX = Math.max(rx, Math.min(cx, rx + rw))
    const closestY = Math.max(ry, Math.min(cy, ry + rh))
    
    // 計算圓心到最近點的距離
    const distanceX = cx - closestX
    const distanceY = cy - closestY
    const distanceSquared = distanceX * distanceX + distanceY * distanceY
    
    // 如果距離小於半徑，則發生碰撞
    return distanceSquared < (radius * radius)
  }

  // 移動動態物體到指定位置
  moveBody(bodyId, x, y) {
    const bodyData = this.bodies.get(bodyId)
    if (bodyData) {
      // 更新物體位置（簡化版本）
      bodyData.userData.originalX = x
      bodyData.userData.originalY = y
    }
  }

  // 獲取物體的當前位置
  getBodyPosition(bodyId) {
    const bodyData = this.bodies.get(bodyId)
    if (bodyData) {
      return {
        x: bodyData.userData.originalX,
        y: bodyData.userData.originalY
      }
    }
    return null
  }

  // 移除物體
  removeBody(bodyId) {
    this.bodies.delete(bodyId)
  }

  // 清理所有物體
  clearBodies() {
    this.bodies.clear()
  }

  // 更新物理世界（簡化版本不需要步進）
  step(deltaTime = 1/60) {
    // 簡化版本不需要物理步進
  }

  // 生成唯一的物體 ID
  generateBodyId() {
    return `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 銷毀物理世界
  destroy() {
    if (this.world) {
      this.clearBodies()
      this.world = null
    }
  }
}
