"use client";

import { useState, useEffect } from "react";
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from "@/components/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  Share2,
  Bookmark,
  BookmarkCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { getUser } from "@/lib/authStore";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  image_url: string;
  published_at: string;
}

// New posts are authored in the rich-text (HTML) editor; older posts were plain
// text using markdown-ish "##" / ">" markers. Detect which so both render right.
function isHtmlContent(s: string) {
  return /<\/?(p|div|h[1-6]|ul|ol|li|br|blockquote|strong|em|b|i|u|a|span|img|font)\b[^>]*>/i.test(s || "");
}

export default function BlogDetails({
  initialBlog,
  slug,
}: {
  initialBlog: Blog | null;
  slug: string;
}) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(initialBlog);
  const [related, setRelated] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(!initialBlog);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!initialBlog) {
      fetchBlog();
    } else {
      fetchRelated(initialBlog.id);
      const user = getUser();
      if (user) {
        checkIfSaved(user.id, initialBlog.id);
      }
    }
  }, [slug]);

  async function fetchBlog() {
    try {
      setLoading(true);
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBlog(data);

      const user = getUser();
      if (user) {
        checkIfSaved(user.id, data.id);
      }
      fetchRelated(data.id);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelated(excludeId: string) {
    try {
      const relRes = await fetch("/api/blog");
      const relData = await relRes.json();
      if (Array.isArray(relData)) {
        setRelated(relData.filter((b) => b.id !== excludeId).slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function checkIfSaved(userId: string, blogId: string) {
    try {
      const res = await fetch(`/api/saved-blogs?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSaved(data.some((b: any) => b.id === blogId));
      }
    } catch {}
  }

  async function toggleSave() {
    const user = getUser();
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (!blog) return;

    setSaveLoading(true);
    try {
      if (saved) {
        await fetch("/api/saved-blogs", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, blogId: blog.id }),
        });
        setSaved(false);
      } else {
        await fetch("/api/saved-blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, blogId: blog.id }),
        });
        setSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setSaveLoading(false);
    }
  }

  const CSS = `
    .bd-root { background: var(--c-bg); color: var(--c-text); min-height: 100vh; font-family: var(--font-main); }
    
    /* ── Hero Section ── */
    .bd-hero { position: relative; width: 100%; height: 70vh; min-height: 500px; display: flex; align-items: flex-end; padding-bottom: 80px; overflow: hidden; }
    .bd-hero-bg { position: absolute; inset: 0; z-index: 1; }
    .bd-hero-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.25; }
    .bd-hero-overlay { position: absolute; inset: 0; z-index: 2; background: linear-gradient(to bottom, transparent 0%, var(--c-bg) 100%); }
    .bd-hero-content { position: relative; z-index: 3; max-width: 900px; margin: 0 auto; width: 100%; padding: 0 24px; text-align: center; }
    
    .bd-eyebrow { font-size: 13px; text-transform: uppercase; letter-spacing: 0.4em; color: var(--c-accent); margin-bottom: 24px; display: block; font-weight: 500; }
    .bd-title { font-family: var(--font-heading); font-size: clamp(36px, 6vw, 72px); font-weight: 300; line-height: 1.1; margin-bottom: 32px; }
    
    .bd-meta-top { display: flex; align-items: center; justify-content: center; gap: 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--c-text-muted); }
    .bd-meta-item { display: flex; align-items: center; gap: 8px; }
    
    /* ── Article Body ── */
    .bd-main { max-width: 800px; margin: 0 auto; padding: 80px 24px 120px; position: relative; }
    
    .bd-content { font-size: 19px; line-height: 1.85; color: var(--c-text-muted); font-weight: 300; }
    .bd-content > *:first-child { margin-top: 0; }
    .bd-content > *:last-child { margin-bottom: 0; }
    .bd-content p { margin: 0 0 28px; }
    /* contentEditable emits <div> line-blocks — give them readable rhythm */
    .bd-content div { margin: 0 0 14px; }
    .bd-content h1, .bd-content h2, .bd-content h3, .bd-content h4 { font-family: var(--font-heading); color: var(--c-text); font-weight: 400; line-height: 1.2; }
    .bd-content h1 { font-size: clamp(30px, 4.5vw, 46px); margin: 64px 0 28px; }
    .bd-content h2 { font-size: clamp(26px, 3.6vw, 38px); margin: 60px 0 26px; border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.15); padding-bottom: 16px; }
    .bd-content h3 { font-size: clamp(22px, 2.8vw, 28px); margin: 44px 0 18px; }
    .bd-content h4 { font-size: 20px; margin: 36px 0 14px; letter-spacing: .01em; }
    .bd-content a { color: var(--c-accent); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; transition: opacity .2s; }
    .bd-content a:hover { opacity: .7; }
    .bd-content strong, .bd-content b { color: var(--c-text); font-weight: 600; }
    .bd-content em, .bd-content i { font-style: italic; }
    .bd-content u { text-decoration: underline; text-underline-offset: 2px; }
    .bd-content ul, .bd-content ol { margin: 0 0 28px; padding-left: 26px; }
    .bd-content ul { list-style: disc; }
    .bd-content ol { list-style: decimal; }
    .bd-content li { margin: 0 0 10px; padding-left: 6px; line-height: 1.7; }
    .bd-content li::marker { color: var(--c-accent); }
    .bd-content img { max-width: 100%; height: auto; display: block; margin: 32px 0; border-radius: 6px; border: 1px solid rgba(var(--c-accent-rgb), 0.15); }
    .bd-content hr { border: 0; height: 1px; background: rgba(var(--c-accent-rgb), 0.18); margin: 48px 0; }
    .bd-content code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .88em; background: rgba(var(--c-accent-rgb), 0.08); padding: 2px 6px; border-radius: 4px; }
    .bd-content blockquote { border-left: 2px solid var(--c-accent); padding: 12px 0 12px 32px; margin: 44px 0; font-style: italic; color: var(--c-accent); font-size: clamp(22px, 3vw, 30px); font-family: var(--font-heading); line-height: 1.45; position: relative; }
    .bd-content blockquote::before { content: '"'; position: absolute; left: 6px; top: -6px; font-size: 52px; opacity: 0.2; }
    
    /* ── Article Footer ── */
    .bd-foot { margin-top: 100px; padding-top: 60px; border-top: 1px solid rgba(var(--c-accent-rgb), 0.15); display: flex; flex-direction: column; align-items: center; gap: 40px; }
    .bd-author-card { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .bd-author-av { width: 80px; height: 80px; border-radius: 50%; background: rgba(var(--c-accent-rgb), 0.08); border: 1px solid rgba(var(--c-accent-rgb), 0.2); display: flex; align-items: center; justify-content: center; color: var(--c-accent); margin-bottom: 16px; }
    .bd-author-name { font-family: var(--font-heading); font-size: 24px; color: var(--c-text); margin-bottom: 4px; }
    .bd-author-bio { font-size: 14px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
    
    .bd-share-wrap { display: flex; gap: 12px; align-items: center; }
    .bd-share-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(var(--c-accent-rgb), 0.2); background: transparent; color: var(--c-accent); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; }
    .bd-share-btn:hover { background: rgba(var(--c-accent-rgb), 0.12); transform: translateY(-3px); }
    .bd-share-btn.saved { background: var(--c-accent); color: var(--c-bg); border-color: var(--c-accent); }
    .bd-share-btn.saved:hover { background: rgba(var(--c-accent-rgb), 0.8); }
    .bd-save-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--c-text-muted); transition: color 0.3s; }
    .bd-save-label.saved { color: var(--c-accent); }
    
    /* ── Related Section ── */
    .bd-related { background: rgba(var(--c-accent-rgb), 0.03); padding: 120px 24px; border-top: 1px solid rgba(var(--c-accent-rgb), 0.1); }
    .bd-related-inner { max-width: 1200px; margin: 0 auto; }
    .bd-related-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; }
    .bd-related-title { font-family: var(--font-heading); font-size: 44px; font-weight: 300; }
    .bd-related-title em { color: var(--c-accent); font-style: italic; }
    
    .bd-rel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
    .bd-rel-card { text-decoration: none; color: inherit; group; }
    .bd-rel-img { aspect-ratio: 16/10; overflow: hidden; margin-bottom: 24px; border: 1px solid rgba(var(--c-accent-rgb), 0.15); }
    .bd-rel-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1); opacity: 0.9; }
    .bd-rel-card:hover .bd-rel-img img { transform: scale(1.08); opacity: 1; }
    .bd-rel-t { font-family: var(--font-heading); font-size: 24px; margin-bottom: 12px; transition: color 0.3s; }
    .bd-rel-card:hover .bd-rel-t { color: var(--c-accent); }
    
    .bd-back-journal { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--c-accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 4px; transition: all 0.3s; }
    .bd-back-journal:hover { border-color: var(--c-accent); gap: 16px; }

    @media (max-width: 768px) {
      .bd-hero { height: 60vh; padding-bottom: 40px; }
      .bd-meta-top { flex-wrap: wrap; gap: 16px; }
      .bd-main { padding-top: 60px; }
      .bd-content { font-size: 18px; }
      .bd-content h2 { margin-top: 48px; }
      .bd-content blockquote { padding-left: 24px; margin: 36px 0; }
      .bd-related { padding: 80px 24px; }
    }
  `;

  if (loading)
    return (
      <div className="bd-root">
        <HeaderMegaMenu />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: 20,
          }}
        >
          <Loader2
            size={40}
            className="animate-spin"
            style={{ color: "#D4AF37" }}
          />
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              opacity: 0.5,
            }}
          >
            Loading Article
          </span>
        </div>
      </div>
    );

  if (error || !blog)
    return (
      <div className="bd-root">
        <HeaderMegaMenu />
        <div style={{ textAlign: "center", padding: "200px 24px" }}>
          <h2
            style={{
              fontFamily: "var(--font-dmsans),'DM Sans',system-ui,sans-serif",
              fontSize: 32,
              marginBottom: 20,
            }}
          >
            Article not found
          </h2>
          <p style={{ opacity: 0.5, marginBottom: 40 }}>
            The piece you are looking for might have been moved or archived.
          </p>
          <Link href="/blog" className="bd-back-journal">
            <ArrowLeft size={14} /> Back to Journal
          </Link>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="bd-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <section className="bd-hero">
        <div className="bd-hero-bg">
          {blog.image_url && <img src={blog.image_url} alt="" />}
        </div>
        <div className="bd-hero-overlay" />
        <div className="bd-hero-content">
          <span className="bd-eyebrow">Jewelry Journal — Story</span>
          <h1 className="bd-title">{blog.title}</h1>
          <div className="bd-meta-top">
            <div className="bd-meta-item">
              <Calendar size={14} />{" "}
              {new Date(blog.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="bd-meta-item">
              <User size={14} /> {blog.author}
            </div>
            <div className="bd-meta-item">
              <Clock size={14} /> {Math.ceil(blog.content.length / 1000)} min
              read
            </div>
          </div>
          {blog.excerpt && (
            <p
              style={{
                marginTop: 32,
                fontSize: 18,
                color: "rgba(235,229,216,0.6)",
                fontStyle: "italic",
                maxWidth: 700,
                marginInline: "auto",
                lineHeight: 1.6,
              }}
            >
              {blog.excerpt}
            </p>
          )}
        </div>
      </section>

      <main className="bd-main">
        {isHtmlContent(blog.content) ? (
          <div
            className="bd-content"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        ) : (
          <div className="bd-content">
            {blog.content.split("\n\n").map((para, i) => {
              if (para.startsWith("##"))
                return <h2 key={i}>{para.replace("##", "").trim()}</h2>;
              if (para.startsWith(">"))
                return <blockquote key={i}>{para.replace(">", "").trim()}</blockquote>;
              return <p key={i}>{para}</p>;
            })}
          </div>
        )}

        <div className="bd-foot">
          <div className="bd-author-card">
            <div className="bd-author-av">
              <User size={32} />
            </div>
            <div className="bd-author-name">{blog.author}</div>
            <div className="bd-author-bio">Contributing Editor</div>
          </div>

          <div className="bd-share-wrap">
            <button
              onClick={() =>
                navigator.share?.({ title: blog.title, url: window.location.href })
              }
              className="bd-share-btn"
              title="Share Article"
            >
              <Share2 size={20} />
            </button>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <button
                className={`bd-share-btn${saved ? " saved" : ""}`}
                title={saved ? "Remove from saved" : "Save for later"}
                onClick={toggleSave}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <Loader2
                    size={18}
                    style={{ animation: "spin 0.6s linear infinite" }}
                  />
                ) : saved ? (
                  <BookmarkCheck size={20} />
                ) : (
                  <Bookmark size={20} />
                )}
              </button>
              <span className={`bd-save-label${saved ? " saved" : ""}`}>
                {saved ? "Saved" : "Save"}
              </span>
            </div>
          </div>

          <Link href="/blog" className="bd-back-journal">
            <ArrowLeft size={14} /> Back to Journal
          </Link>
        </div>
      </main>

      {related.length > 0 && (
        <section className="bd-related">
          <div className="bd-related-inner">
            <div className="bd-related-head">
              <h2 className="bd-related-title">
                Continue <em>Reading</em>
              </h2>
              <Link href="/blog" className="bd-back-journal">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bd-rel-grid">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="bd-rel-card"
                >
                  <div className="bd-rel-img">
                    {rel.image_url ? (
                      <img src={rel.image_url} alt={rel.title} />
                    ) : (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    )}
                  </div>
                  <h3 className="bd-rel-t">{rel.title}</h3>
                  <div
                    className="bd-meta-item"
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {new Date(rel.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
