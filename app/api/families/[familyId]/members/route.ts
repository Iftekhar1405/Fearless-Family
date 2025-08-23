import { NextRequest, NextResponse } from "next/server";

// In-memory storage for family members (replace with your database)
const familyMembers: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;

    // Filter members by family ID
    const members = familyMembers.filter(
      (member) => member.familyId === familyId
    );

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json(
      { error: "Failed to fetch family members" },
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

    const { userId, username } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if member already exists
    const existingMember = familyMembers.find(
      (member) => member.familyId === familyId && member.userId === userId
    );

    if (existingMember) {
      return NextResponse.json(existingMember);
    }

    const newMember = {
      id: Date.now().toString(),
      familyId,
      userId,
      username: username || "Anonymous",
      joinedAt: new Date(),
    };

    familyMembers.push(newMember);

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Failed to create family member" },
      { status: 500 }
    );
  }
}
