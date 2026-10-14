// ログインの仕組み（Better Auth）の受付窓口。/api/auth/... へのアクセスをすべてここで受ける
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
