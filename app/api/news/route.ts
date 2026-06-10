import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") as Sport | null;
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const news = await prisma.news.findMany({
    where: { ...(sport && { sport }) },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      imageUrl: true, sport: true, source: true, publishedAt: true,
    },
  });

  return NextResponse.json(news);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const article = await prisma.news.create({
    data: {
      title:    body.title,
      slug:     body.slug,
      excerpt:  body.excerpt,
      content:  body.content,
      imageUrl: body.imageUrl,
      sport:    body.sport,
      source:   body.source,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
