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

//The following are a list of the passed data variables to the cloud hub
var eegPadState = [ 4, 4, 4, 4];
var blink = false;
var jaw = false;
var eegAlpha = [0.0, 0.0, 0.0, 0.0];
var eegGamma = [0.0, 0.0, 0.0, 0.0];



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

			if(oscData.address == '/muse/elements/horseshoe') {
			//console.log('This is the value', oscData.args );
			setHorseshoe(oscData.args);
			}

			if(oscData.address == '/muse/elements/blink')
			{
				blink = oscData.args[0];
				//console.log( 'This is the Blink value', blink);
				
			}

			if(oscData.address == '/muse/elements/jaw_clench'){
				jaw = oscData.args[0];
				//console.log('This is the Jaw value', jaw);
			}

			if(oscData.address == '/muse/elements/alpha_absolute'){
				//eegAlpha = oscData.args;
				console.log('This is the alpha_absolute value', eegAlpha);
			}

			
			

		}
	});

	/*udpPort.on('/muse/eeg', function(oscdata) {
			console.log('This is the current state of 0 arg :', oscdata);

	});*/

});

function setHorseshoe(horseData) {
	var currentHorseShoe = horseData;
	if (currentHorseShoe[0]!== 4 && currentHorseShoe[1] !== 4
		&& currentHorseShoe[2] !== 4 && currentHorseShoe[3] !== 4)
		{
			console.log('Detected a good connection', currentHorseShoe)
			eegPadState[0] = currentHorseShoe[0];
			eegPadState[1] = currentHorseShoe[1];
			eegPadState[2] = currentHorseShoe[2];
			eegPadState[3] = currentHorseShoe[3];
		}
}

var port = Number(process.env.PORT || 3000);
server.listen(port, function() {
  console.log("Listening on " + port);
});
