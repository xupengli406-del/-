import puppeteer from 'puppeteer-core'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, 'screenshots')

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function clickByText(page, text, exact = false) {
  return page.evaluateHandle((t, ex) => {
    const btns = [...document.querySelectorAll('button')]
    const found = ex
      ? btns.find(b => b.textContent.trim() === t)
      : btns.find(b => b.textContent.includes(t))
    return found || document.body
  }, text, exact)
}

async function clickByTitle(page, title) {
  return page.evaluateHandle((t) => {
    return document.querySelector(`button[title="${t}"]`) || document.body
  }, title)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
  await sleep(1500)

  // ========== 1. 未登录状态 - 截取左侧导航栏 ==========
  // 截取整个页面（未登录状态）
  await page.screenshot({ path: path.join(outDir, 'not-logged-in.png') })
  console.log('Saved: not-logged-in.png')

  // ========== 2. 登录 ==========
  let btn = await clickByText(page, '登录')
  await btn.click()
  await sleep(500)

  btn = await clickByText(page, 'Google')
  await btn.click()
  await sleep(1000)

  // 已登录状态截图
  await page.screenshot({ path: path.join(outDir, 'logged-in.png') })
  console.log('Saved: logged-in.png')

  // ========== 3. 存储空间管理弹窗 ==========
  // 先需要创建一些文件才能打开生成页面
  // 点击头像打开菜单
  btn = await page.evaluateHandle(() => {
    // 头像按钮：圆形24x24，包含单个汉字
    const btns = [...document.querySelectorAll('button')]
    return btns.find(b => {
      const text = b.textContent.trim()
      return text.length === 1 && /[\u4e00-\u9fff]/.test(text) && b.querySelector('.rounded-full, .flex')
    }) || document.body
  })
  await btn.click()
  await sleep(500)

  // 截取用户菜单（对功能点1.2已有截图，但可以用来验证）
  await page.screenshot({ path: path.join(outDir, 'user-menu-with-storage.png') })
  console.log('Saved: user-menu-with-storage.png')

  // 点击"存储空间"
  btn = await clickByText(page, '存储空间')
  await btn.click()
  await sleep(500)
  await page.screenshot({ path: path.join(outDir, 'storage-modal.png') })
  console.log('Saved: storage-modal.png')

  // 关闭存储弹窗 - 点击X按钮
  btn = await page.evaluateHandle(() => {
    // 最顶层弹窗的关闭按钮
    const modals = [...document.querySelectorAll('.fixed.inset-0')]
    const topModal = modals[modals.length - 1]
    if (topModal) {
      const btns = [...topModal.querySelectorAll('button')]
      return btns.find(b => b.querySelector('svg') && !b.textContent.trim()) || document.body
    }
    return document.body
  })
  await btn.click()
  await sleep(500)

  // ========== 4. AI水印管理弹窗 ==========
  // 重新打开用户菜单
  btn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')]
    return btns.find(b => {
      const text = b.textContent.trim()
      return text.length === 1 && /[\u4e00-\u9fff]/.test(text) && b.closest('[class*="flex-col"]')
    }) || document.body
  })
  await btn.click()
  await sleep(500)

  // 点击"去 AI 水印"
  btn = await page.evaluateHandle(() => {
    const items = [...document.querySelectorAll('button, div[role="button"], [class*="cursor-pointer"]')]
    return items.find(el => el.textContent.includes('AI 水印') || el.textContent.includes('AI水印')) || document.body
  })
  await btn.click()
  await sleep(500)
  await page.screenshot({ path: path.join(outDir, 'watermark-modal.png') })
  console.log('Saved: watermark-modal.png')

  // 关闭水印弹窗
  btn = await page.evaluateHandle(() => {
    const modals = [...document.querySelectorAll('.fixed.inset-0')]
    const topModal = modals[modals.length - 1]
    if (topModal) {
      const btns = [...topModal.querySelectorAll('button')]
      return btns.find(b => b.querySelector('svg') && !b.textContent.trim()) || document.body
    }
    return document.body
  })
  await btn.click()
  await sleep(500)

  // ========== 5. 图片生成 - 高级参数 (功能点3.4b) ==========
  // 点击"分镜图片生成"卡片
  btn = await clickByText(page, '分镜图片生成')
  await btn.click()
  await sleep(1000)

  // 截取图片生成面板（包含工具栏参数）
  await page.screenshot({ path: path.join(outDir, 'image-gen-toolbar.png') })
  console.log('Saved: image-gen-toolbar.png')

  // ========== 6. 视频生成 - 参数面板 (功能点4.4) ==========
  // 回到欢迎页，创建视频文件
  // 点击侧面板的+按钮新建视频
  btn = await page.evaluateHandle(() => {
    // 找到侧面板标题栏的+按钮
    const btns = [...document.querySelectorAll('button')]
    return btns.find(b => {
      const svg = b.querySelector('svg')
      return svg && b.closest('[class*="side"]') && b.getAttribute('title')?.includes('新建')
    }) || btns.find(b => b.textContent.includes('+') || b.querySelector('[class*="Plus"]')) || document.body
  })
  await btn.click()
  await sleep(300)

  // 点击"新建视频"
  btn = await clickByText(page, '新建视频')
  await btn.click()
  await sleep(1000)

  await page.screenshot({ path: path.join(outDir, 'video-gen-params.png') })
  console.log('Saved: video-gen-params.png')

  // ========== 7. 文件树右键 - 创建副本 (功能点5.8) ==========
  // 右键点击文件树中的文件
  const fileItem = await page.evaluateHandle(() => {
    // 找到文件树中的文件项
    const items = [...document.querySelectorAll('[class*="file"], [class*="tree"] [class*="item"]')]
    return items.find(el => el.textContent.includes('image_') || el.textContent.includes('video_')) || document.body
  })
  const box = await fileItem.boundingBox()
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' })
    await sleep(500)
    await page.screenshot({ path: path.join(outDir, 'file-context-menu-copy.png') })
    console.log('Saved: file-context-menu-copy.png')

    // 关闭右键菜单
    await page.mouse.click(10, 10)
    await sleep(300)
  }

  // ========== 8. 文档打开模式 (功能点2.6) ==========
  // 截取标签页区域（已经有标签页打开）
  await page.screenshot({ path: path.join(outDir, 'tab-modes.png') })
  console.log('Saved: tab-modes.png')

  // ========== 9. 订阅计划 - 价格表 (功能点6.4) ==========
  btn = await clickByTitle(page, '账户余额')
  await btn.click()
  await sleep(600)

  // 滚动到价格表位置并截图
  await page.screenshot({ path: path.join(outDir, 'plan-pricing-table.png') })
  console.log('Saved: plan-pricing-table.png')

  // ========== 10. 套餐切换 (功能点6.3) ==========
  // 当前在订阅计划弹窗中，截取订阅按钮可见的状态
  // (plan-modal截图已有，这里补一个重点展示按钮状态的)
  await page.screenshot({ path: path.join(outDir, 'plan-switch.png') })
  console.log('Saved: plan-switch.png')

  await browser.close()
  console.log('All done!')
}

main().catch(e => { console.error(e); process.exit(1) })
