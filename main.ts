import { serve } from "https://deno.land/std/http/server.ts";
import {
    acceptWebSocket,
    isWebSocketCloseEvent,
    acceptable,
    WebSocket,
} from "https://deno.land/std/ws/mod.ts";

const port = Deno.args[0] || "8080";
const connections = new Array<WebSocket>();

async function main() {
    console.log(`websocket server is running on :${port}`);
    for await (const req of serve(`:${port}`)) {
        if (acceptable(req)) {
            const { conn, r: bufReader, w: bufWriter, headers } = req;
            acceptWebSocket({
                conn,
                bufReader,
                bufWriter,
                headers,
            }).then(handleWebsocket);
        } else {
            const { method, url } = req;
            if (method === "GET" && url === "/") {
                req.respond({
                    headers: new Headers({
                        "content-type": "text/html",
                    }),
                    body: await Deno.open("./index.html"),
                });
            } else {
                req.respond({ body: "Not Found", status: 404 });
            }
        }
    }
}

async function handleWebsocket(ws: WebSocket) {
    connections.push(ws);
    console.log("Connection to websocket stablished");
    for await (const event of ws) {
        console.log(event);
        if (typeof event === "string") {
            broadcastEvents(ws, event);
        }
        if (isWebSocketCloseEvent(event)) {
            console.log("Websocket closed");
        }
    }
}

function broadcastEvents(ws: WebSocket, event: string) {
    for (const webSocket of connections) {
        if (webSocket !== ws) {
            webSocket.send(event);
        }
    }
}
main();
