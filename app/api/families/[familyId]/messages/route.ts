import { NextRequest, NextResponse } from "next/server";

// In-memory storage for messages (replace with your database)
const messages: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;

    // Filter messages by family ID
    const familyMessages = messages.filter((msg) => msg.familyId === familyId);

    return NextResponse.json(familyMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    const body = await request.json();

    const { content, senderId, senderName } = body;

    if (!content || !senderId) {
      return NextResponse.json(
        { error: "Content and senderId are required" },
        { status: 400 }
      );
    }

    const newMessage = {
      id: Date.now().toString(),
      familyId,
      senderId,
      senderName: senderName || "Anonymous",
      content,
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    messages.push(newMessage);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
