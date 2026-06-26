import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ARTICLES } from "@/app/data/articles";
import { Article } from "@/app/types";

// Helper to consistently map author names to a set of diverse portrait avatars
function getDynamicAvatar(authorName: string): string {
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80"
  ];

  let hash = 0;
  const nameToHash = authorName || "Associated Press";
  for (let i = 0; i < nameToHash.length; i++) {
    hash = nameToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatars.length;
  return avatars[index];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Search in static local articles first
    const staticArt = ARTICLES.find((a) => a.id === id);
    if (staticArt) {
      return NextResponse.json(staticArt);
    }

    // 2. If it is a NewsAPI article, query NewsAPI dynamically
    if (id.startsWith("news-")) {
      const slug = id.substring(5); // Remove "news-" prefix
      const query = slug.replace(/-/g, " ");
      const apiKey = process.env.NEWS_API_KEY;

      if (apiKey && apiKey.trim() !== "") {
        try {
          const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&apiKey=${apiKey}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const matchedItem = data.articles?.find((item: any) => {
              if (!item.title) return false;
              const itemSlug = encodeURIComponent(
                item.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")
              ).slice(0, 50);
              return itemSlug === slug;
            });

            if (matchedItem) {
              let displayDate = "June 24, 2026";
              if (matchedItem.publishedAt) {
                try {
                  displayDate = new Date(matchedItem.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  });
                } catch {}
              }

              const contentBody = `## ${matchedItem.title}

${matchedItem.description || ""}

${matchedItem.content ? matchedItem.content.replace(/\[\+\d+ chars\]$/, "") : ""}

This report was sourced in real-time. Full details, follow-ups, and subsequent briefs are continuously updated on our editorial network.

***

*Source: ${matchedItem.source?.name || "Global News Wire"}. Published on ${displayDate}.*`;

              const authorName = matchedItem.author || matchedItem.source?.name || "Associated Press";

              const mappedArticle: Article = {
                id,
                category: "International",
                title: matchedItem.title,
                subtitle: matchedItem.description || "Live dispatch from the press wires.",
                snippet: matchedItem.description || "Read the full dispatch below.",
                content: contentBody,
                imageUrl: matchedItem.urlToImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
                imageAlt: matchedItem.title,
                readTime: `${Math.max(3, Math.ceil((matchedItem.content?.length || 300) / 200))} min read`,
                date: displayDate,
                author: {
                  name: authorName,
                  role: `${matchedItem.source?.name || "Staff"} Correspondent`,
                  avatar: getDynamicAvatar(authorName)
                }
              };

              return NextResponse.json(mappedArticle);
            }
          }
        } catch (apiErr) {
          console.error("NewsAPI lookup failed in single article route:", apiErr);
        }
      }
    } else {
      // 3. Search in custom articles database (safely wrapped in try-catch)
      try {
        const customArt = await prisma.customArticle.findUnique({
          where: { id },
        });

        if (customArt) {
          return NextResponse.json({
            id: customArt.id,
            category: customArt.category,
            title: customArt.title,
            subtitle: customArt.subtitle,
            content: customArt.content,
            snippet: customArt.snippet,
            imageUrl: customArt.imageUrl,
            imageAlt: customArt.imageAlt,
            readTime: customArt.readTime,
            date: new Date(customArt.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            }),
            author: {
              name: customArt.authorName,
              role: customArt.authorRole,
              avatar: customArt.authorAvatar
            }
          });
        }
      } catch (dbErr) {
        console.error("Database query failed in single article lookup:", dbErr);
      }
    }

    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  } catch (error) {
    console.error("GET Single Article Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
