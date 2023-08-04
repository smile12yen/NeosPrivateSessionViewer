const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const sessions = new Map();
sessions.set("1","dummy1n");
sessions.set("2","dummy2n");
sessions.set("3","dummy3n");

wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  // クライアントからのメッセージ受信時の処理 
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    try{
      const data = JSON.parse(message);

      if(data.type=='setSessionId'){
        sessions.set(ws,data.sessionId);
        console.log(sessions);
      }else if(data.type=='getSessionData'){
        const valuesArray = Array.from(sessions.values());
        const valuesString = valuesArray.join(', ');

        ws.send(valuesString);
        console.log(valuesString);
      }


    } catch(error){
      console.error('Error parsing JSON:', error.message);
    }


    
  });

  // クライアントが切断されたときの処理
  ws.on('close', () => {
    console.log('WebSocket disconnected');
    sessions.clear(ws);
    console.log(sessions);
  });
});

console.log('WebSocket server started on port 8080');