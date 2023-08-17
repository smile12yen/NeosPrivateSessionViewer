const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: port });
const public_sessions = new Map();
const all_sessions = new Set();

/*
public_sessions.set("1","dummy1n");
public_sessions.set("2","dummy2n");
public_sessions.set("3","dummy3n");
*/

function sendPublicSessionInfo(ws){
  const valuesArray = Array.from(public_sessions.values());
  
  const strs = new Set();
  valuesArray.forEach(element => {
    var new_worldName="";
    if(element.has('worldName') && element.get('worldName')!=""){
      new_worldName = element.worldName+"("+element.hostName+")";
    }else{
      new_worldName = "ワールド名未設定 ("+element.hostName+")";
    }

    var new_worldDiscription="";
    if(element.has('discription')  && element.get('discription')!=""){
      new_worldDiscription = element.discription;
    }else{
      new_worldDiscription="ワールド説明文がありません";
    }

    strs.add("{"+element.sessionId+","+new_worldName+","+element.discription+","+element.hostName+","+element.activePlayerCount+"}");
  });
  const strsArray = Array.from(strs);

  const valuesString = ("sessionDatas," + strsArray.join(', ')).replace(/[\s\n]/g, '');

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
      all_sessions.add(ws);

      if(data.type=='setSessionId'){
        public_sessions.set(ws,data.content);
        
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
    console.log('WebSocket disconnected. try delete session 10 second lator');
    

    // セッションリストからの削除を10秒後に予約
    sessionTimeoutId = setTimeout(() => {
      if (public_sessions.has(ws)) {
        public_sessions.delete(ws);
      }
      if(all_sessions.has(ws)){
        all_sessions.delete(ws);
      }
      console.log("delete session:"+public_sessions);
    }, 10000); // 10秒後に実行

    // タイムアウトが不要になった場合はクリアする
    // 例: セッションが再接続された場合
    ws.on('message', (message) => {
      // メッセージ受信時にセッションのタイムアウトをクリア
      clearTimeout(sessionTimeoutId);
      console.log("cancel delete session:"+public_sessions);
    });
  });
});

console.log('WebSocket server started on port '+port);