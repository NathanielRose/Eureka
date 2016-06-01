var nodeMuse = require('node-muse');
var OSC = nodeMuse.OSC;
var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var Muse = nodeMuse.connect().Muse;
var connectionString = 'HostName=Project-Eureka-IoT-Hub.azure-devices.net;DeviceId=EurekaPi;SharedAccessKey=bRLA01/9lysbaq4rx3CsF5CoqtOeOLArtiVjNQHHZMQ=';
//var connectionString = 'HostName=Project-Eureka-IoT-Hub.azure-devices.net;DeviceId=musedevice;SharedAccessKey=+43sYOE3grbS9AEEL0o37NV7bdKmhMjSJm6GQVFQLME=';
var client = clientFromConnectionString(connectionString);
client.open(function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('IoT Hub connected');
  }
});
var connectionState = [4, 4, 4, 4, 4];
var blinked = false;
// Muse.on('/muse/elements/blink', function(data) {
//  if(data.values === 0) {
//      blinked = false;
//  }
//  if(data.values === 1 && !blinked) {
//      blinked = true;
//      console.log('BLINK!');
//  }
// });
Muse.on('/muse/elements/horseshoe', function(data) {
    var currentState = data.values;
    if(currentState[0] !== connectionState[0]
        || currentState[1] !== connectionState[1]
        || currentState[2] !== connectionState[2]
        || currentState[3] !== connectionState[3]) {
        connectionState[0] = currentState[0];
        connectionState[1] = currentState[1];
        connectionState[2] = currentState[2];
        connectionState[3] = currentState[3];
        sendConnectionState(connectionState);
    }
});
function sendConnectionState(state) {
  var message = new Message(state.join(','));
  console.log('Sending message: ' + message.getData());
  client.sendEvent(message, printResultFor('send'));
}
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    } else {
      console.log(op + ' status: ', res);
    }
  };
}
Muse.on('/muse/elements/experimental/mellow', function(data) {
    var mellowState = 3;
    if(data.values < 0.6) {
        mellowState = 3;
    } else if(data.values < 0.8) {
        mellowState = 2;
    } else {
        mellowState = 1;
    }
    if(mellowState !== connectionState[4]) {
        connectionState[4] = mellowState;
        sendConnectionState(connectionState);
    }
});
// Muse.on('/muse/eeg', function(){
//     console.log('/muse/eeg', JSON.stringify(arguments));
// });