/**
 * Focused script: capture 5-7 move-to-folder modal
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
  await page.waitForFunction(() => !!window.__stores, { timeout: 10000 })
  console.log('App loaded')

  // Setup: create folders + files
  await page.evaluate(() => {
    const { account, canvas, workspace } = window.__stores
    account.setState({ isLoggedIn: true })
    const cs = canvas.getState()
    cs.canvasFiles.forEach(f => cs.removeCanvasFile(f.id))
    cs.customFolders.forEach(f => cs.removeCustomFolder(f.id))
    cs.clearCanvas()

    cs.addCustomFolder('第一章')
    cs.addCustomFolder('素材参考')
    cs.clearCanvas()
    cs.saveCanvasAsFile('角色设定-主角', 'image')
    cs.clearCanvas()
    cs.saveCanvasAsFile('分镜图片-示例', 'image')
    cs.clearCanvas()
    cs.saveCanvasAsFile('场景1-城市街道', 'image')

    const ws = workspace.getState()
    ws.setActiveSidePanel('files')
  })
  await delay(800)

  // Find a file item by looking for items containing known file names
  // Use getByText to find elements within draggable items
  const fileEl = page.locator('[draggable="true"]', { hasText: '角色设定-主角' })
  const fileCount = await fileEl.count()
  console.log(`Found ${fileCount} items matching '角色设定-主角'`)

  if (fileCount > 0) {
    // Right click
    await fileEl.first().click({ button: 'right' })
    await delay(600)

    // Now look for menu buttons
    const allButtons = page.locator('button')
    const btnCount = await allButtons.count()
    console.log(`Total buttons on page: ${btnCount}`)

    // Look for the "将文件移动到..." text on the page
    const moveBtn = page.locator('button', { hasText: '将文件移动到' })
    const moveBtnCount = await moveBtn.count()
    console.log(`Move buttons found: ${moveBtnCount}`)

    if (moveBtnCount > 0) {
      await moveBtn.first().click()
      await delay(700)
      await page.screenshot({ path: `${DIR}/5-7-move-to-folder.png` })
      console.log('5-7 screenshot captured successfully!')
    } else {
      // Debug: print all visible button texts in the context menu area
      const fixedDivs = page.locator('div.fixed.z-\\[100\\]')
      const fixedCount = await fixedDivs.count()
      console.log(`Fixed z-100 divs: ${fixedCount}`)
      for (let i = 0; i < fixedCount; i++) {
        const text = await fixedDivs.nth(i).textContent()
        console.log(`  fixed[${i}]: "${text}"`)
      }

      // Try broader search
      const anyMoveText = page.getByText('将文件移动到')
      console.log(`getByText count: ${await anyMoveText.count()}`)

      await page.screenshot({ path: `${DIR}/5-7-move-to-folder.png` })
      console.log('Fallback screenshot captured')
    }
  } else {
    console.log('ERROR: File element not found')
  }

  await browser.close()
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
