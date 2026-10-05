'use client'

import { useState, useEffect } from 'react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { BookOpen, ArrowUpRight, Feather } from 'lucide-react'

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  image_url: string
  published_at: string
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => setBlogs(Array.isArray(data) ? data : []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const CSS = `
    .blg{
      --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --wa:#EFE9DF; --bd:#ECE5DA; --bd2:#E2D9CB;
      --a:#8C7456; --a2:#A8916F; --a3:#C9B68F; --al:rgba(140,116,86,.10); --am:rgba(140,116,86,.22);
      --ink:#3A2E22; --mu:rgba(58,46,34,.56); --fa:rgba(58,46,34,.40); --li:rgba(58,46,34,.08);
      --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
      --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
      background:var(--iv); color:var(--ink); min-height:100vh; font-family:var(--sans);
      -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
    }
    .blg *{ box-sizing:border-box; }

    .blg-grad{
      background:linear-gradient(120deg,var(--a3),var(--a) 52%,var(--a2));
      -webkit-background-clip:text; background-clip:text; color:transparent; font-style:italic;
    }

    /* ---------- compact centered header ---------- */
    .blg-head{
      text-align:center; position:relative;
      padding:clamp(40px,5.6vw,68px) clamp(20px,5vw,48px) clamp(26px,3.6vw,38px);
      background:linear-gradient(180deg,var(--w) 0%, var(--iv) 100%);
      border-bottom:1px solid var(--li);
    }
    .blg-eyebrow{
      display:inline-flex; align-items:center; gap:10px;
      font-size:10.5px; font-weight:600; letter-spacing:.32em; text-transform:uppercase;
      color:var(--a); margin:0 0 16px;
    }
    .blg-eyebrow::before,.blg-eyebrow::after{ content:''; width:24px; height:1px; background:var(--a3); }
    .blg-h1{
      font-family:var(--serif); font-weight:400;
      font-size:clamp(30px,4.4vw,50px); line-height:1.04; letter-spacing:-.01em;
      margin:0; color:var(--ink);
    }
    .blg-rule{
      width:64px; height:1px; margin:18px auto 0;
      background:linear-gradient(90deg,transparent,var(--a2),transparent);
    }
    .blg-lead{
      max-width:520px; margin:18px auto 0;
      font-size:clamp(13.5px,1.4vw,15px); line-height:1.7; letter-spacing:.01em;
      color:var(--mu); font-weight:300;
    }
    /* editorial story counter — opposite the eyebrow, adds premium meta w/o height */
    .blg-count{
      display:inline-flex; align-items:center; gap:8px;
      margin:20px auto 0;
      font-variant-numeric:tabular-nums; font-feature-settings:'tnum' 1;
      font-size:10.5px; font-weight:600; letter-spacing:.26em; text-transform:uppercase;
      color:var(--fa);
    }
    .blg-count b{ color:var(--a2); font-weight:700; }
    .blg-count::before{ content:''; width:18px; height:1px; background:var(--bd2); }

    /* ---------- shell ---------- */
    .blg-main{
      max-width:1200px; margin:0 auto;
      padding:clamp(30px,4vw,52px) clamp(20px,5vw,48px) clamp(72px,9vw,116px);
    }
    @media(max-width:1023px){
      .blg-main{ padding-bottom:calc(104px + env(safe-area-inset-bottom,0px)); }
    }

    /* ---------- uniform card grid ---------- */
    .blg-grid{
      display:grid; grid-template-columns:1fr; gap:clamp(20px,2.6vw,32px);
    }
    @media(min-width:640px){ .blg-grid{ grid-template-columns:repeat(2,1fr); } }
    @media(min-width:1000px){ .blg-grid{ grid-template-columns:repeat(3,1fr); } }

    .blg-card{
      position:relative; display:flex; flex-direction:column; min-width:0;
      text-decoration:none; color:inherit;
      background:var(--w); border:1px solid var(--bd); border-radius:7px; overflow:hidden;
      box-shadow:0 14px 34px -26px rgba(140,116,86,.55), 0 2px 8px -4px rgba(58,46,34,.06);
      transition:transform .5s cubic-bezier(.16,1,.3,1), box-shadow .5s ease, border-color .5s ease;
    }
    .blg-card::after{
      content:''; position:absolute; inset:0; border-radius:7px; pointer-events:none;
      box-shadow:inset 0 0 0 1px var(--am), inset 0 0 22px -8px rgba(140,116,86,.4);
      opacity:0; transition:opacity .45s ease;
    }
    .blg-card:hover{
      transform:translateY(-6px);
      border-color:var(--bd2);
      box-shadow:0 30px 56px -30px rgba(140,116,86,.6), 0 4px 14px -6px rgba(58,46,34,.1);
    }
    .blg-card:hover::after{ opacity:1; }

    /* ---------- media w/ fine inner double-frame + saturate settle ---------- */
    .blg-media{
      position:relative; overflow:hidden; aspect-ratio:4/3;
      padding:8px; background:var(--cr); border-bottom:1px solid var(--bd);
    }
    .blg-frame{
      position:relative; width:100%; height:100%; overflow:hidden; border-radius:4px;
      box-shadow:inset 0 0 0 1px var(--li);
    }
    .blg-media img{
      width:100%; height:100%; object-fit:cover; display:block;
      filter:saturate(.94);
      transition:transform 1s cubic-bezier(.16,1,.3,1), filter .6s ease;
    }
    .blg-card:hover .blg-media img{ transform:scale(1.055); filter:saturate(1); }
    .blg-ph{
      width:100%; height:100%; display:flex; align-items:center; justify-content:center;
      color:var(--a3);
      background:radial-gradient(120% 120% at 32% 22%, var(--w), var(--cr) 68%, var(--wa) 100%);
    }

    .blg-body{
      display:flex; flex-direction:column; flex:1; min-width:0;
      padding:clamp(17px,1.8vw,22px) clamp(18px,1.9vw,24px) clamp(18px,2vw,24px);
    }
    .blg-meta{
      display:flex; align-items:center; gap:11px; flex-wrap:wrap;
      font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--mu);
    }
    /* delicate 1px vertical hairline separator (couture > bullet dot) */
    .blg-meta .blg-sep{ width:1px; height:11px; background:var(--bd2); flex-shrink:0; }
    .blg-meta .blg-auth{ color:var(--a); }
    .blg-title{
      font-family:var(--serif); font-weight:500;
      font-size:clamp(20px,1.7vw,24px); line-height:1.16; letter-spacing:-.005em;
      margin:12px 0 0; color:var(--ink); transition:color .35s ease;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    }
    .blg-card:hover .blg-title{ color:var(--a); }
    .blg-ex{
      margin:10px 0 0; font-size:13.5px; line-height:1.65; color:var(--mu); font-weight:300;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    }
    .blg-read{
      display:inline-flex; align-items:center; align-self:flex-start; margin-top:auto;
      padding-top:18px;
      font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--a);
    }
    .blg-read span{
      display:inline-flex; align-items:center;
      padding:7px 14px; border-radius:100px; border:1px solid var(--bd2);
      background:var(--iv); transition:background .35s ease, border-color .35s ease;
    }
    /* arrow always visible; nudges right on hover */
    .blg-read .blg-arw{
      display:inline-flex; align-items:center; margin-left:7px;
      transition:transform .35s cubic-bezier(.16,1,.3,1);
    }
    .blg-card:hover .blg-read span{ background:var(--al); border-color:var(--am); }
    .blg-card:hover .blg-read .blg-arw{ transform:translateX(3px); }

    /* ---------- skeleton ---------- */
    .blg-sk{ position:relative; overflow:hidden; background:var(--cr); }
    .blg-sk::after{
      content:''; position:absolute; inset:0;
      background:linear-gradient(90deg,transparent,rgba(253,252,249,.72),transparent);
      transform:translateX(-100%); animation:blg-shimmer 1.5s infinite;
    }
    @keyframes blg-shimmer{ 100%{ transform:translateX(100%); } }
    .blg-skel{ pointer-events:none; }
    .blg-sk-media{ aspect-ratio:4/3; border-bottom:1px solid var(--bd); }
    .blg-sk-line{ height:12px; border-radius:5px; margin-top:12px; }
    .blg-sk-line.lg{ height:22px; width:88%; margin-top:14px; }
    .blg-sk-line.sm{ width:46%; height:10px; }
    .blg-sk-pill{ height:32px; width:120px; border-radius:100px; margin-top:20px; }

    /* ---------- empty ---------- */
    .blg-empty{
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; padding:clamp(56px,10vw,104px) 20px;
    }
    .blg-empty-ic{
      width:78px; height:78px; border-radius:50%; display:flex; align-items:center; justify-content:center;
      margin:0 auto 24px; color:var(--a2);
      background:radial-gradient(120% 120% at 30% 20%, var(--w), var(--cr) 74%, var(--wa));
      border:1px solid var(--bd2); box-shadow:0 20px 44px -30px rgba(140,116,86,.5);
    }
    .blg-empty h3{
      font-family:var(--serif); font-weight:400; font-size:clamp(26px,4vw,38px);
      line-height:1.12; margin:0; color:var(--ink);
    }
    .blg-empty p{
      max-width:400px; margin:14px auto 0; font-size:14.5px; line-height:1.7; color:var(--mu); font-weight:300;
    }

    @media(max-width:520px){
      .blg-media{ aspect-ratio:16/11; }
    }

    @media(prefers-reduced-motion:reduce){
      .blg *{ animation:none !important; transition:none !important; }
      .blg-card:hover{ transform:none; }
      .blg-card:hover .blg-media img{ transform:none; }
      .blg-card:hover .blg-read .blg-arw{ transform:none; }
    }
  `

  return (
    <div className="blg">
      <style>{CSS}</style>
      <HeaderMegaMenu />

      {/* ---------- compact centered header ---------- */}
      <header className="blg-head">
        <span className="blg-eyebrow">Insights &amp; Stories</span>
        <h1 className="blg-h1">The <span className="blg-grad">Journal</span></h1>
        <div className="blg-rule" />
        <p className="blg-lead">
          Craftsmanship, heritage, and the quiet artistry behind every precious gem — curated dispatches from the Gems Global atelier.
        </p>
        {!loading && blogs.length > 0 && (
          <div className="blg-count">
            <b>{String(blogs.length).padStart(2, '0')}</b> {blogs.length === 1 ? 'Story' : 'Stories'}
          </div>
        )}
      </header>

      <main className="blg-main">
        {loading ? (
          /* ---------- loading skeleton ---------- */
          <div className="blg-grid">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="blg-card blg-skel">
                <div className="blg-sk blg-sk-media" />
                <div className="blg-body">
                  <div className="blg-sk blg-sk-line sm" />
                  <div className="blg-sk blg-sk-line lg" />
                  <div className="blg-sk blg-sk-line lg" style={{ width: '64%' }} />
                  <div className="blg-sk blg-sk-line" />
                  <div className="blg-sk blg-sk-line" style={{ width: '52%' }} />
                  <div className="blg-sk blg-sk-pill" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          /* ---------- empty state ---------- */
          <div className="blg-empty">
            <div className="blg-empty-ic"><Feather size={30} strokeWidth={1.4} /></div>
            <h3>Our story is just <span className="blg-grad">beginning</span></h3>
            <p>The first chapter is being written. Return soon for new articles, insights, and stories from the atelier.</p>
          </div>
        ) : (
          /* ---------- uniform card grid ---------- */
          <div className="blg-grid">
            {blogs.map(blog => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="blg-card">
                <div className="blg-media">
                  <div className="blg-frame">
                    {blog.image_url ? (
                      <img src={blog.image_url} alt={blog.title} />
                    ) : (
                      <div className="blg-ph"><BookOpen size={40} strokeWidth={1.1} /></div>
                    )}
                  </div>
                </div>
                <div className="blg-body">
                  <div className="blg-meta">
                    <span>{fmt(blog.published_at)}</span>
                    <span className="blg-sep" />
                    <span className="blg-auth">{blog.author}</span>
                  </div>
                  <h2 className="blg-title">{blog.title}</h2>
                  <p className="blg-ex">{blog.excerpt}</p>
                  <span className="blg-read">
                    <span>Read Article<span className="blg-arw"><ArrowUpRight size={13} strokeWidth={2} /></span></span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
