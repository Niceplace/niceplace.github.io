import { serve } from "bun";

const PUBLIC_DIR = "public";

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve index.html at root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file(`${PUBLIC_DIR}/index.html`));
    }

    // Serve CSS files
    if (url.pathname.startsWith("/css/")) {
      return new Response(Bun.file(`${PUBLIC_DIR}${url.pathname}`));
    }

    // Serve dist/scene.js with HMR
    if (url.pathname === "/dist/scene.js") {
      const file = Bun.file("dist/scene.js");
      return new Response(file, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Serve assets (STL files, images, etc.)
    if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/img/") || url.pathname.startsWith("/resume/")) {
      return new Response(Bun.file(`${PUBLIC_DIR}${url.pathname}`));
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    message(ws, message) {
      // Broadcast HMR updates to all connected clients
      serve.publish("hmr", message);
    },
    open(ws) {
      ws.subscribe("hmr");
    },
  },
});

console.log("Dev server running at http://localhost:3000");

// Watch for file changes and rebuild
const buildProcess = Bun.spawn(["bun", "run", "build"], {
  stdout: "inherit",
  stderr: "inherit",
});

// Watch source files for changes
const watcher = Bun.fs.watch("src/scene.ts", async (event) => {
  if (event === "change") {
    console.log("Scene changed, rebuilding...");
    await Bun.$`bun run build`;
    // Notify connected clients to reload
    serve.publish("hmr", "reload");
  }
});
