import { serve } from "https://deno.land/std/http/server.ts";
import {
    acceptWebSocket,
    isWebSocketCloseEvent,
    isWebSocketPingEvent,
    WebSocket,
} from "https://deno.land/std/ws/mod.ts";

async function handleWs(sock: WebSocket) {
    console.log("socket connected!");
    try {
        for await (const ev of sock) {
            if (typeof ev === "string") {
                // text message
                console.log("ws:Text", ev);
                await sock.send(ev);
            } else if (ev instanceof Uint8Array) {
                // binary message
                console.log("ws:Binary", ev);
            } else if (isWebSocketPingEvent(ev)) {
                const [, body] = ev;
                // ping
                console.log("ws:Ping", body);
            } else if (isWebSocketCloseEvent(ev)) {
                // close
                const { code, reason } = ev;
                console.log("ws:Close", code, reason);
            }
        }
    } catch (err) {
        console.error(`failed to receive frame: ${err}`);

        if (!sock.isClosed) {
            await sock.close(1000).catch(console.error);
        }
    }
}

const port = Deno.args[0] || "8080";
async function main() {
    console.log(`websocket server is running on :${port}`);
    for await (const req of serve(`:${port}`)) {
        const { conn, r: bufReader, w: bufWriter, headers } = req;
        acceptWebSocket({
            conn,
            bufReader,
            bufWriter,
            headers,
        })
            .then(
                async (ws: WebSocket): Promise<void> => {
                    console.log("Connection to websocket stablished");
                    for await (const event of ws) {
                        console.log(event);
                    }
                }
            )
            .catch(async (err) => {
                console.error(`failed to accept websocket: ${err}`);
                await req.respond({ status: 400 });
            });
    }
}
main();
