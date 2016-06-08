var express = require('express');
var app = express();
var redis = require('redis')
var osc = require('osc')

var nodeMuse = require ('node-muse');

var OSCm = nodeMuse.osc;

var Muse = nodeMuse.connect().Muse;



var clientFromConnectionString = require ('azure-iot-device-amqp').clientFromConnectionString;
var Message = require('azure-iot-device').Message;


var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser')

var connectionString = 'HostName=EurekaHub.azure-devices.net;DeviceId=NateEEG;SharedAccessKey=uObp+fmqG7Vp5uUmerZdGi6KJ7NRMDmAzPitHRBfv9k=';
var client = clientFromConnectionString(connectionString);

var lastPointTime = Date.now();
var now;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded())
app.use(express.static(__dirname + '/public'));


client.open(function (err) {
	if (err) {
		console.error('Could not connect: ' + err.Message);
	}
	else{
		console.log('IoT Hub has been Connected!');
	}
});

/*function sendConnectionState(state) {
	var message = new Message (state.join(','));
	console.log('Sending message: ' + )


}*/


var udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 5000
});

udpPort.open();

io.on('connection', function (socket) {
    console.log("socket.io connection");
  	socket.emit('news', { hello: 'world' });  
/*
	setInterval(function(){
		var testData = {
			address: "/muse/eeg",
			args: [100, 200, 300, 400]
		}
		socket.emit('news', testData); 
	}, 1000);
*/
  	// Listen for incoming OSC bundles.
	udpPort.on("message", function (oscData) {
		now = Date.now()
		if((now-lastPointTime <= 1000) || (lastPointTime-now <= 1000)) {
			lastPointTime = now
			socket.emit('news', oscData); 
			
		}
	});

});

 /*Muse.on('/muse/eeg', function(){
     console.log('/muse/eeg', JSON.stringify(arguments));
 });*/

var port = Number(process.env.PORT || 3000);
server.listen(port, function() {
  console.log("Listening on " + port);
});
