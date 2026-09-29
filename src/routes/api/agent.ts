import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleAgent } = await import("@/lib/agent.server");
        return handleAgent(request);
      },
    },
  },
});
