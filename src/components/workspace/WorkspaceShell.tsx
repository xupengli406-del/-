import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Panel, Group, Separator } from 'react-resizable-panels'
import {
  Check,
  Droplets,
  FolderOpen,
  HardDrive,
  Menu,
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAccountStore } from '../../store/accountStore'
import SidePanel from './SidePanel'
import PaneContainer from './PaneContainer'
import { LoginModal, PlanModal } from './AccountModals'
import WatermarkSettingsModal from './WatermarkSettingsModal'
import StorageModal from './StorageModal'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`
}

const actionButtonBase = 'w-8 min-h-[40px] rounded-[8px] flex flex-col items-center justify-center transition-colors duration-150'

export default function WorkspaceShell() {
  const { paneLayout, activeSidePanel, setActiveSidePanel, toggleSidePanel } = useWorkspaceStore()
  const { isLoggedIn, balanceInfo, profile, logout, globalWatermarkDisabled, storageQuota } = useAccountStore()
  const [loginOpen, setLoginOpen] = useState(false)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [watermarkModalOpen, setWatermarkModalOpen] = useState(false)
  const [storageModalOpen, setStorageModalOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)
  const accountButtonRef = useRef<HTMLButtonElement | null>(null)
  const balanceButtonRef = useRef<HTMLButtonElement | null>(null)

  // 账户菜单定位
  useEffect(() => {
    if (!accountMenuOpen) return

    const updateMenuPosition = () => {
      const rect = accountButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuPosition({
        top: Math.max(12, rect.top - 200),
        left: Math.max(72, rect.left - 2),
      })
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (accountButtonRef.current?.contains(target)) return
      if (accountMenuRef.current?.contains(target)) return
      setAccountMenuOpen(false)
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [accountMenuOpen])

  return (
    <>
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <nav className="w-14 flex flex-col items-center border-r border-ds-outline-variant/10 flex-shrink-0 bg-white px-2 py-2 gap-2">
            <div className="w-full flex flex-col items-center gap-2">
              <button
                onClick={() => toggleSidePanel('files')}
                className="w-8 h-8 flex items-center justify-center rounded text-ds-on-surface-variant hover:text-ds-on-surface hover:bg-ds-surface-container-high transition-colors"
                title={activeSidePanel ? '收起侧边栏' : '展开侧边栏'}
              >
                <Menu size={18} strokeWidth={1.5} />
              </button>

              <button
                onClick={() => { if (!activeSidePanel) setActiveSidePanel('files') }}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  activeSidePanel ? 'text-brand' : 'text-ds-on-surface-variant hover:text-brand'
                }`}
                title="文件"
              >
                <FolderOpen size={18} strokeWidth={1.5} fill={activeSidePanel ? '#4670FE' : 'none'} />
              </button>
            </div>

            <div className="flex-grow" />

            <div className="w-full flex flex-col items-center gap-1 pb-1.5">
              {isLoggedIn && (
                <button
                  ref={balanceButtonRef}
                  onClick={() => setPlanModalOpen(true)}
                  className={`${actionButtonBase} text-brand hover:bg-ds-surface-container-high/80`}
                  title="账户余额"
                >
                  <div className="flex items-center gap-0.5 text-[9px] font-semibold leading-none text-brand">
                    <span className="text-[10px]">✦</span>
                    <span>{balanceInfo.total}</span>
                  </div>
                  <span className="mt-1 text-[8px] font-semibold leading-none text-brand">充值</span>
                </button>
              )}

              <button
                ref={accountButtonRef}
                onClick={() => {
                  if (isLoggedIn) {
                    setAccountMenuOpen((prev) => !prev)
                  } else {
                    setLoginOpen(true)
                  }
                }}
                className={`${actionButtonBase} text-[#3A3D45] hover:bg-ds-surface-container-high/80`}
                title={isLoggedIn ? '用户信息' : '登录'}
              >
                {isLoggedIn ? (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#5B6472] text-[10px] font-semibold text-white">
                    {profile.avatar}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[#4B4F58] leading-none">登录</span>
                )}
              </button>

              <button
                className={`${actionButtonBase} text-[#7A8392] hover:bg-ds-surface-container-high/80`}
                title="API（占位，后续跳转自助平台）"
              >
                <span className="text-[10px] font-medium leading-none tracking-[0.01em] text-[#7A8392]">API</span>
              </button>
            </div>
          </nav>

          {activeSidePanel ? (
            <Group orientation="horizontal" id="workspace-main">
              <Panel
                id="sidebar"
                defaultSize="220px"
                minSize="160px"
                maxSize="400px"
              >
                <SidePanel />
              </Panel>
              <Separator>
                <div className="w-[1px] h-full bg-ds-surface-container-high/60 hover:bg-brand/20 transition-colors" />
              </Separator>
              <Panel id="main" minSize="40%">
                <div className="flex flex-col h-full overflow-hidden bg-white">
                  <PaneContainer node={paneLayout} isRoot />
                </div>
              </Panel>
            </Group>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <PaneContainer node={paneLayout} isRoot />
            </div>
          )}
        </div>
      </div>

      {/* 账户菜单 */}
      {isLoggedIn && accountMenuOpen && menuPosition && createPortal(
        <div
          ref={accountMenuRef}
          className="fixed z-[120] w-[200px] rounded-[18px] border border-black/[0.05] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.10)]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <div className="rounded-[14px] px-3 py-2.5">
            <div className="text-[13px] font-semibold text-slate-900 leading-none">{profile.name}</div>
            <div className="mt-1.5 text-[11px] text-slate-500 leading-4 truncate">{profile.email}</div>
          </div>

          <div className="my-1 h-px bg-slate-100" />

          <button
            onClick={() => { setWatermarkModalOpen(true); setAccountMenuOpen(false) }}
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Droplets size={14} />
              去 AI 水印
            </span>
            {globalWatermarkDisabled && <Check size={14} className="text-brand" />}
          </button>

          <div className="my-1 h-px bg-slate-100" />

          {/* 存储空间 */}
          <button
            onClick={() => { setStorageModalOpen(true); setAccountMenuOpen(false) }}
            className="w-full rounded-[14px] px-3 py-2.5 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <HardDrive size={12} />
                存储空间
              </span>
              <span className="text-slate-700 font-semibold text-[10px]">
                {formatBytes(storageQuota.used)} / {formatBytes(storageQuota.total)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  storageQuota.used / storageQuota.total > 0.9 ? 'bg-red-500' :
                  storageQuota.used / storageQuota.total > 0.7 ? 'bg-amber-500' : 'bg-brand'
                }`}
                style={{ width: `${Math.min((storageQuota.used / storageQuota.total) * 100, 100)}%` }}
              />
            </div>
          </button>

          <div className="my-1 h-px bg-slate-100" />

          <button
            onClick={() => {
              logout()
              setAccountMenuOpen(false)
            }}
            className="flex w-full items-center rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            退出登录
          </button>
        </div>,
        document.body,
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PlanModal open={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      <WatermarkSettingsModal open={watermarkModalOpen} onClose={() => setWatermarkModalOpen(false)} />
      <StorageModal open={storageModalOpen} onClose={() => setStorageModalOpen(false)} />
    </>
  )
}
