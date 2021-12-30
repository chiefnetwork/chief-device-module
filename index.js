var mqtt = require('mqtt')

var client;
var receivers = []
var requests = []
var token = "";
var sendable = false;



function connect(url, _token, callback) {
  token = _token;
  var payload = "type>?device>?token>?" + token;
  var clientOptions =
  {
    username: token,
    will: {
      topic: "device",
      payload: payload,
    },
    clientId: 'device-mqttjs-' + Math.random().toString(16).substr(2, 8)
  }
  client = mqtt.connect(url, clientOptions);
  token = _token;
  client.on('connect', (e) => { console.log("Connected to " + client.options.host) })
  client.on('error', (e) => { console.log("Error : " + e.message) })
  client.on('close', (e) => { console.log("Closed to " + client.options.host); process.exit() })
  client.on('end', (e) => { console.log("end"); console.log(e) })
  client.on('disconnect', (e) => { console.log("Disconnected to " + client.options.host); console.log(e) })

  client.on('message', (topic, p) => {
    console.log("Mesaj Geldi", p.toString())
    var payload = p.toString().split(">?")
    var topicArr = topic.split("/")

    if (payload.some(x => x == "command")) {
      var commandIndex = payload.findIndex(x => x == "command")
      ExecuteCommand(payload[commandIndex + 1])
    };

    if (payload.some(x => x == "responseid")) {
      if (topicArr[topicArr.length - 1] == "request") {
        var responseIdIndex = payload.findIndex(x => x == "responseid")
        var tagIndex = payload.findIndex(x => x == "tag")
        var dataIndex = payload.findIndex(x => x == "data")
  
        var tag = payload[tagIndex + 1];
        var data = payload[dataIndex + 1];
        var responseId = payload[responseIdIndex + 1];
        requests.forEach((value) => {
          if (value.tag == tag) {
            var responseData = value.callback(data)
            sendAbsolute(value.tag, responseData, "api/access/" + responseId)
          }
        })
        
      }
    }
    if (payload.some(x => x == "tag")) {
      var tagIndex = payload.findIndex(x => x == "tag")
      var dataIndex = payload.findIndex(x => x == "data")

      var tag = tagIndex != -1 ? payload[tagIndex + 1] : undefined;
      var data = dataIndex != -1 ? payload[dataIndex + 1] : undefined;

      receivers.forEach((value) => {
        if (value.tag == tag) {
          value.callback(data)
        }
      })
    };
  })

  client.subscribe('device/access/' + token, function (err) {
    if (!err) {

    }
  })
  client.subscribe('device/access/' + token + '/request', function (err) {
    if (!err) {

    }
  })

}

function receive(tag, callback) {
  var receiver = {
    tag: tag,
    callback: callback
  }
  receivers.push(receiver);
}

function request(tag, callback) {
  var request = {
    tag: tag,
    callback: callback
  }
  requests.push(request);
}

module.exports.send = send
module.exports.connect = connect
module.exports.receive = receive
module.exports.request = request

function send(tag, data, topic) {
  if (sendable) {
    var message = createMessage(tag, data);
    console.log("SENDED : " + message)
    client.publish(topic ? topic : 'device/sub/' + token, message)
  }
}
function sendAbsolute(tag, data, topic) {
    var message = createMessage(tag, data);
    console.log("SENDED : " + message)
    client.publish(topic ? topic : 'device/sub/' + token, message)
  
}

function createMessage(tag, data, code, command) {
  var message = "";

  if (tag != undefined) {
    message += "tag>?" + tag + ">?";
  }
  if (data != undefined) {
    message += "data>?" + data + ">?";
  }
  if (code != undefined) {
    message += "data>?" + code + ">?";
  }
  if (code != undefined) {
    message += "data>?" + command + ">?";
  }
  return message
}


function ExecuteCommand(command) {
  switch (command) {
    case "SET_SENDABLE":
      sendable = true;
      console.log("Sendable : " + sendable)
      break;
    case "RESET_SENDABLE":
      sendable = false;
      console.log("Sendable : " + sendable)
      break;
    default:
      break;
  }
}

function ExecuteErrorCode(code) {
  switch (code) {
    case "3000":
      break;
    default:
      break;
  }
}
