import { Metadata } from "next";
import BlogDetails from "./BlogDetails";
import { createClient } from "@supabase/supabase-js";

// Blog posts are non-personalized content; cache each rendered post (ISR)
// instead of re-fetching from the DB on every visit.
export const revalidate = 300;

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

async function getBlog(slug: string): Promise<Blog | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as Blog;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com';

  if (!blog) {
    return {
      title: "Blog Not Found",
      description: "The requested article could not be found."
    };
  }

  const title = `${blog.title} | Jewelry Journal`;
  const description = blog.excerpt || blog.content.substring(0, 160);
  const image = blog.image_url || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: [
      'jewelry blog',
      'jewelry care',
      'diamond guide',
      'jewelry trends',
      'gems global jewels journal',
      ...blog.title.split(' ')
    ].join(', '),
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${siteUrl}/blog/${blog.slug}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${blog.slug}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com';

  if (!blog) {
    return <div>Article not found</div>;
  }

  // JSON-LD Structured Data for Blog Post
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    image: blog.image_url,
    datePublished: blog.published_at,
    author: {
      '@type': 'Person',
      name: blog.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gems Global Jewels',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    description: blog.excerpt || blog.content.substring(0, 160),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${blog.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogDetails initialBlog={blog} slug={slug} />
    </>
  );
}
