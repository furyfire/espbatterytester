#include "config.h"
#include <Homie.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

Adafruit_INA219 ina219;

const int MEASURE_INTERVAL = 10;

unsigned long lastMeasureSent = 0;
static double accumulated = 0;
static float cutoff_voltage = 0;
HomieNode measureNode("measure", "ina219");
enum {STATE_STOP, STATE_RUN, STATE_PAUSE, STATE_DONE} current_state = STATE_STOP;

bool setStateHandler(const HomieRange& range, const String& value) {
  if (value != "stop" && value != "run" && value != "pause") return false;
  
  Homie.getLogger() << "Got new state: " << value << endl;
  if(value == "run") {
      if(current_state == STATE_STOP)
      {
          accumulated = 0;
      }
      current_state = STATE_RUN;
      measureNode.setProperty("state").send("run");
      digitalWrite(D4, LOW);
  }
  
  if(value == "pause") {
      current_state = STATE_PAUSE;
      measureNode.setProperty("state").send("pause");
      digitalWrite(D4, HIGH);
  }
  
   if(value == "stop") {
      current_state = STATE_STOP;
      measureNode.setProperty("state").send("stop");
      digitalWrite(D4, HIGH);
  }

  return true;
}

bool setCutoffHandler(const HomieRange& range, const String& value) {
  if (value.toFloat() == 0) return false;
  
  Homie.getLogger() << "Got new cutoff voltage: " << value << endl;
  cutoff_voltage = value.toFloat();
  return true;
}

void loopHandler() {
    if (millis() - lastMeasureSent >= MEASURE_INTERVAL * 1000UL || lastMeasureSent == 0) {
        double voltage = ina219.getBusVoltage_V();
        double current = ina219.getCurrent_mA();
        if (current_state == STATE_RUN) {
            accumulated += voltage * current*MEASURE_INTERVAL;
        }

        DynamicJsonBuffer jb;
        JsonObject& obj = jb.createObject();
        obj["voltage"] = String(voltage, 2);
        obj["current"] = String(current, 0);
        obj["charge"] = String(accumulated / 3600, 3);

        String output;
        obj.printTo(output);
        Homie.getLogger() << "New Measurement: " << output << endl;
        
        measureNode.setProperty("measurement").send(output);

        if (voltage < cutoff_voltage) {
            Homie.getLogger() << "Cutoff Reached!" << endl;
            current_state = STATE_STOP;
            measureNode.setProperty("state").send("stop");
            digitalWrite(D4, HIGH);
        }
        lastMeasureSent = millis();

    }
}

void setupHandler() {
    measureNode.setProperty("state").send("stop");
}

void debug_init() {
    Serial.flush();
    Serial.begin(BAUDRATE);
    Serial.flush();
    Serial << endl << endl;
    Serial << F("================================================================================") << endl;
    Serial << F("Firmware: " PROJECT_NAME) << endl;
    Serial << F("Version:  " VERSION_STRING) << endl;
    Serial << F("Built:    " __DATE__ ", " __TIME__) << endl;
    Serial << F("Board:    " ARDUINO_BOARD) << endl;
    Serial << F("================================================================================") << endl;
    Serial << endl << endl;
    Serial.flush();
}

bool relay_init() {
    digitalWrite(D4, HIGH);
    pinMode(D4, OUTPUT);
    return true;
}

bool ina219_init() {
    Wire.begin();
    ina219.begin();
    return true;
}

void modules_init() {
    Serial << F("Init modules:") << endl;
    Serial << F("  • relay_init:  ") << (relay_init() ? "✔" : "✖") << endl;
    Serial << F("  • ina219_init: ") << (ina219_init()? "✔" : "✖") << endl;
}

void setup() {
    debug_init();
    modules_init();

    Homie_setFirmware(PROJECT_NAME, VERSION_STRING);
    Homie.setSetupFunction(setupHandler);
    Homie.setLoopFunction(loopHandler);

    measureNode.advertise("measurement");
    measureNode.advertise("state").settable(setStateHandler);
    measureNode.advertise("cutoff").settable(setCutoffHandler);

    Homie.setup();
}

void loop() {
    Homie.loop();
}
