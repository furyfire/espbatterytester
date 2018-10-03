// Create a client instance
client = new Paho.MQTT.Client(mqtt_url, Math.random().toString(36).substring(20));

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({onSuccess:onConnect});

function set_state(state) {
    console.log("Set state to: ", state);
    message = new Paho.MQTT.Message("state");
    message.destinationName = prefix + device_id + "/measure/state/set";
    client.send(message);
}


$("#state_run").click(function () {
    set_state("run");
});

$("#state_pause").click(function () {
    set_state("pause");
});

$("#state_stop").click(function () {
    set_state("stop");
});




// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  $( "#connection_status" ).text("Connected to MQTT");
  client.subscribe(prefix + device_id + "/#");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("onMessageArrived: "+message.destinationName + "  " + message.payloadString);
    if(message.destinationName === prefix + device_id + "/$online")  {
        if(message.payloadString === "true")
        {
           $( "#device_status" ).text("Online"); 
        }
        else if(message.payloadString === "false")
        {
            $( "#device_status" ).text("Offline");
        } else {
            $( "#device_status" ).text("Unknown");
        }
    }
    
    if(message.destinationName === prefix + device_id + "/measure/state")  {
           $( "#current_state" ).text(message.payloadString); 
    }
    if(message.destinationName === prefix + device_id + "/measure/voltage")  {
           $( "#reading_voltage" ).text(message.payloadString); 
    }
    if(message.destinationName === prefix + device_id + "/measure/current")  {
           $( "#reading_current" ).text(message.payloadString); 
    }
    if(message.destinationName === prefix + device_id + "/measure/capacity")  {
           $( "#reading_capacity" ).text(message.payloadString); 
    }
}