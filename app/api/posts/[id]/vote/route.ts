import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseBody, voteSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

// POST /api/posts/[id]/vote  body: { optionIndex: number }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(voteSchema, body);
  if (!parsed.success) return parsed.response;
  const { optionIndex } = parsed.data;

  try {
    // Check if already voted
    const existing = await prisma.postVote.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }

    // Get the current post to update poll votes
    const post = await prisma.post.findUnique({ where: { id }, select: { poll: true } });
    if (!post?.poll) {
      return NextResponse.json({ error: "Post has no poll" }, { status: 400 });
    }

    const poll = post.poll as { options: string[]; votes: number[] };
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return NextResponse.json({ error: "Invalid option index" }, { status: 400 });
    }

    // Increment the vote count for the selected option
    const updatedVotes = [...poll.votes];
    updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;
    const updatedPoll = { ...poll, votes: updatedVotes };

    // Create vote record and update poll in a transaction
    await prisma.$transaction([
      prisma.postVote.create({ data: { postId: id, userId: user.id, optionIndex } }),
      prisma.post.update({ where: { id }, data: { poll: updatedPoll } }),
    ]);

    return NextResponse.json({ poll: updatedPoll, voted_option: optionIndex });
  } catch (err) {
    logger.error("post vote failed", { postId: id, error: String(err) });
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
