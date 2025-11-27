const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello World from Bun!");
  },
});

console.log(`🚀 Bun server running at http://localhost:${server.port}`);
