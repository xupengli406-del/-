import { NavLink, useLocation } from 'react-router-dom'
import { User } from 'lucide-react'
import OctopusLogo from './OctopusLogo'

const navItems = [
  { label: 'Octopus', path: '/' },
  { label: '章鱼TV', path: '/tv' },
  { label: '工作流', path: '/workflow' },
  { label: '工作空间', path: '/workspace' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6">
      <div className="flex items-center gap-1">
        {navItems.map((item, idx) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {idx === 0 && <OctopusLogo className="w-6 h-6" />}
              <span className={idx === 0 ? 'font-bold text-base' : ''}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">CN</span>
        <button className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors">
          <User className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </nav>
  )
}
