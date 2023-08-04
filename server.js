const WebSocket = require('ws');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: port });
const public_sessions = new Map();
var all_sessions = [];

public_sessions.set("1","dummy1n");
public_sessions.set("2","dummy2n");
public_sessions.set("3","dummy3n");

function sendPublicSessionInfo(ws){
  const valuesArray = Array.from(public_sessions.values());
  const valuesString = "sessionDatas," + valuesArray.join(', ');

  ws.send(valuesString);
  console.log("Send message:"+valuesString);
}

function sendCompleteSetSettionId(ws){
  const str = "complete,setSettionId";
  ws.send(str);
  
  console.log("Send message:"+str);
}

wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  // クライアントからのメッセージ受信時の処理 
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    try{
      const data = JSON.parse(message);
      all_sessions.push(ws);

      if(data.type=='setSessionId'){
        public_sessions.set(ws,data.sessionId);
        
        //要求者以外にセッション情報を送信する
        all_sessions.forEach(element => {
          if(ws!=element){
            sendPublicSessionInfo(element);
          }
        });
        
        //要求者に完了報告する
        sendCompleteSetSettionId(ws);

      }else if(data.type=='getSessionData'){
        sendPublicSessionInfo(ws);
      }


    } catch(error){
      console.error('Error parsing JSON:', error.message);
    }


    
  });

  // クライアントが切断されたときの処理
  ws.on('close', () => {
    console.log('WebSocket disconnected');
    all_sessions = all_sessions.filter(n => n !== ws);

    if (public_sessions.has(ws)) {
      public_sessions.delete(ws);
    }
    console.log(public_sessions);
  });
});

console.log('WebSocket server started on port '+port);