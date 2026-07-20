export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ARTICLES } from "../../data/articles";
import { Article } from "../../types";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// Helper to resolve and clean up Unsplash and Pinterest image links
async function resolveImageUrl(url: string): Promise<string> {
  if (!url) return url;
  
  let cleanUrl = url.trim();
  
  // 1. Unsplash page URL resolution
  if (cleanUrl.includes("unsplash.com/photos/")) {
    try {
      const urlWithoutQuery = cleanUrl.split("?")[0].split("#")[0];
      const parts = urlWithoutQuery.split("/");
      const lastPart = parts[parts.length - 1];
      const idParts = lastPart.split("-");
      const photoId = idParts[idParts.length - 1];
      if (photoId) {
        return `https://images.unsplash.com/photo-${photoId}?w=1200&auto=format&fit=crop&q=80`;
      }
    } catch (e) {
      console.error("Failed to parse Unsplash URL:", e);
    }
  }

  // 2. Pinterest pin/board page URL resolution
  if (
    cleanUrl.includes("pinterest.com/pin/") ||
    cleanUrl.includes("pin.it/") ||
    (cleanUrl.includes("pinterest.co") && cleanUrl.includes("/pin/"))
  ) {
    try {
      const response = await fetch(cleanUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (response.ok) {
        const html = await response.text();
        const metaRegex = /<meta\s+([^>]*property=["'](?:og:image|twitter:image(?::src)?)["'][^>]*>|<meta\s+[^>]*name=["'](?:og:image|twitter:image(?::src)?)["'][^>]*>)/i;
        const metaMatch = html.match(metaRegex);
        if (metaMatch && metaMatch[0]) {
          const contentMatch = metaMatch[0].match(/content=["']([^"']+)["']/i);
          if (contentMatch && contentMatch[1]) {
            return contentMatch[1];
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch Pinterest page:", e);
    }
  }

  return cleanUrl;
}

// Helper to consistently map author names to a set of diverse, professional Unsplash portraits
function getDynamicAvatar(authorName: string): string {
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80", // Woman, professional neutral
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", // Man, professional warm
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80", // Woman, corporate profile
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", // Man, executive profile
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80", // Woman, creative/editorial
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80", // Man, classic portrait
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80", // Woman, modernist portrait
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80", // Man, studio clean
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80", // Woman, analyst/editor
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80", // Man, business analyst
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80", // Woman, field correspondent
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80"  // Man, senior editor
  ];

  let hash = 0;
  const nameToHash = authorName || "Associated Press";
  for (let i = 0; i < nameToHash.length; i++) {
    hash = nameToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatars.length;
  return avatars[index];
}

function classifyArticle(title: string, description: string, categoryName: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("accounting") || text.includes("finance") || text.includes("audit") || text.includes("taxation") || text.includes("bookkeeping")) return "Accounting";
  if (text.includes("sap") || text.includes("erp") || text.includes("system applications and products")) return "SAP";
  if (text.includes("hr ") || text.includes("human resources") || text.includes("recruitment") || text.includes("hiring") || text.includes("talent acquisition") || text.includes("payroll")) return "HR Executive";
  if (text.includes("data analytics") || text.includes("business intelligence") || text.includes("power bi") || text.includes("tableau") || text.includes("data visualization") || text.includes("analytics")) return "Data Analytics & Business Intelligence";
  if (text.includes("stock") || text.includes("forex") || text.includes("trading") || text.includes("nasdaq") || text.includes("market") || text.includes("shares") || text.includes("crypto") || text.includes("bitcoin")) return "Stock Market & Forex";
  if (text.includes("artificial intelligence") || text.includes(" ai ") || text.includes("machine learning") || text.includes("llm") || text.includes("deep learning") || text.includes("chatbot") || text.includes("openai")) return "Artificial Intelligence";
  if (text.includes("programming") || text.includes("software development") || text.includes("coding") || text.includes("python") || text.includes("javascript") || text.includes("developer") || text.includes("git ") || text.includes("software engineer")) return "Programming & Software Development";
  if (text.includes("cyber security") || text.includes("ethical hacking") || text.includes("malware") || text.includes("ransomware") || text.includes("vulnerability") || text.includes("cybersecurity") || text.includes("firewall") || text.includes("hacker")) return "Cyber Security & Ethical Hacking";
  if (text.includes("digital marketing") || text.includes("seo") || text.includes("social media marketing") || text.includes("advertising") || text.includes("brand campaign") || text.includes("google ads")) return "Digital Marketing";
  if (text.includes("web design") || text.includes("web development") || text.includes("html") || text.includes("css") || text.includes("react") || text.includes("frontend") || text.includes("backend")) return "Web Design & Development";
  if (text.includes("mobile app") || text.includes("ios app") || text.includes("android app") || text.includes("flutter") || text.includes("react native") || text.includes("mobile application")) return "Mobile App Development";
  if (text.includes("multimedia") || text.includes("graphic design") || text.includes("animation") || text.includes("video editing") || text.includes("photoshop") || text.includes("illustrator")) return "Multimedia, Design & Animation";
  if (text.includes("hardware") || text.includes("networking") || text.includes("router") || text.includes("switch") || text.includes("cisco") || text.includes("ethernet") || text.includes("processor") || text.includes("motherboard")) return "Computer Hardware & Networking";
  if (text.includes("sports") || text.includes("football") || text.includes("basketball") || text.includes("olympics") || text.includes("cricket") || text.includes("tennis")) return "Sports";
  if (text.includes("science") || text.includes("physics") || text.includes("biology") || text.includes("space") || text.includes("nasa") || text.includes("astronomy") || text.includes("chemistry")) return "Science";
  if (text.includes("environment") || text.includes("climate") || text.includes("global warming") || text.includes("eco-friendly") || text.includes("sustainability") || text.includes("pollution")) return "Environment";
  if (text.includes("architecture") || text.includes("building") || text.includes("design") || text.includes("architect") || text.includes("skyscraper") || text.includes("urban planning")) return "Architecture";
  
  // Fallback to top-level NewsAPI category maps:
  const cat = categoryName.toLowerCase();
  if (cat === "technology") return "Technology";
  if (cat === "science") return "Science";
  if (cat === "business") return "Stock Market & Forex";
  if (cat === "sports") return "Sports";
  
  return "International";
}

// Helper to map NewsAPI article items to our Article model
function mapNewsApiArticles(articles: any[], categoryName: string): Article[] {
  const mapped: Article[] = [];
  articles.forEach((item: any) => {
    if (!item.title || item.title === "[Removed]" || !item.description) {
      return;
    }

    // Map category name to standard naming:
    let displayCategory = classifyArticle(item.title, item.description, categoryName);

    // Create a unique, URL-safe ID from the title
    const id = "news-" + encodeURIComponent(
      item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    ).slice(0, 50);

    // Parse and format date
    let displayDate = "June 24, 2026";
    if (item.publishedAt) {
      try {
        displayDate = new Date(item.publishedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        });
      } catch {}
    }

    // Generate content body
    const contentBody = `## ${item.title}

${item.description}

${item.content ? item.content.replace(/\[\+\d+ chars\]$/, "") : ""}

This report was sourced in real-time. Full details, follow-ups, and subsequent briefs are continuously updated on our editorial network.

***

*Source: ${item.source?.name || "Global News Wire"}. Published on ${displayDate}.*`;

    const authorName = item.author || item.source?.name || "Associated Press";

    mapped.push({
      id,
      category: displayCategory,
      title: item.title,
      subtitle: item.description || "Live dispatch from the press wires.",
      snippet: item.description || "Read the full dispatch below.",
      content: contentBody,
      imageUrl: item.urlToImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
      imageAlt: item.title,
      readTime: `${Math.max(3, Math.ceil((item.content?.length || 300) / 200))} min read`,
      date: displayDate,
      author: {
        name: authorName,
        role: `${item.source?.name || "Staff"} Correspondent`,
        avatar: getDynamicAvatar(authorName)
      }
    });
  });
  return mapped;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const apiKey = process.env.NEWS_API_KEY;

  // Query custom articles from DB first
  let dbArticles: any[] = [];
  try {
    dbArticles = await prisma.customArticle.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (err) {
    console.error("Error fetching custom articles from DB:", err);
  }

  const mappedDbArticles: Article[] = dbArticles.map((art) => ({
    id: art.id,
    category: art.category,
    title: art.title,
    subtitle: art.subtitle,
    content: art.content,
    snippet: art.snippet,
    imageUrl: art.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
    imageAlt: art.imageAlt || art.title,
    readTime: art.readTime || "5 min read",
    isCustom: true,
    createdBy: art.createdBy,
    headingFont: art.headingFont,
    paragraphFont: art.paragraphFont,
    date: new Date(art.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }),
    author: {
      name: art.authorName,
      role: art.authorRole,
      avatar: art.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
    }
  }));

  // 1. If API Key is missing, search static + custom articles locally
  if (!apiKey || apiKey.trim() === "") {
    if (q && q.trim() !== "") {
      const filteredLocal = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      const filteredCustom = mappedDbArticles.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      return NextResponse.json([...filteredCustom, ...filteredLocal]);
    }
    return NextResponse.json([...mappedDbArticles, ...ARTICLES]);
  }

  try {
    // 2. Global search requested
    if (q && q.trim() !== "") {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=15&apiKey=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to search news articles");
      }
      const data = await response.json();
      // Map category as "International" or let it be general
      const apiArticles = mapNewsApiArticles(data.articles || [], "International");

      // Filter local articles for match to merge
      const localMatching = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      
      const customMatching = mappedDbArticles.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );

      // Merge and remove duplicate titles
      const merged = [...customMatching, ...apiArticles];
      const seenTitles = new Set(merged.map(a => a.title.toLowerCase()));
      localMatching.forEach((art) => {
        if (!seenTitles.has(art.title.toLowerCase())) {
          merged.push(art);
        }
      });

      return NextResponse.json(merged);
    }

    // 3. No query, fetch default front page (headlines & custom topics)
    const categories = ["technology", "science", "business", "sports"];
    const fetchPromises = categories.map(async (cat) => {
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${cat}&pageSize=6&apiKey=${apiKey}`;
      const response = await fetch(url, { next: { revalidate: 300 } });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${cat}`);
      }
      const data = await response.json();
      return { category: cat, articles: data.articles || [] };
    });

    // Also fetch custom topics via everything search query
    const everythingQuery = `accounting OR SAP OR "human resources" OR "data analytics" OR "cyber security" OR "digital marketing" OR "web development" OR "mobile app" OR architecture`;
    const everythingUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(everythingQuery)}&language=en&sortBy=relevancy&pageSize=25&apiKey=${apiKey}`;
    const fetchEverything = async () => {
      const response = await fetch(everythingUrl, { next: { revalidate: 300 } });
      if (!response.ok) {
        throw new Error("Failed to fetch everything");
      }
      const data = await response.json();
      return { category: "General", articles: data.articles || [] };
    };

    const results = await Promise.all([...fetchPromises, fetchEverything()]);
    const apiArticles: Article[] = [];

    results.forEach(({ category, articles }) => {
      const mapped = mapNewsApiArticles(articles, category);
      apiArticles.push(...mapped);
    });

    const merged = [...mappedDbArticles, ...apiArticles];
    const seenTitles = new Set(merged.map(a => a.title.toLowerCase()));

    ARTICLES.forEach((art) => {
      if (!seenTitles.has(art.title.toLowerCase())) {
        merged.push(art);
      }
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error in articles API:", error);
    // Fall back to static + custom articles if there's any network or parse issue
    if (q && q.trim() !== "") {
      const filteredLocal = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      const filteredCustom = mappedDbArticles.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      return NextResponse.json([...filteredCustom, ...filteredLocal]);
    }
    return NextResponse.json([...mappedDbArticles, ...ARTICLES]);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = payload.role as string;
    if (userRole !== "faculty" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins/Faculty only" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      category,
      snippet,
      content,
      imageUrl,
      imageAlt,
      readTime,
      authorName,
      authorRole,
      authorAvatar,
      readingListIds,
      headingFont,
      paragraphFont,
    } = body;

    if (!title || !subtitle || !category || !snippet || !content || !authorName || !authorRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the publishing user's details from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { name: true, avatar: true },
    });

    const finalAuthorName = dbUser?.name || authorName;
    const finalAuthorAvatar = dbUser?.avatar || authorAvatar || "scholar";

    const resolvedImgUrl = imageUrl ? await resolveImageUrl(imageUrl) : undefined;

    const customArticle = await prisma.customArticle.create({
      data: {
        title,
        subtitle,
        category,
        snippet,
        content,
        imageUrl: resolvedImgUrl,
        imageAlt: imageAlt || undefined,
        readTime: readTime || undefined,
        authorName: finalAuthorName,
        authorRole,
        authorAvatar: finalAuthorAvatar,
        createdBy: payload.userId as string,
        headingFont: headingFont || undefined,
        paragraphFont: paragraphFont || undefined,
      },
    });

    // Notify all students about the new article
    try {
      const students = await prisma.user.findMany({
        where: { role: "student" },
        select: { id: true },
      });

      const notifyPromises = students.map((student) =>
        createNotification({
          userId: student.id,
          senderId: payload.userId as string,
          senderName: finalAuthorName,
          type: "post",
          message: `New article published: "${title}"`,
          articleId: customArticle.id,
        })
      );
      await Promise.all(notifyPromises);
    } catch (notifyErr) {
      console.error("Failed to send article notifications:", notifyErr);
    }

    // Append to selected reading lists if specified
    if (Array.isArray(readingListIds) && readingListIds.length > 0) {
      for (const listId of readingListIds) {
        try {
          const list = await prisma.readingList.findUnique({
            where: { id: listId }
          });
          if (list) {
            const updatedIds = Array.from(new Set([...list.articleIds, customArticle.id]));
            await prisma.readingList.update({
              where: { id: listId },
              data: { articleIds: updatedIds }
            });
          }
        } catch (listErr) {
          console.error(`Failed to append article to reading list ${listId}:`, listErr);
        }
      }
    }

    return NextResponse.json(customArticle, { status: 201 });
  } catch (error: any) {
    console.error("POST Custom Article API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}