"use server";

import { redirect } from "next/navigation";
import { findProtocol } from "@/lib/protocols";

export async function searchProtocol(formData: FormData) {
  const query = formData.get("query") as string;

  if (!query || query.trim() === "") {
    redirect("/?error=no-match");
  }

  const protocol = findProtocol(query);

  if (protocol) {
    redirect(`/protocol/${protocol.id}`);
  } else {
    redirect("/?error=no-match");
  }
}
