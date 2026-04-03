/**
 * PRD 页面截图自动化脚本
 * 使用 Playwright 截取各模块的关键页面状态
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots')
const BASE_URL = 'http://localhost:5174'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina for crisp screenshots
  })
  const page = await context.newPage()

  // Navigate and wait for app ready
  await page.goto(BASE_URL)
  await page.waitForSelector('button[title="登录"], button[title="用户信息"]', { timeout: 15000 })
  await delay(500)

  console.log('App loaded, starting screenshots...')

  // ========== Module 1: Account System ==========

  // 1-1: Login modal - login view
  console.log('1-1: Login modal - login view')
  await page.click('button[title="登录"]')
  await delay(600)
  const loginModal = page.locator('.fixed.inset-0').first()
  await loginModal.screenshot({ path: `${SCREENSHOTS_DIR}/1-1-login-modal.png` })

  // 1-2: Login modal - register view
  console.log('1-2: Login modal - register view')
  await page.click('text=去注册')
  await delay(400)
  await loginModal.screenshot({ path: `${SCREENSHOTS_DIR}/1-2-register-view.png` })

  // Close login modal
  await page.click('button[title="关闭"]')
  await delay(300)

  // 1-3: User menu (logged in)
  console.log('1-3: User menu')
  await page.evaluate(() => {
    window.__stores.account.setState({ isLoggedIn: true })
  })
  await delay(400)
  await page.click('button[title="用户信息"]')
  await delay(400)
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/1-3-user-menu.png`, clip: { x: 0, y: 0, width: 350, height: 900 } })
  // Close menu by clicking elsewhere
  await page.click('body', { position: { x: 700, y: 450 } })
  await delay(200)

  // ========== Module 2: Workspace Framework ==========

  // 2-1: Full layout - default state
  console.log('2-1: Full layout')
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/2-1-full-layout.png` })

  // 2-2: Welcome page (just the main content area)
  console.log('2-2: Welcome page')
  // The welcome content is in the main panel area
  const mainPanel = page.locator('#main, .flex-1.flex.flex-col.overflow-hidden').first()
  await mainPanel.screenshot({ path: `${SCREENSHOTS_DIR}/2-2-welcome-page.png` })

  // Create some files for subsequent screenshots
  console.log('Creating test files...')
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    cs.clearCanvas()
    const id1 = cs.saveCanvasAsFile('角色设定-主角', 'image')
    cs.clearCanvas()
    const id2 = cs.saveCanvasAsFile('场景1-城市街道', 'image')
    cs.clearCanvas()
    const id3 = cs.saveCanvasAsFile('开场动画', 'video')
    cs.addCustomFolder('第一章')
    cs.addCustomFolder('素材参考')
    // Move a file into folder
    const folders = cs.customFolders
    if (folders.length > 0) {
      cs.moveFileToFolder(id1, folders[0].id)
    }
    // Open a file
    const ws = window.__stores.workspace.getState()
    ws.openDocument({ type: 'imageGeneration', id: id1 })
    ws.openDocument({ type: 'imageGeneration', id: id2 })
    ws.openDocument({ type: 'videoGeneration', id: id3 })
  })
  await delay(600)

  // 2-3: Multiple tabs + right-click menu
  console.log('2-3: Tabs + context menu')
  // Right-click on one of the tabs
  const tabs = page.locator('[class*="items-end"] button[class*="rounded"]')
  const tabCount = await tabs.count()
  if (tabCount > 1) {
    await tabs.nth(1).click({ button: 'right' })
    await delay(400)
  }
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/2-3-tabs-context-menu.png` })
  // Dismiss context menu
  await page.keyboard.press('Escape')
  await delay(200)

  // 2-4: Split pane
  console.log('2-4: Split pane')
  await page.evaluate(() => {
    const ws = window.__stores.workspace.getState()
    ws.splitPane(ws.activePaneId, 'horizontal')
  })
  await delay(500)
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/2-4-split-pane.png` })

  // Undo split for clean state (reload page)
  await page.goto(BASE_URL)
  await page.waitForSelector('button[title="登录"], button[title="用户信息"]', { timeout: 15000 })
  await delay(500)
  // Re-expose stores by setting login state
  await page.evaluate(() => {
    window.__stores.account.setState({ isLoggedIn: true })
  })
  await delay(300)

  // ========== Module 3: AI Image Generation ==========

  // Create image file and open it
  console.log('3-1: Image generation pane')
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    cs.clearCanvas()
    const fileId = cs.saveCanvasAsFile('分镜图片-示例', 'image')
    cs.setEditingProjectId(fileId)
    const ws = window.__stores.workspace.getState()
    ws.openDocument({ type: 'imageGeneration', id: fileId })
  })
  await delay(600)
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/3-1-image-pane.png` })

  // 3-2: Model selector popup
  console.log('3-2: Model selector')
  // The model button has a gradient badge - find it by the toolbar area
  const modelBtn = page.locator('button:has(div[class*="from-cyan-400"])').first()
  if (await modelBtn.count() > 0) {
    await modelBtn.click()
    await delay(400)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/3-2-model-selector.png` })
    // Close popup
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    console.log('  Model button not found, taking full screenshot')
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/3-2-model-selector.png` })
  }

  // 3-3: Ratio/resolution popup
  console.log('3-3: Ratio selector')
  // Find the ratio button (contains MonitorPlay icon or ratio text like "auto")
  const ratioBtn = page.locator('button:has(svg.lucide-monitor-play), button:has-text("auto")').first()
  if (await ratioBtn.count() > 0) {
    await ratioBtn.click()
    await delay(400)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/3-3-ratio-selector.png` })
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    // Try clicking in the toolbar area directly
    const toolbarBtns = page.locator('[class*="flex items-center gap"] button[class*="rounded-full"]')
    const count = await toolbarBtns.count()
    if (count >= 2) {
      await toolbarBtns.nth(1).click()
      await delay(400)
    }
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/3-3-ratio-selector.png` })
  }

  // ========== Module 4: AI Video Generation ==========

  // Create video file and open it
  console.log('4-1: Video generation pane')
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    cs.clearCanvas()
    const fileId = cs.saveCanvasAsFile('开场动画-示例', 'video')
    cs.setEditingProjectId(fileId)
    const ws = window.__stores.workspace.getState()
    ws.openDocument({ type: 'videoGeneration', id: fileId })
  })
  await delay(600)
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/4-1-video-pane.png` })

  // 4-2: Reference mode selector
  console.log('4-2: Reference mode selector')
  // Video toolbar has a reference mode button with Film icon
  const refModeBtn = page.locator('button:has(svg.lucide-film)').first()
  if (await refModeBtn.count() > 0) {
    await refModeBtn.click()
    await delay(400)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/4-2-reference-mode.png` })
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    console.log('  Reference mode button not found, taking full screenshot')
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/4-2-reference-mode.png` })
  }

  // 4-3: Duration selector
  console.log('4-3: Duration + ratio selector')
  const durationBtn = page.locator('button:has-text("5s"), button:has-text("10s")').first()
  if (await durationBtn.count() > 0) {
    await durationBtn.click()
    await delay(400)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/4-3-duration-selector.png` })
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    console.log('  Duration button not found, taking full screenshot')
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/4-3-duration-selector.png` })
  }

  // ========== Module 5: File Management ==========

  // Ensure we have files and folders
  console.log('5-1: File tree with content')
  await page.evaluate(() => {
    const cs = window.__stores.canvas.getState()
    // Make sure we have enough content
    if (cs.canvasFiles.length < 3) {
      cs.clearCanvas()
      cs.saveCanvasAsFile('角色设定-主角', 'image')
      cs.clearCanvas()
      cs.saveCanvasAsFile('场景1-城市街道', 'image')
      cs.clearCanvas()
      cs.saveCanvasAsFile('开场动画', 'video')
    }
    if (cs.customFolders.length === 0) {
      cs.addCustomFolder('第一章')
      cs.addCustomFolder('素材参考')
    }
    // Ensure sidebar is open
    const ws = window.__stores.workspace.getState()
    ws.setActiveSidePanel('files')
    // Expand folders
    const folders = cs.customFolders
    folders.forEach(f => {
      ws.toggleFolder(f.id)
      // toggle twice if already open to ensure open
    })
  })
  await delay(500)
  // Take screenshot of sidebar area
  const sidebar = page.locator('[id="sidebar"], .side-panel').first()
  if (await sidebar.count() > 0) {
    await sidebar.screenshot({ path: `${SCREENSHOTS_DIR}/5-1-file-tree.png` })
  } else {
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/5-1-file-tree.png`, clip: { x: 56, y: 0, width: 280, height: 900 } })
  }

  // 5-2: File context menu
  console.log('5-2: File context menu')
  const fileRow = page.locator('.filetree-file-row').first()
  if (await fileRow.count() > 0) {
    await fileRow.click({ button: 'right' })
    await delay(400)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/5-2-file-context-menu.png`, clip: { x: 0, y: 0, width: 500, height: 900 } })
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    console.log('  File row not found, taking full screenshot')
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/5-2-file-context-menu.png` })
  }

  // 5-3: New file menu (+ button)
  console.log('5-3: New file menu')
  // The + button is in the side panel header area, look for Plus icon button
  const plusBtn = page.locator('.side-panel button:has(svg.lucide-plus), .side-panel-header button:has(svg.lucide-plus)').first()
  if (await plusBtn.count() > 0) {
    await plusBtn.click()
    await delay(400)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/5-3-new-file-menu.png`, clip: { x: 0, y: 0, width: 500, height: 400 } })
    await page.keyboard.press('Escape')
    await delay(200)
  } else {
    console.log('  Plus button not found, taking full screenshot')
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/5-3-new-file-menu.png` })
  }

  // ========== Module 6: Billing System ==========

  // 6-1: Balance modal - subscription plan
  console.log('6-1: Balance modal')
  await page.evaluate(() => {
    window.__stores.account.setState({ isLoggedIn: true, currentPlan: 'subscription' })
  })
  await delay(300)
  await page.click('button[title="账户余额"]')
  await delay(600)
  const balanceModal = page.locator('.fixed.inset-0').first()
  await balanceModal.screenshot({ path: `${SCREENSHOTS_DIR}/6-1-balance-modal.png` })

  // 6-2: Balance modal - enterprise plan selected
  console.log('6-2: Enterprise plan')
  // Click the enterprise plan card
  const enterpriseCard = page.locator('text=团队协作').first()
  if (await enterpriseCard.count() > 0) {
    // Click the parent card element
    const card = enterpriseCard.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first()
    if (await card.count() > 0) {
      await card.click()
    } else {
      await enterpriseCard.click()
    }
    await delay(400)
  }
  await balanceModal.screenshot({ path: `${SCREENSHOTS_DIR}/6-2-enterprise-plan.png` })

  // Done
  console.log('\nAll screenshots captured!')
  await browser.close()
}

main().catch(err => {
  console.error('Screenshot script failed:', err)
  process.exit(1)
})
