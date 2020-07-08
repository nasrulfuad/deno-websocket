import { serve } from "https://deno.land/std/http/server.ts";
import { acceptWebSocket, acceptable } from "https://deno.land/std/ws/mod.ts";
import { handleWebsocket } from "./WebSocket/index.ts";

const port = Deno.args[0] || "8081";

async function main() {
    console.log(`websocket server is running on : http://localhost:${port}`);
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

main();
