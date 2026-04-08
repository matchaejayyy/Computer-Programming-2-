import { neonAuth } from "@/lib/auth/neon-server";

export const { GET, POST } = neonAuth.handler();
