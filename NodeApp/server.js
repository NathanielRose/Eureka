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
var eegConcentration = 0.0;
var eegMellow = 0.0
var messagecounter = 0;
var goodEEGstate = false;



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
			messagecounter++;
			}

			if(oscData.address == '/muse/elements/blink')
			{
				blink = oscData.args[0];
				//console.log( 'This is the Blink value', blink);
				messagecounter++
			}

			if(oscData.address == '/muse/elements/jaw_clench'){
				jaw = oscData.args[0];
				//console.log('This is the Jaw value', jaw);
				messagecounter++;
			}

			if(oscData.address == '/muse/elements/alpha_absolute'){
				eegAlpha = oscData.args;
				//console.log('This is the alpha_absolute value', eegAlpha);
				messagecounter++;
			}

			if(oscData.address == '/muse/elements/gamma_absolute'){
				eegGamma = oscData.args;
				//console.log('This is the gamma_absolute value', eegGamma);
				messagecounter++
			}

			if(oscData.address == '/muse/elements/experimental/concentration'){
				eegConcentration = oscData.args[0];
				//console.log('This is the concentration value :', eegConcentration);
				messagecounter++
			}

			if(oscData.address == '/muse/elements/experimental/mellow'){
				eegMellow = oscData.args[0];
				console.log('This is the mellow value :', eegMellow);
				sendEEGData();
				messagecounter =0;
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
			goodEEGstate = true;
			console.log('Detected a good connection', currentHorseShoe)
			eegPadState[0] = currentHorseShoe[0];
			eegPadState[1] = currentHorseShoe[1];
			eegPadState[2] = currentHorseShoe[2];
			eegPadState[3] = currentHorseShoe[3];
		}
		else{
			goodEEGstate = false;
		}
}

function sendEEGData()
{
	if(goodEEGstate)
	{
		var hubMessage = JSON.stringify({alpha_absolute_tp9: eegAlpha[0], alpha_absolute_fp1: eegAlpha[1], 
			alpha_absolute_fp2: eegAlpha[2], alpha_absolute_tp10: eegAlpha[3], gamma_absolute_tp9: eegGamma[0],
		gamma_absolute_fp1: eegGamma[1], gamma_absolute_fp2: eegGamma[2], gamma_absolute_tp10: eegGamma[3],
		horseshoe_tp9: eegPadState[0], horseshoe_fp1: eegPadState[1], horseshoe_fp2: eegPadState[2], horseshoe_tp10:
		eegPadState[3]});

		console.log('This is the hub message :', hubMessage);
		

	}
}

var port = Number(process.env.PORT || 3000);
server.listen(port, function() {
  console.log("Listening on " + port);
});
