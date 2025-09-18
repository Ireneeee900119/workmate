// 像素風格資源生成器
import * as PIXI from 'pixi.js'

// 創建像素風格的紋理
export function createPixelTexture(width, height, color) {
  const graphics = new PIXI.Graphics()
  graphics.beginFill(color)
  graphics.drawRect(0, 0, width, height)
  graphics.endFill()
  return PIXI.RenderTexture.create({
    width,
    height,
    resolution: 1
  })
}

// 創建角色精靈圖
export function createCharacterTextures(renderer) {
  const textures = {}
  
  // 角色基本形狀 (16x16 像素)
  const characterGraphics = new PIXI.Graphics()
  
  // 身體 (深藍色)
  characterGraphics.rect(4, 4, 8, 8).fill(0x0f172a)
  
  // 內部 (青色)
  characterGraphics.rect(5, 5, 6, 6).fill(0x22d3ee)
  
  // 眼睛
  characterGraphics.rect(6, 6, 1, 1).fill(0xffffff)
  characterGraphics.rect(9, 6, 1, 1).fill(0xffffff)
  
  textures.idle = PIXI.RenderTexture.create({
    width: 16,
    height: 16,
    resolution: 1
  })
  
  renderer.render({
    container: characterGraphics,
    target: textures.idle
  })
  
  return textures
}

// 創建地板紋理
export function createFloorTextures(renderer) {
  const textures = {}
  
  // 普通地板
  const floorGraphics1 = new PIXI.Graphics()
  floorGraphics1.rect(0, 0, 32, 32).fill(0xd1fae5)
  // 陰影效果
  floorGraphics1.rect(0, 30, 32, 2).fill(0x00000020)
  floorGraphics1.rect(30, 0, 2, 32).fill(0x00000020)
  
  textures.floor1 = PIXI.RenderTexture.create({ width: 32, height: 32 })
  
  // 替代地板
  const floorGraphics2 = new PIXI.Graphics()
  floorGraphics2.rect(0, 0, 32, 32).fill(0xbbf7d0)
  floorGraphics2.rect(0, 30, 32, 2).fill(0x00000020)
  floorGraphics2.rect(30, 0, 2, 32).fill(0x00000020)
  
  textures.floor2 = PIXI.RenderTexture.create({ width: 32, height: 32 })
  
  // 未探索地板
  const unknownGraphics1 = new PIXI.Graphics()
  unknownGraphics1.rect(0, 0, 32, 32).fill(0xe5e7eb)
  unknownGraphics1.rect(0, 30, 32, 2).fill(0x00000015)
  unknownGraphics1.rect(30, 0, 2, 32).fill(0x00000015)
  
  textures.unknown1 = PIXI.RenderTexture.create({ width: 32, height: 32 })
  
  const unknownGraphics2 = new PIXI.Graphics()
  unknownGraphics2.rect(0, 0, 32, 32).fill(0xe2e8f0)
  unknownGraphics2.rect(0, 30, 32, 2).fill(0x00000015)
  unknownGraphics2.rect(30, 0, 2, 32).fill(0x00000015)
  
  textures.unknown2 = PIXI.RenderTexture.create({ width: 32, height: 32 })
  
  // 牆壁
  const wallGraphics = new PIXI.Graphics()
  wallGraphics.rect(0, 0, 32, 32).fill(0x94a3b8)
  // 牆壁紋理
  wallGraphics.rect(2, 2, 28, 28).fill(0x64748b)
  wallGraphics.rect(4, 4, 24, 24).fill(0x475569)
  
  textures.wall = PIXI.RenderTexture.create({ width: 32, height: 32 })
  
  // 渲染所有紋理
  renderer.render({ container: floorGraphics1, target: textures.floor1 })
  renderer.render({ container: floorGraphics2, target: textures.floor2 })
  renderer.render({ container: unknownGraphics1, target: textures.unknown1 })
  renderer.render({ container: unknownGraphics2, target: textures.unknown2 })
  renderer.render({ container: wallGraphics, target: textures.wall })
  
  return textures
}

// 創建設施 (POI) 紋理
export function createPOITextures(renderer) {
  const textures = {}
  
  // 基本設施點
  const poiGraphics = new PIXI.Graphics()
  poiGraphics.rect(13, 13, 6, 6).fill(0x111827)
  // 內部發光
  poiGraphics.rect(14, 14, 4, 4).fill(0x3b82f6)
  poiGraphics.rect(15, 15, 2, 2).fill(0x60a5fa)
  
  textures.poi = PIXI.RenderTexture.create({ width: 32, height: 32 })
  
  renderer.render({ container: poiGraphics, target: textures.poi })
  
  return textures
}

// 創建粒子效果紋理
export function createParticleTextures(renderer) {
  const textures = {}
  
  // 探索效果粒子
  const particleGraphics = new PIXI.Graphics()
  particleGraphics.circle(2, 2, 2).fill(0x22d3ee)
  
  textures.particle = PIXI.RenderTexture.create({ width: 4, height: 4 })
  
  renderer.render({ container: particleGraphics, target: textures.particle })
  
  return textures
}
