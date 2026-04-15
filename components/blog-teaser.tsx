import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    export async function BlogTeaser() {
      const { data: post } = await supabase
          .from("blog_posts")
              .select("title, slug, excerpt, author, published_at")
                  .eq("is_published", true)
                      .order("published_at", { ascending: false })
                          .limit(1)
                              .single()

                                if (!post) return null

                                  const formatDate = (iso: string) =>
                                      new Date(iso).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                                  month: "short",
                                                        year: "numeric",
                                                            })

                                                              return (
                                                                  <div className="mt-6">
                                                                        <h2 className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-3">
                                                                                From the blog
                                                                                      </h2>
                                                                                            <Link href={`/blog/${post.slug}`} className="block group">
                                                                                                    <div className="border border-border rounded-md p-3 hover:border-foreground/30 transition-colors bg-muted/30">
                                                                                                              <p className="text-sm font-medium text-foreground leading-snug group-hover:underline underline-offset-2 mb-1.5">
                                                                                                                          {post.title}
                                                                                                                                    </p>
                                                                                                                                              {post.excerpt && (
                                                                                                                                                          <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                                                                                                                                                                        {post.excerpt}
                                                                                                                                                                                    </p>
                                                                                                                                                                                              )}
                                                                                                                                                                                                        <div className="flex items-center justify-between">
                                                                                                                                                                                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                                                                                                                                                                                                  {post.author} · {formatDate(post.published_at)}
                                                                                                                                                                                                                                              </span>
                                                                                                                                                                                                                                                          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                                                                                                                                                                                                                                                                        Read →
                                                                                                                                                                                                                                                                                    </span>
                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                            </Link>
                                                                                                                                                                                                                                                                                                                  <Link href="/blog" className="block mt-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors text-right">
                                                                                                                                                                                                                                                                                                                          All posts →
                                                                                                                                                                                                                                                                                                                                </Link>
                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                                                                                                      }
