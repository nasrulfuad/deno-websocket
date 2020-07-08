import { serve } from "https://deno.land/std/http/server.ts";
import {
    acceptWebSocket,
    isWebSocketCloseEvent,
    acceptable,
    WebSocket,
} from "https://deno.land/std/ws/mod.ts";

const port = Deno.args[0] || "8080";
const connections = new Array<{ name: string; ws: WebSocket }>();

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
    console.log("Someone connected to websocket");
    for await (const event of ws) {
        console.log(event);
        if (typeof event === "string") {
            const data = JSON.parse(event);
            if (data.type === "register") {
                connections.push({ name: data.name, ws });
                ws.send(`${data.name}, you are registered!`);
            } else {
                broadcastEvents(ws, event);
            }
        }
        if (isWebSocketCloseEvent(event)) {
            console.log("Websocket closed");
        }
    }
}

function broadcastEvents(ws: WebSocket, event: string) {
    for (const connection of connections) {
        if (connection.ws !== ws) {
            connection.ws.send(event);
        }
    }
}
main();
