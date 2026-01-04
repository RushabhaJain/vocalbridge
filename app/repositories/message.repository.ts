import { prisma } from "@/app/lib/prisma";
import { IMessageRepository } from "./interfaces";

export class MessageRepository implements IMessageRepository {
  async findBySession(sessionId: string) {
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
    return messages;
  }

  async create(data: {
    sessionId: string;
    role: string;
    content: string;
    metadata?: string;
  }) {
    const message = await prisma.message.create({
      data: {
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        metadata: data.metadata || "{}",
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
    return message;
  }
}

