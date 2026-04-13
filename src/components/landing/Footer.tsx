const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Image Generation', href: '/app' },
      { label: 'Video Generation', href: '/app' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Tutorials', href: '/app' },
      { label: 'Changelog', href: '/app' },
      { label: 'API Docs', href: '/app' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/app' },
      { label: 'Terms of Service', href: '/app' },
      { label: 'Privacy Policy', href: '/app' },
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
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs uppercase tracking-wide font-medium">
              AI Powered by Cloudsway Pte. Ltd.
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
