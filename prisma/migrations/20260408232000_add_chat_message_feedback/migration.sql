-- CreateTable
CREATE TABLE "ChatMessageFeedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "language" TEXT,
    "recommendation_country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessageFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessageFeedback_message_id_key" ON "ChatMessageFeedback"("message_id");

-- CreateIndex
CREATE INDEX "ChatMessageFeedback_user_id_created_at_idx" ON "ChatMessageFeedback"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ChatMessageFeedback_conversation_id_created_at_idx" ON "ChatMessageFeedback"("conversation_id", "created_at");
