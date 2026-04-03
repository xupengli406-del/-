/**
 * Capture 4 video generation status screenshots
 * Uses per-file aiSession messages (not global chatMessages)
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

  // Setup workspace and get video file ID
  const videoFileId = await page.evaluate(() => {
    const { account, canvas, workspace } = window.__stores
    account.setState({ isLoggedIn: true })
    const cs = canvas.getState()
    cs.canvasFiles.forEach(f => cs.removeCanvasFile(f.id))
    cs.customFolders.forEach(f => cs.removeCustomFolder(f.id))
    cs.clearCanvas()
    const vf = cs.saveCanvasAsFile('开场动画', 'video')
    cs.clearCanvas()
    const ws = workspace.getState()
    ws.openDocument({ type: 'videoGeneration', id: vf })
    ws.setActiveSidePanel(null)
    return vf
  })
  await delay(800)
  console.log('Video file ID:', videoFileId)

  // Helper to clear file messages and set new ones
  async function setFileMessages(messages) {
    await page.evaluate(({ fid, msgs }) => {
      const cs = window.__stores.canvas
      // Clear aiSession messages by directly updating state
      cs.setState(s => ({
        canvasFiles: s.canvasFiles.map(f =>
          f.id === fid ? { ...f, aiSession: { messages: [] } } : f
        )
      }))
      // Add messages one by one
      const store = cs.getState()
      for (const msg of msgs) {
        store.addCanvasFileChatMessage(fid, msg)
      }
    }, { fid: videoFileId, msgs: messages })
    await delay(600)
  }

  // ========== 1. 无参考视频 - 生成结果 ==========
  console.log('1: 无参考视频生成结果')
  await setFileMessages([
    {
      id: 'vid-nref-user',
      role: 'user',
      content: '一只猫咪跳跃的慢动作视频',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 60000,
    },
    {
      id: 'vid-nref-asst',
      role: 'assistant',
      content: '视频已生成',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 30000,
      resultUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      resultText: '已保存为本文件的当前版本（引用与缩略图均指向此版本）',
    },
  ])
  await page.screenshot({ path: `${DIR}/4-5-video-nref-result.png` })

  // ========== 2. 无参考视频 - 生成中 ==========
  console.log('2: 无参考视频生成中')
  await setFileMessages([
    {
      id: 'vid-nref-gen-user',
      role: 'user',
      content: '一只猫咪跳跃的慢动作视频',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 10000,
    },
    {
      id: 'vid-nref-gen-asst',
      role: 'assistant',
      content: '',
      mode: 'video',
      status: 'generating',
      createdAt: Date.now() - 5000,
    },
  ])
  await page.screenshot({ path: `${DIR}/4-5-video-nref-generating.png` })

  // ========== 3. 有参考视频 - 生成结果 ==========
  console.log('3: 有参考视频生成结果')
  await setFileMessages([
    {
      id: 'vid-ref-user',
      role: 'user',
      content: '让画面中的小猫跳起来',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 60000,
      referenceImageUrls: [
        'https://picsum.photos/seed/cat1/200/200',
        'https://picsum.photos/seed/cat2/200/200',
      ],
      referenceThumbLabels: ['首帧图', '尾帧图'],
    },
    {
      id: 'vid-ref-asst',
      role: 'assistant',
      content: '视频已生成',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 30000,
      resultUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      resultText: '已保存为本文件的当前版本（引用与缩略图均指向此版本）',
    },
  ])
  await delay(500) // extra time for remote images
  await page.screenshot({ path: `${DIR}/4-5-video-ref-result.png` })

  // ========== 4. 有参考视频 - 生成中 ==========
  console.log('4: 有参考视频生成中')
  await setFileMessages([
    {
      id: 'vid-ref-gen-user',
      role: 'user',
      content: '让画面中的小猫跳起来',
      mode: 'video',
      status: 'completed',
      createdAt: Date.now() - 10000,
      referenceImageUrls: [
        'https://picsum.photos/seed/cat1/200/200',
        'https://picsum.photos/seed/cat2/200/200',
      ],
      referenceThumbLabels: ['首帧图', '尾帧图'],
    },
    {
      id: 'vid-ref-gen-asst',
      role: 'assistant',
      content: '',
      mode: 'video',
      status: 'generating',
      createdAt: Date.now() - 5000,
    },
  ])
  await delay(500)
  await page.screenshot({ path: `${DIR}/4-5-video-ref-generating.png` })

  console.log('\nAll 4 video status screenshots captured!')
  await browser.close()
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
