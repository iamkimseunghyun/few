import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET \ud658\uacbd \ubcc0\uc218\uac00 \uc124\uc815\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.");
  }

  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("\ud544\uc218 \ud5e4\ub354\uac00 \ub204\ub77d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("\uc6f9\ud6c5 \uac80\uc99d \uc624\ub958:", err);
    return new Response("\uc6f9\ud6c5 \uac80\uc99d \uc2e4\ud328", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, username, image_url, email_addresses, primary_email_address_id } = evt.data;
    
    // Find primary email
    interface EmailAddress {
      id: string;
      email_address: string;
    }
    const primaryEmail = email_addresses?.find(
      (email: EmailAddress) => email.id === primary_email_address_id
    )?.email_address;
    
    const userData = {
      id,
      username: username || `user_${id.slice(-6)}`,
      email: primaryEmail || null,
      imageUrl: image_url || null,
    };

    try {
      if (eventType === "user.created") {
        await db.insert(users).values(userData);
      } else {
        await db
          .update(users)
          .set(userData)
          .where(eq(users.id, id));
      }
    } catch (error) {
      console.error("\ub370\uc774\ud130\ubca0\uc774\uc2a4 \uc791\uc5c5 \uc624\ub958:", error);
      return new Response("\ub370\uc774\ud130\ubca0\uc774\uc2a4 \uc624\ub958", {
        status: 500,
      });
    }
  }

  return new Response("", { status: 200 });
}