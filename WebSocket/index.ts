import {
    isWebSocketCloseEvent,
    WebSocket,
} from "https://deno.land/std/ws/mod.ts";
interface Connection {
    name: string;
    ws: WebSocket;
}

const connections = new Array<Connection>();
export async function handleWebsocket(ws: WebSocket) {
    for await (const event of ws) {
        console.log(event);
        if (typeof event === "string") {
            const data = JSON.parse(event);
            if (data.type === "register") {
                connections.push({ name: data.name, ws });
                const ev = JSON.stringify({
                    type: "join",
                    message: { name: data.name },
                });
                const onlineUsers = JSON.stringify({
                    type: "online",
                    message: {
                        users: connections.map((connection) => connection.name),
                    },
                });
                ws.send(onlineUsers);
                broadcastEvents(ws, ev);
            } else {
                broadcastEvents(ws, event);
            }
        }
        if (isWebSocketCloseEvent(event)) {
            handleClose(ws, connections);
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

function handleClose(ws: WebSocket, connections: Array<Connection>) {
    console.log("Websocket closed");
    const currentConn = connections.filter((connection) => connection.ws == ws);
    if (currentConn) {
        const data = JSON.stringify({
            type: "left",
            message: { name: currentConn[0].name },
        });
        broadcastEvents(ws, data);
    }
    connections.splice(connections.indexOf(currentConn[0]), 1);
}
