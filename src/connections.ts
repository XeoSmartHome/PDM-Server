const WebSocket = require('ws');

let _wss = null;
export const wsClients: any[] = [];

export const setIo = (io) => {
    _wss = io;
}

export const getIo = () => {
    return _wss;
}

export const broadcastEvent = (event: string, payload) => {
    if(!_wss) {
        return;
    }

    wsClients.forEach(client => {
        client.send(JSON.stringify({type: event, payload}));
    });
}
