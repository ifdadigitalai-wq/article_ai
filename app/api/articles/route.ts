import { NextResponse } from "next/server";
import { ARTICLES } from "../../data/articles";
import { Article } from "../../types";

// Helper to map NewsAPI article items to our Article model
function mapNewsApiArticles(articles: any[], categoryName: string): Article[] {
  const mapped: Article[] = [];
  articles.forEach((item: any) => {
    if (!item.title || item.title === "[Removed]" || !item.description) {
      return;
    }

    // Map category name to standard naming:
    let displayCategory = "International";
    if (categoryName === "technology" || categoryName === "Technology") displayCategory = "Technology";
    else if (categoryName === "science" || categoryName === "Science") displayCategory = "Science";
    else if (categoryName === "business" || categoryName === "Environment") displayCategory = "Environment";

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
        name: item.author || item.source?.name || "Associated Press",
        role: `${item.source?.name || "Staff"} Correspondent`,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80"
      }
    });
  });
  return mapped;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const apiKey = process.env.NEWS_API_KEY;

  // 1. If API Key is missing, search static ARTICLES locally
  if (!apiKey || apiKey.trim() === "") {
    if (q && q.trim() !== "") {
      const filtered = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      return NextResponse.json(filtered);
    }
    return NextResponse.json(ARTICLES);
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

      // Merge and remove duplicate titles
      const merged = [...apiArticles];
      const seenTitles = new Set(apiArticles.map(a => a.title.toLowerCase()));
      localMatching.forEach((art) => {
        if (!seenTitles.has(art.title.toLowerCase())) {
          merged.push(art);
        }
      });

      return NextResponse.json(merged);
    }

    // 3. No query, fetch default front page (headlines)
    const categories = ["technology", "science", "business"];
    const fetchPromises = categories.map(async (cat) => {
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${cat}&pageSize=10&apiKey=${apiKey}`;
      const response = await fetch(url, { next: { revalidate: 300 } });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${cat}`);
      }
      const data = await response.json();
      return { category: cat, articles: data.articles || [] };
    });

    const results = await Promise.all(fetchPromises);
    const apiArticles: Article[] = [];

    results.forEach(({ category, articles }) => {
      const mapped = mapNewsApiArticles(articles, category);
      apiArticles.push(...mapped);
    });

    const merged = [...apiArticles];
    const seenTitles = new Set(apiArticles.map(a => a.title.toLowerCase()));

    ARTICLES.forEach((art) => {
      if (!seenTitles.has(art.title.toLowerCase())) {
        merged.push(art);
      }
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error in articles API:", error);
    // Fall back to static articles if there's any network or parse issue
    if (q && q.trim() !== "") {
      const filtered = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(q.toLowerCase()) ||
        a.content.toLowerCase().includes(q.toLowerCase())
      );
      return NextResponse.json(filtered);
    }
    return NextResponse.json(ARTICLES);
  }
}