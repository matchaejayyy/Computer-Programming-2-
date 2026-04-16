import { neonAuth } from "@/lib/services/auth/neon-server";

export const { GET, POST } = neonAuth.handler();
