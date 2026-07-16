import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const clients = new Map<string, WebSocket>();

const server = createServer((req, res) => {
  // Webhook for Next.js to trigger notifications
  if (req.method === "POST" && req.url === "/notify") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { userId, notification } = JSON.parse(body);
        if (!userId || !notification) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing userId or notification" }));
          return;
        }

        console.log(`Received notification trigger for user: ${userId}`);
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(notification));
          console.log(`Sent real-time notification to user: ${userId}`);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, request) => {
  const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
  const userId = url.searchParams.get("userId");

  if (userId) {
    clients.set(userId, ws);
    console.log(`User connected to WS: ${userId}`);
  }

  ws.on("close", () => {
    if (userId) {
      clients.delete(userId);
      console.log(`User disconnected from WS: ${userId}`);
    }
  });
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket/Notification server running on port ${PORT}`);
});
