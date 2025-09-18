// PixiJS 渲染器和遊戲邏輯
import * as PIXI from 'pixi.js'
import { createCharacterTextures, createFloorTextures, createPOITextures, createParticleTextures } from './pixelAssets.js'

export class PixiGameRenderer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement
    this.TILE_SIZE = options.tileSize || 32
    this.width = options.width || 800
    this.height = options.height || 600
    
    // 初始化 PIXI 應用 (PixiJS 8.0 新方式)
    this.app = null
    this.appOptions = {
      canvas: canvasElement,
      width: this.width,
      height: this.height,
      backgroundColor: 0x4ade80, // 綠色背景
      antialias: false,
      resolution: 1
    }
    
    this.textures = {}
    this.sprites = {}
    this.containers = {}
    this.particles = []
  }
  
  async init() {
    // 使用 PixiJS 8.0 的新初始化方式
    this.app = new PIXI.Application()
    await this.app.init(this.appOptions)
    
    // 關閉抗鋸齒以保持像素風格
    try {
      PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST
    } catch (e) {
      // PixiJS 8.0 可能使用不同的API
      console.warn('無法設置縮放模式:', e)
    }
    
    // 創建紋理
    this.textures = {
      ...createFloorTextures(this.app.renderer),
      ...createCharacterTextures(this.app.renderer),
      ...createPOITextures(this.app.renderer),
      ...createParticleTextures(this.app.renderer)
    }
    
    console.log('創建的紋理:', Object.keys(this.textures))
    
    // 創建容器
    this.containers.floor = new PIXI.Container()
    this.containers.pois = new PIXI.Container()
    this.containers.character = new PIXI.Container()
    this.containers.effects = new PIXI.Container()
    
    // 添加到舞台
    this.app.stage.addChild(this.containers.floor)
    this.app.stage.addChild(this.containers.pois)
    this.app.stage.addChild(this.containers.character)
    this.app.stage.addChild(this.containers.effects)
    
    // 創建角色精靈
    console.log('idle 紋理存在嗎?', !!this.textures.idle)
    this.sprites.character = new PIXI.Sprite(this.textures.idle)
    this.sprites.character.anchor.set(0.5)
    this.sprites.character.scale.set(2) // 放大角色使其更明顯
    this.containers.character.addChild(this.sprites.character)
    console.log('角色精靈已創建並添加到容器')
    
    // 添加角色光暈效果
    const glow = new PIXI.Graphics()
    glow.circle(0, 0, 12).fill({ color: 0x22d3ee, alpha: 0.3 })
    this.sprites.characterGlow = glow
    this.containers.character.addChild(glow)
    
    // 不再需要網格系統，改用向量圖形
    
    // 設置動畫循環
    this.app.ticker.add(this.animate.bind(this))
  }
  
  // 更新遊戲狀態
  updateGame(gameState) {
    const { player, visitedAreas, buildings, roads, discovered } = gameState
    
    // 清除現有內容並重新繪製地圖
    this.containers.floor.removeChildren()
    this.containers.pois.removeChildren()
    
    // 繪製道路
    for (const road of roads) {
      const roadGraphic = new PIXI.Graphics()
      roadGraphic.rect(road.x, road.y, road.width, road.height)
      roadGraphic.fill({ color: 0x6b7280 }) // 灰色道路
      this.containers.floor.addChild(roadGraphic)
    }
    
    // 繪製灰色地板背景
    const floorGraphic = new PIXI.Graphics()
    floorGraphic.rect(0, 0, this.width, this.height)
    floorGraphic.fill({ color: 0x6b7280 }) // 灰色地板
    this.containers.floor.addChildAt(floorGraphic, 0) // 放在最底層
    
    // 繪製建築物
    for (const building of buildings) {
      const buildingGraphic = new PIXI.Graphics()
      
      // 建築物主體
      buildingGraphic.rect(building.x, building.y, building.width, building.height)
      buildingGraphic.fill({ color: building.color })
      buildingGraphic.stroke({ color: 0x374151, width: 2 }) // 深灰色邊框
      
      // 如果已發現，顯示建築物名稱
      if (discovered.has(building.id)) {
        // 建築物標籤
        const text = new PIXI.Text({
          text: building.name.replace(' ', '\n'),
          style: {
            fontSize: 10,
            fill: 0xffffff,
            fontWeight: 'bold',
            align: 'center'
          }
        })
        text.anchor.set(0.5)
        text.x = building.x + building.width / 2
        text.y = building.y + building.height / 2
        this.containers.pois.addChild(text)
        
      } else {
        // 未發現的建築物顯示為暗色
        buildingGraphic.tint = 0x666666
      }
      
      this.containers.floor.addChild(buildingGraphic)
    }
    
    // 更新角色位置（直接使用像素座標）
    console.log('PixiJS 接收到玩家位置:', player.x, player.y)
    this.updateCharacterPosition(player.x, player.y, false)
  }
  
  // 更新角色位置（現在直接使用像素座標）
  updateCharacterPosition(pixelX, pixelY, animate = true) {
    console.log('updateCharacterPosition 被調用:', pixelX, pixelY)
    console.log('角色精靈存在嗎?', !!this.sprites.character)
    
    if (!this.sprites.character) return
    
    // 直接設置像素位置
    this.sprites.character.x = pixelX
    this.sprites.character.y = pixelY
    
    console.log('角色精靈位置已設定:', this.sprites.character.x, this.sprites.character.y)
    
    // 同步光暈位置
    if (this.sprites.characterGlow) {
      this.sprites.characterGlow.x = pixelX
      this.sprites.characterGlow.y = pixelY
    }
  }
  
  // 緩動函數
  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4)
  }
  
  // 創建移動軌跡效果
  createMovementTrail(startX, startY, endX, endY) {
    const steps = 5
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        const progress = i / steps
        const x = startX + (endX - startX) * progress
        const y = startY + (endY - startY) * progress
        
        const trail = new PIXI.Sprite(this.textures.particle)
        trail.anchor.set(0.5)
        trail.x = x
        trail.y = y
        trail.alpha = 0.6
        trail.scale.set(0.5)
        trail.tint = 0x22d3ee
        
        this.containers.effects.addChild(trail)
        
        // 淡出效果
        const fadeOut = () => {
          trail.alpha -= 0.05
          trail.scale.x *= 1.02
          trail.scale.y *= 1.02
          if (trail.alpha > 0) {
            requestAnimationFrame(fadeOut)
          } else {
            this.containers.effects.removeChild(trail)
          }
        }
        
        setTimeout(fadeOut, 50)
      }, i * 20)
    }
  }
  
  // 創建探索效果（使用像素座標）
  createExplorationEffect(pixelX, pixelY) {
    // 創建粒子效果
    for (let i = 0; i < 8; i++) {
      const particle = new PIXI.Sprite(this.textures.particle)
      particle.anchor.set(0.5)
      particle.x = pixelX
      particle.y = pixelY
      particle.alpha = 1
      particle.scale.set(1 + Math.random())
      
      // 隨機方向
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 3
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.life = 1
      
      this.containers.effects.addChild(particle)
      this.particles.push(particle)
    }
  }
  
  // 創建區域發現效果（使用像素座標）
  createDiscoveryEffect(pixelX, pixelY) {
    // 創建光圈效果
    const circle = new PIXI.Graphics()
    circle.circle(0, 0, 5).stroke({ color: 0x22d3ee, width: 2 })
    circle.x = pixelX
    circle.y = pixelY
    circle.alpha = 1
    circle.scale.set(0.5)
    
    this.containers.effects.addChild(circle)
    
    // 擴散動畫
    const startTime = Date.now()
    const duration = 800
    
    const animateCircle = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        circle.scale.set(0.5 + progress * 2)
        circle.alpha = 1 - progress
        requestAnimationFrame(animateCircle)
      } else {
        this.containers.effects.removeChild(circle)
      }
    }
    
    animateCircle()
  }
  
  // 動畫循環
  animate(delta) {
    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= 0.02
      particle.alpha = particle.life
      particle.scale.set(particle.scale.x * 0.98)
      
      if (particle.life <= 0) {
        this.containers.effects.removeChild(particle)
        this.particles.splice(i, 1)
      }
    }
    
    // 角色呼吸效果和光暈動畫
    if (this.sprites.character) {
      const time = Date.now() * 0.002
      const breathe = 2 + Math.sin(time) * 0.1 // 基礎縮放為2
      this.sprites.character.scale.set(breathe)
      
      // 光暈脈動效果
      if (this.sprites.characterGlow) {
        const glowScale = 1 + Math.sin(time * 1.5) * 0.2
        this.sprites.characterGlow.scale.set(glowScale)
        this.sprites.characterGlow.alpha = 0.3 + Math.sin(time * 2) * 0.1
      }
    }
    
    // 入口閃爍效果已整合到 updateGame 中
  }
  
  // 獲取點擊位置的網格座標
  getGridPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    return {
      x: Math.floor(x / this.TILE_SIZE) + 1,
      y: Math.floor(y / this.TILE_SIZE) + 1
    }
  }
  
  // 更新 tile 尺寸和 canvas 大小（現在使用固定尺寸，這個方法保留但不會改變大小）
  updateTileSize(newTileSize) {
    if (!this.app || newTileSize === this.TILE_SIZE) return
    
    this.TILE_SIZE = newTileSize
    // 使用固定尺寸，不再動態調整
    // 重新定位所有精靈
    this.repositionSprites()
  }
  
  // 重新定位所有精靈
  repositionSprites() {
    // 向量圖形會自動調整，只需重新定位角色
    if (this.sprites.character && this.sprites.character.x !== undefined) {
      // 調整角色縮放以適應新的 tile 大小
      const scaleRatio = this.TILE_SIZE / 32 // 相對於基礎 32px
      this.sprites.character.scale.set(2 * scaleRatio)
      
      // 調整光暈大小
      if (this.sprites.characterGlow) {
        this.sprites.characterGlow.scale.set(scaleRatio)
      }
    }
  }
  
  // 清理資源
  destroy() {
    this.app.destroy(true)
  }
}
