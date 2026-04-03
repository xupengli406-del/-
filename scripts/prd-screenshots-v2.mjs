/**
 * PRD 补充截图脚本 v2
 * 截取所有缺少截图的功能点
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.resolve(__dirname, '../screenshots')
const BASE = 'http://localhost:5174'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()

  await page.goto(BASE)
  await page.waitForSelector('button[title="登录"], button[title="用户信息"]', { timeout: 15000 })
  await delay(800)

  // Wait for __stores
  await page.waitForFunction(() => !!window.__stores, { timeout: 10000 })
  console.log('App loaded with stores exposed')

  // Helper: setup logged-in state with files
  async function setupWorkspace() {
    await page.evaluate(() => {
      const { account, canvas, workspace } = window.__stores
      account.setState({ isLoggedIn: true })
      const cs = canvas.getState()
      // Clear and create test files
      cs.canvasFiles.forEach(f => cs.removeCanvasFile(f.id))
      cs.customFolders.forEach(f => cs.removeCustomFolder(f.id))

      cs.clearCanvas()
      const f1 = cs.saveCanvasAsFile('角色设定-主角', 'image')
      cs.clearCanvas()
      const f2 = cs.saveCanvasAsFile('分镜图片-示例', 'image')
      cs.clearCanvas()
      const f3 = cs.saveCanvasAsFile('新分镜图片', 'image')
      cs.clearCanvas()
      const f4 = cs.saveCanvasAsFile('场景1-城市街道', 'image')
      cs.clearCanvas()
      const f5 = cs.saveCanvasAsFile('开场动画', 'video')
      cs.clearCanvas()
      const f6 = cs.saveCanvasAsFile('分镜稿-第1话', 'image')

      cs.addCustomFolder('第一章')
      cs.addCustomFolder('素材参考')
      const folders = cs.customFolders
      if (folders.length >= 2) {
        cs.moveFileToFolder(f1, folders[0].id)
        cs.moveFileToFolder(f6, folders[0].id)
        cs.moveFileToFolder(f4, folders[1].id)
      }

      const ws = workspace.getState()
      ws.openDocument({ type: 'imageGeneration', id: f2 })
    })
    await delay(600)
  }

  await setupWorkspace()

  // ========== 2.2 左侧导航栏 ==========
  console.log('2.2: Left navigation bar')
  await page.screenshot({
    path: `${DIR}/2-2-left-nav.png`,
    clip: { x: 0, y: 0, width: 56 * 2, height: 900 },
  })

  // ========== 2.3 侧面板折叠/展开 ==========
  console.log('2.3: Side panel collapse/expand')
  // Expanded state
  await page.screenshot({
    path: `${DIR}/2-3-panel-expanded.png`,
    clip: { x: 0, y: 0, width: 340, height: 900 },
  })
  // Collapse side panel
  await page.evaluate(() => {
    const ws = window.__stores.workspace.getState()
    ws.setActiveSidePanel(null)
  })
  await delay(300)
  await page.screenshot({
    path: `${DIR}/2-3-panel-collapsed.png`,
    clip: { x: 0, y: 0, width: 120, height: 900 },
  })
  // Re-expand
  await page.evaluate(() => {
    const ws = window.__stores.workspace.getState()
    ws.setActiveSidePanel('files')
  })
  await delay(300)

  // ========== 3.5 参考图上传与引用 ==========
  console.log('3.5: Reference image upload')
  // Create an image file and open it in non-dedicated mode (welcome tab)
  await page.evaluate(() => {
    const ws = window.__stores.workspace.getState()
    ws.openDocument({ type: 'imageGeneration', id: 'new-temp' })
  })
  await delay(400)
  // Upload a test image via file input
  const fileInput = page.locator('input[type="file"][accept="image/*"]').first()
  if (await fileInput.count() > 0) {
    // Create a small test image on the fly
    await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#e8e0f0'
      ctx.fillRect(0, 0, 200, 200)
      ctx.fillStyle = '#6b46c1'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('参考图', 100, 110)
      canvas.toBlob(blob => {
        const dt = new DataTransfer()
        dt.items.add(new File([blob], 'reference.png', { type: 'image/png' }))
        const input = document.querySelector('input[type="file"][accept="image/*"]')
        if (input) {
          Object.defineProperty(input, 'files', { value: dt.files })
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
    })
    await delay(600)
  }
  // Take screenshot of input area with attachment
  await page.screenshot({ path: `${DIR}/3-5-reference-upload.png` })

  // ========== 3.7 生成结果展示 ==========
  console.log('3.7: Generation result display')
  // Simulate adding a chat message with a result
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    // Add a mock chat message with image result
    cs.addChatMessage({
      id: 'mock-user-1',
      role: 'user',
      content: '一只可爱的小猫咪在花园里玩耍',
      mode: 'image',
      status: 'completed',
      createdAt: Date.now() - 30000,
    })
    cs.addChatMessage({
      id: 'mock-asst-1',
      role: 'assistant',
      content: '图片已生成',
      mode: 'image',
      status: 'completed',
      createdAt: Date.now() - 25000,
      resultUrl: 'https://picsum.photos/400/400',
    })
  })
  await delay(800)
  await page.screenshot({ path: `${DIR}/3-7-generation-result.png` })

  // ========== 3.6 版本管理 ==========
  console.log('3.6: Version management')
  // Open a file in dedicated mode and add some version history
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    const files = cs.canvasFiles.filter(f => f.projectType === 'image')
    if (files.length > 0) {
      const fileId = files[0].id
      // Add mock versions
      cs.appendCanvasFileMediaVersion(fileId, {
        url: 'https://picsum.photos/seed/v1/400/400',
        prompt: '角色设定 - 版本1',
        model: 'Seedream_4.0',
      })
      cs.appendCanvasFileMediaVersion(fileId, {
        url: 'https://picsum.photos/seed/v2/400/400',
        prompt: '角色设定 - 版本2 优化表情',
        model: 'Seedream_4.0',
      })
      cs.appendCanvasFileMediaVersion(fileId, {
        url: 'https://picsum.photos/seed/v3/400/400',
        prompt: '角色设定 - 版本3 最终版',
        model: 'Seedream_4.0',
      })
      const ws = window.__stores.workspace.getState()
      ws.openDocument({ type: 'imageGeneration', id: fileId })
    }
  })
  await delay(1000)
  await page.screenshot({ path: `${DIR}/3-6-version-management.png` })

  // ========== 4.2 时长选择 (reuse existing 4-3 or take new) ==========
  console.log('4.2: Duration selector')
  // Switch to video mode
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    const vFiles = cs.canvasFiles.filter(f => f.projectType === 'video')
    if (vFiles.length > 0) {
      const ws = window.__stores.workspace.getState()
      ws.openDocument({ type: 'videoGeneration', id: vFiles[0].id })
    }
  })
  await delay(500)
  // Click duration button
  const durBtn = page.locator('button:has-text("5s"), button:has-text("10s")').first()
  if (await durBtn.count() > 0) {
    await durBtn.click()
    await delay(400)
    await page.screenshot({ path: `${DIR}/4-2-duration-selector.png` })
    // Close popup
    await page.click('body', { position: { x: 700, y: 300 }, force: true })
    await delay(200)
  }

  // ========== 4.5 视频生成状态 ==========
  console.log('4.5: Video generation status')
  // Simulate a video generation in progress
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    cs.addChatMessage({
      id: 'mock-vid-user-1',
      role: 'user',
      content: '一只猫咪跳跃的慢动作视频',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 60000,
    })
    cs.addChatMessage({
      id: 'mock-vid-asst-1',
      role: 'assistant',
      content: '视频生成中，预计需要 1-5 分钟...',
      mode: 'video',
      status: 'generating',
      createdAt: Date.now() - 55000,
    })
  })
  await delay(600)
  await page.screenshot({ path: `${DIR}/4-5-video-gen-status.png` })

  // ========== Module 5 screenshots ==========

  // Go back to file tree focus
  await page.evaluate(() => {
    const ws = window.__stores.workspace.getState()
    ws.setActiveSidePanel('files')
  })
  await delay(300)

  // 5.2 重命名
  console.log('5.2: Rename')
  // Double-click a file name to trigger inline edit
  const fileItems = page.locator('[class*="cursor-pointer"] span[class*="truncate"]')
  const fileItemCount = await fileItems.count()
  if (fileItemCount > 0) {
    await fileItems.first().dblclick()
    await delay(400)
    await page.screenshot({ path: `${DIR}/5-2-rename.png`, clip: { x: 0, y: 0, width: 350, height: 900 } })
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    console.log('  File items not found for rename')
    await page.screenshot({ path: `${DIR}/5-2-rename.png` })
  }

  // 5.3 删除 (use right-click menu showing delete option)
  console.log('5.3: Delete')
  // Right-click on a file to show context menu with delete
  const fileForDelete = page.locator('[draggable="true"]').first()
  if (await fileForDelete.count() > 0) {
    await fileForDelete.click({ button: 'right' })
    await delay(400)
    await page.screenshot({ path: `${DIR}/5-3-delete.png`, clip: { x: 0, y: 0, width: 400, height: 900 } })
    await page.keyboard.press('Escape')
    await delay(200)
  }

  // 5.4 多选
  console.log('5.4: Multi-select')
  const selectableFiles = page.locator('[draggable="true"]')
  const selectCount = await selectableFiles.count()
  if (selectCount >= 3) {
    await selectableFiles.nth(0).click()
    await delay(100)
    await selectableFiles.nth(1).click({ modifiers: ['Control'] })
    await delay(100)
    await selectableFiles.nth(2).click({ modifiers: ['Control'] })
    await delay(300)
    await page.screenshot({ path: `${DIR}/5-4-multi-select.png`, clip: { x: 0, y: 0, width: 350, height: 900 } })
    // Clear selection
    await page.click('body', { position: { x: 150, y: 850 } })
    await delay(200)
  }

  // 5.5 拖拽移动 (hard to automate perfectly, simulate the hover state)
  console.log('5.5: Drag move')
  // We'll just take a shot of the file tree since actual drag is hard to capture mid-flight
  await page.screenshot({ path: `${DIR}/5-5-drag-move.png`, clip: { x: 0, y: 0, width: 350, height: 900 } })

  // 5.7 移动到文件夹弹窗
  console.log('5.7: Move to folder modal')
  const fileForMove = page.locator('[draggable="true"]').first()
  if (await fileForMove.count() > 0) {
    await fileForMove.click({ button: 'right' })
    await delay(400)
    // Click "将文件移动到..." menu item
    const moveItem = page.locator('text=将文件移动到')
    if (await moveItem.count() > 0) {
      await moveItem.click()
      await delay(500)
      await page.screenshot({ path: `${DIR}/5-7-move-to-folder.png` })
      await page.keyboard.press('Escape')
      await delay(200)
    } else {
      console.log('  Move menu item not found')
      await page.keyboard.press('Escape')
      await delay(200)
    }
  }

  // 5.9 空状态
  console.log('5.9: Empty state')
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    // Delete all files and folders
    cs.canvasFiles.forEach(f => cs.removeCanvasFile(f.id))
    cs.customFolders.forEach(f => cs.removeCustomFolder(f.id))
  })
  await delay(500)
  await page.screenshot({ path: `${DIR}/5-9-empty-state.png`, clip: { x: 0, y: 0, width: 350, height: 900 } })

  // ========== 6.1 余额展示 ==========
  console.log('6.1: Balance display')
  // Already have 6-1-balance-modal.png from v1 script, skip if exists
  // But let's take it anyway for completeness
  await page.evaluate(() => {
    window.__stores.account.setState({ isLoggedIn: true })
  })
  await delay(300)
  const balanceBtn = page.locator('button[title="账户余额"]')
  if (await balanceBtn.count() > 0) {
    await balanceBtn.click()
    await delay(600)
    await page.screenshot({ path: `${DIR}/6-1-balance-display.png` })
    // Close modal
    await page.keyboard.press('Escape')
    await delay(300)
  }

  console.log('\nAll v2 screenshots captured!')
  await browser.close()
}

main().catch(err => {
  console.error('Screenshot script failed:', err)
  process.exit(1)
})
