const footerLinks = [
  {
    title: '产品',
    links: [
      { label: '图片生成', href: '/app' },
      { label: '视频生成', href: '/app' },
      { label: '定价方案', href: '#pricing' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: '使用教程', href: '#' },
      { label: '更新日志', href: '#' },
      { label: 'API 文档', href: '#' },
    ],
  },
  {
    title: '关于',
    links: [
      { label: '关于我们', href: '#' },
      { label: '服务条款', href: '#' },
      { label: '隐私政策', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/50 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo & 介绍 */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/octopus.svg" alt="CloudsVid" className="w-8 h-8" />
              <span className="font-display text-xl font-bold text-slate-900">CloudsVid</span>
            </a>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AI 驱动的漫剧创作平台，从分镜到成片，让创意快速成真。
            </p>
          </div>

          {/* 链接列 */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 版权 */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} CloudsVid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
