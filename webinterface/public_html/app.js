var ctx = document.getElementById("chart_voltage").getContext('2d');
var chart = new Chart(ctx, {"type": "line", "data": {"labels": [], "datasets": [{"label": "Voltage", "data": [], "fill": false, "borderColor": "rgb(75, 192, 192)", "lineTension": 0.1}]}, "options": {}});
function addDataChart(chart,  label, data) {
    if(pause_measurements) return;
    chart.data.labels.push(label.toUTCString());
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

var pause_measurements = true;
counter = 1;
function addDataTable( label, voltage, current, charge) {
    if(pause_measurements) return;
        var markup = "<tr>"
        markup += "<th scope='row'>"+counter+"</th>";
        markup +="<td>"+label.toUTCString()+"</td>";
        markup += "<td>"+voltage+ " V</td>";
        markup += "<td>"+current+ " mA</td>";
        markup += "<td>"+charge+ " Wh</td>";
        markup += "</tr>";
        $("#table_voltage tbody").append(markup);
        counter += 1;
}

// Create a client instance
var client = new Paho.MQTT.Client(mqtt_url, Math.random().toString(36).substring(20));

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
// connect the client
client.connect({onSuccess:onConnect});

function set_state(state) {
    console.log("Set state to: ", state);
    message = new Paho.MQTT.Message(state);
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


$('.nstSlider').nstSlider({
    "left_grip_selector": ".leftGrip",
    "value_changed_callback": function(cause, leftValue, rightValue) {
        $(this).parent().find('.leftLabel').text((leftValue/10));
        try {
            message = new Paho.MQTT.Message(String(leftValue/10));
            message.destinationName = prefix + device_id + "/measure/cutoff/set";
            message.retained = true;
            client.send(message);
            console.log("Sending new cutoff voltage",leftValue/10);
        } catch(err) {}
    }
});


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  $( "#connection_status" ).text("Connected to MQTT");
  client.subscribe(prefix + device_id + "/+");
  client.subscribe(prefix + device_id + "/+/+");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  $( "#connection_status" ).text("Conenction lost");
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
           if(message.payloadString === "run") {
               pause_measurements = false;
           } else {
               pause_measurements = true;
           }
    }

    if(message.destinationName === prefix + device_id + "/measure/cutoff/set")  {
        $("#nstSlider").attr( "data-cur_min", (message.payloadString*10));
    }
    
    if(message.destinationName === prefix + device_id + "/measure/measurement")  {
        var obj = JSON.parse(message.payloadString);
           $( "#reading_voltage" ).text(obj.voltage);
           $( "#reading_current" ).text(obj.current);
           $( "#reading_capacity" ).text(obj.charge);
           addDataChart(chart, new Date(), obj.voltage);
           addDataTable(new Date(), obj.voltage, obj.current, obj.charge);
    }
}


