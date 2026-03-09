import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const homeConfig = {
  brand: "mimoo",
  tagline: "Next Level Kawaii Bakery",
  hero: {
    badge: "MIMOO · 日式烘焙工坊",
    title: "日式手工烘焙",
    highlight: "遇见甜蜜的幸福滋味",
    description:
      "来自日本的手作温度，每一口都是心动的味道。严格选用优质原料，传统工艺与现代技术结合。",
  },
  products: [
    { name: "草莓大福", flavor: "软糯Q弹的和果子", tone: "from-pink-300 to-rose-300", emoji: "🍡" },
    { name: "奶油面包", flavor: "绵密奶香入口即化", tone: "from-amber-200 to-yellow-300", emoji: "🍞" },
    { name: "抹茶红豆", flavor: "宇治抹茶配甜蜜红豆", tone: "from-green-200 to-emerald-200", emoji: "🍰" },
    { name: "樱花麻薯", flavor: "春日限定的浪漫", tone: "from-pink-200 to-rose-200", emoji: "🌸" },
    { name: "黄油曲奇", flavor: "酥脆香浓的经典", tone: "from-amber-100 to-orange-100", emoji: "🍪" },
    { name: "卡斯特拉", flavor: "日式柔软的云朵蛋糕", tone: "from-yellow-100 to-amber-100", emoji: "🧁" },
  ],
  oem: {
    title: "代加工服务",
    description: "我们拥有专业的烘焙工厂和经验丰富的研发团队，为您提供从配方开发到量产的一站式服务。",
    features: ["📦 多种包装规格可选", "🔬 配方定制研发", "📋 品质检测认证", "🚚 物流配送支持"],
    media: [
      { type: "video", title: "和面到醒发", source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
      { type: "image", title: "自动化烘焙线", source: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80" },
      { type: "image", title: "蛋糕装饰工段", source: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1400&q=80" },
    ],
  },
  about: {
    title: "关于 Mimoo",
    content: [
      "Mimoo 创立于对甜点的热爱。我们相信，美食不仅仅是味觉的享受，更是心灵的治愈。",
      "每一款产品都倾注了我们对品质的坚持和对美学的追求。希望 Mimoo 的甜点能为您带来心动的时刻。",
    ],
    stats: [
      { value: "5+", label: "年经验" },
      { value: "50+", label: "款产品" },
      { value: "10k+", label: "忠实粉丝" },
    ],
  },
  consult: {
    title: "联系我们",
    subtitle: "有任何问题或合作意向，欢迎随时联系我们",
    channels: ["微信/企微", "电话回呼", "邮箱报价"],
  },
} as const;

export default function IndiHomeRoute() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [consultOpen, setConsultOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string>(homeConfig.consult.channels[0]);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      // Keep only specific GSAP animations that are hard to do with Tailwind
      // Most animations are now handled by Tailwind classes (animate-float, animate-wiggle, etc.)
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-mimoo-cream text-mimoo-navy font-mimoo">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-mimoo-sakura/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-mimoo-sky/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-mimoo-yellow/20 blur-3xl" />
        <div className="kawaii-dot animate-float absolute left-[12%] top-[24%] h-4 w-4 rounded-full bg-mimoo-rose" />
        <div className="kawaii-dot animate-wiggle absolute left-[64%] top-[16%] h-3 w-3 rounded-full bg-mimoo-matcha" />
        <div className="kawaii-dot animate-bounce-slow absolute left-[86%] top-[44%] h-5 w-5 rounded-full bg-mimoo-yellow" />
      </div>

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-12 md:px-8">
        <header className="mb-24 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <p className="hero-badge inline-flex rounded-full border border-mimoo-sakura/30 bg-mimoo-sakura/10 px-4 py-1 text-xs tracking-[0.22em] uppercase text-mimoo-chocolate">
              {homeConfig.hero.badge}
            </p>
            <h1 className="hero-title mt-5 text-5xl leading-tight font-black md:text-7xl text-mimoo-chocolate">
              {homeConfig.hero.title}
              <span className="block bg-gradient-to-r from-mimoo-sakura via-mimoo-yellow to-mimoo-matcha bg-clip-text text-transparent">
                {homeConfig.hero.highlight}
              </span>
            </h1>
            <p className="hero-subtitle mt-6 text-base text-mimoo-chocolate/80 md:text-lg max-w-lg mx-auto md:mx-0">
              {homeConfig.hero.description}
            </p>
            <div className="hero-cta mt-8 flex flex-wrap justify-center md:justify-start gap-4">
              <a
                href="#products"
                className="rounded-full bg-mimoo-coral px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl hover:bg-mimoo-rose animate-slide-up"
              >
                探索产品
              </a>
              <a
                href="#oem"
                className="rounded-full border-2 border-mimoo-coral px-8 py-4 text-lg font-bold text-mimoo-coral transition hover:bg-mimoo-coral/10 animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                代加工服务
              </a>
            </div>
          </div>
          <div className="flex-1 relative flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-mimoo-sakura to-mimoo-rose rounded-full flex items-center justify-center shadow-2xl animate-float">
                <span className="text-8xl md:text-9xl">🍓</span>
              </div>
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-lg animate-wiggle">
                <span className="text-3xl">🥯</span>
              </div>
              <div className="absolute -bottom-2 -left-4 bg-white p-3 rounded-2xl shadow-lg animate-wiggle" style={{ animationDelay: "0.5s" }}>
                <span className="text-2xl">🍪</span>
              </div>
            </div>
          </div>
        </header>

        <section id="products" className="py-24 relative">
          <div className="text-center mb-16">
            <span className="text-mimoo-coral font-medium tracking-widest uppercase">Our Products</span>
            <h2 className="text-4xl md:text-5xl font-bold text-mimoo-chocolate mt-2 mb-4">招牌产品</h2>
            <p className="text-mimoo-chocolate/70 text-lg max-w-2xl mx-auto">
              严格选用优质原料，传统工艺与现代技术结合
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {homeConfig.products.map((product) => (
              <article
                key={product.name}
                className="product-card group rounded-3xl border-2 border-mimoo-sakura/20 bg-white p-6 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl hover:border-mimoo-sakura cursor-pointer"
              >
                <div className={`w-full h-48 bg-gradient-to-br ${product.tone} rounded-2xl mb-6 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-300`}>
                  {product.emoji}
                </div>
                <h3 className="text-xl font-bold text-mimoo-chocolate mb-2 group-hover:text-mimoo-coral transition-colors">{product.name}</h3>
                <p className="text-mimoo-chocolate/70">{product.flavor}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="oem" className="py-24 relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-mimoo-coral font-medium tracking-widest uppercase">OEM Service</span>
              <h2 className="text-4xl md:text-5xl font-bold text-mimoo-chocolate mt-2 mb-6">{homeConfig.oem.title}</h2>
              <p className="text-mimoo-chocolate/80 text-lg mb-8 leading-relaxed">
                {homeConfig.oem.description}
              </p>
              <ul className="space-y-4 mb-8">
                {homeConfig.oem.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-mimoo-chocolate text-lg">
                    <span className="text-mimoo-coral">{feature.split(' ')[0]}</span>
                    {feature.slice(2)}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setConsultOpen(true)}
                className="rounded-full bg-mimoo-chocolate text-white px-8 py-4 font-bold text-lg hover:bg-mimoo-chocolate/80 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                咨询代加工
              </button>
            </div>
            <div className="flex justify-center relative">
              <div className="relative">
                <div className="w-80 h-80 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-mimoo-milk">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🏭</div>
                    <p className="text-mimoo-chocolate font-bold text-xl">日式标准化工厂</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-mimoo-sakura p-4 rounded-2xl shadow-lg animate-wiggle">
                  <span className="text-4xl">✅</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center order-2 md:order-1 relative">
              <div className="relative w-72 h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-gradient-to-br from-mimoo-sakura to-mimoo-coral rounded-full flex items-center justify-center shadow-2xl animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-8xl">🐰</span>
                </div>
                <div className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-lg animate-pulse-soft">
                  <span className="text-3xl">💕</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-mimoo-coral font-medium tracking-widest uppercase">About Mimoo</span>
              <h2 className="text-4xl md:text-5xl font-bold text-mimoo-chocolate mt-2 mb-6">{homeConfig.about.title}</h2>
              {homeConfig.about.content.map((p, i) => (
                <p key={i} className="text-mimoo-chocolate/80 text-lg mb-6 leading-relaxed">
                  {p}
                </p>
              ))}
              <div className="flex gap-8 mt-8">
                {homeConfig.about.stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-bold text-mimoo-coral mb-1">{stat.value}</div>
                    <div className="text-mimoo-chocolate/60 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <section id="contact" className="py-24 bg-gradient-to-b from-mimoo-cream to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-mimoo-coral font-medium tracking-widest uppercase">Contact Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-mimoo-chocolate mt-2 mb-4">{homeConfig.consult.title}</h2>
            <p className="text-mimoo-chocolate/70 text-lg">
              {homeConfig.consult.subtitle}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-mimoo-sakura/20">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("消息已发送！我们会尽快联系您。"); }}>
              <div>
                <label className="block text-mimoo-chocolate font-bold mb-2 ml-1">您的名字</label>
                <input
                  type="text"
                  required
                  className="w-full px-6 py-4 border-2 border-mimoo-sakura/20 rounded-2xl focus:border-mimoo-coral focus:outline-none transition-colors bg-mimoo-milk/30"
                  placeholder="请输入您的名字"
                />
              </div>
              <div>
                <label className="block text-mimoo-chocolate font-bold mb-2 ml-1">联系方式</label>
                <input
                  type="text"
                  required
                  className="w-full px-6 py-4 border-2 border-mimoo-sakura/20 rounded-2xl focus:border-mimoo-coral focus:outline-none transition-colors bg-mimoo-milk/30"
                  placeholder="手机号或邮箱"
                />
              </div>
              <div>
                <label className="block text-mimoo-chocolate font-bold mb-2 ml-1">留言内容</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-6 py-4 border-2 border-mimoo-sakura/20 rounded-2xl focus:border-mimoo-coral focus:outline-none transition-colors bg-mimoo-milk/30 resize-none"
                  placeholder="请告诉我们您的需求..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-mimoo-coral text-white py-4 rounded-2xl font-bold text-lg hover:bg-mimoo-rose transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                发送消息 ✉️
              </button>
            </form>
          </div>
        </div>
      </section>

      {consultOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setConsultOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-mimoo-chocolate">快速咨询</h3>
              <button onClick={() => setConsultOpen(false)} className="text-mimoo-chocolate/50 hover:text-mimoo-coral text-2xl">×</button>
            </div>
            <p className="text-mimoo-chocolate/70 mb-6">选择您偏好的沟通方式，我们会尽快回复。</p>
            <div className="space-y-3">
              {homeConfig.consult.channels.map(channel => (
                <button key={channel} className="w-full p-4 rounded-xl border-2 border-mimoo-sakura/20 hover:border-mimoo-coral hover:bg-mimoo-milk/50 flex items-center justify-between group transition-all">
                  <span className="font-bold text-mimoo-chocolate group-hover:text-mimoo-coral">{channel}</span>
                  <span className="text-mimoo-coral opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <footer className="bg-mimoo-chocolate text-white py-12 px-6 md:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-3xl">🍓</span> {homeConfig.brand}
            </h3>
            <p className="text-white/70">日式手工烘焙工坊</p>
            <p className="text-white/70">让每一口都充满幸福</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-mimoo-sakura">快速链接</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#products" className="hover:text-mimoo-sakura transition-colors">产品列表</a></li>
              <li><a href="#oem" className="hover:text-mimoo-sakura transition-colors">代加工服务</a></li>
              <li><a href="#about" className="hover:text-mimoo-sakura transition-colors">关于我们</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-mimoo-sakura">联系我们</h4>
            <ul className="space-y-2 text-white/70">
              <li>📧 mimoo@example.com</li>
              <li>📍 某市某区某街道</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-mimoo-sakura">关注我们</h4>
            <div className="flex gap-4">
              <a href="#" className="text-2xl hover:scale-125 transition-transform">📸</a>
              <a href="#" className="text-2xl hover:scale-125 transition-transform">💬</a>
              <a href="#" className="text-2xl hover:scale-125 transition-transform">📱</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10 pt-8 text-center text-white/40 text-sm">
          <p>© 2024 Mimoo. All rights reserved. | 用心制作每一份甜蜜</p>
        </div>
      </footer>
    </div>
  );
}
