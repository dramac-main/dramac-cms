import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// Create a Supabase client with service role for public access
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(url, key);
}

async function getSiteBySubdomain(subdomain: string) {
  const supabase = getSupabaseClient();
  
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("is_published", true)
    .single();

  return data;
}

async function getBlogPosts(siteId: string) {
  const supabase = getSupabaseClient();
  
  const { data } = await supabase
    .from("blog_posts")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url),
      categories:blog_post_categories(
        category:blog_categories(id, name, slug, color)
      )
    `
    )
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return data || [];
}

export default async function PublicBlogPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await getSiteBySubdomain(subdomain);

  if (!site) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Site Not Found</h1>
        <p className="text-gray-600">The site you are looking for does not exist or is not published.</p>
      </div>
    );
  }

  const posts = await getBlogPosts(site.id);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-2">Blog</h1>
      <p className="text-xl text-gray-600 mb-12">Latest news and articles</p>

      <div className="space-y-12">
        {posts.map((post) => {
          const author = post.author as { full_name: string; avatar_url?: string } | null;
          const categoriesRaw = (post.categories as Array<{ category: { name: string; color: string } }>) || [];
          const categories = categoriesRaw.filter(c => c.category);

          return (
            <article key={post.id} className="group">
              <Link href={`/blog/${subdomain}/${post.slug}`}>
                {post.featured_image_url && (
                  <div className="relative aspect-[2/1] mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={post.featured_image_url}
                      alt={post.featured_image_alt || post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                )}

                {categories.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    {categories.map((c, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        style={{
                          backgroundColor: `${c.category.color}20`,
                          color: c.category.color,
                        }}
                      >
                        {c.category.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-gray-600 mt-2 line-clamp-2">{post.excerpt}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  {author?.avatar_url && (
                    <Image
                      src={author.avatar_url}
                      alt={author.full_name || "Author"}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span>{author?.full_name || "Unknown Author"}</span>
                  <span>•</span>
                  <span>
                    {new Date(post.published_at).toLocaleDateString(DEFAULT_LOCALE, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{post.reading_time_minutes || 1} min read</span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts published yet.</p>
          <p className="text-gray-400 mt-2">Check back soon for new content!</p>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await getSiteBySubdomain(subdomain);
  
  if (!site) {
    return { title: "Blog Not Found" };
  }

  return {
    title: `Blog | ${site.name}`,
    description: `Latest news and articles from ${site.name}`,
  };
}
