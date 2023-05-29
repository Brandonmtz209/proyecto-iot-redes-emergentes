#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncWebServer.h>
#include "LittleFS.h"
#include <AccelStepper.h>

#define IN1 16
#define IN2 5
#define IN3 4
#define IN4 0
AccelStepper stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);

String message = "";

// Replace with your network credentials
const char* ssid = "esp8266";
const char* password = "qweasdzxc";

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);

// Create a WebSocket object
AsyncWebSocket ws("/ws");

//Variables to save values from HTML form
String direction ="STOP";
String steps;

bool notifyStop = false;

// Initialize LittleFS
void initFS() {
  if (!LittleFS.begin()) {
    Serial.println("Un error ha ocurrido montando LittleFS");
  }
  else{
    Serial.println("LittleFS montado exitosamente");
  }
}

// Initialize WiFi
void initWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println(WiFi.localIP());
}

void notifyClients(String state) {
  ws.textAll(state);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    message = (char*)data;
    steps = message.substring(0, message.indexOf("&"));
    direction = message.substring(message.indexOf("&")+1, message.length());
    Serial.print("steps");
    Serial.println(steps);
    Serial.print("direction");
    Serial.println(direction);
    notifyClients(direction);
    notifyStop = true;
    if (direction == "CW"){
      Serial.print("CW");
      stepper.move(steps.toInt());
    }
    else{
      Serial.print("CCW");
      stepper.move(-steps.toInt());
    }
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      notifyClients(direction);
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      break;
    case WS_EVT_DATA:
        handleWebSocketMessage(arg, data, len);
        break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
     break;
  }
}

void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

void setup() {
  Serial.begin(115200);
  initWiFi();
  initWebSocket();
  initFS();
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(100);

  // Web Server Root URL
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/index.html", "text/html");
  });
  server.serveStatic("/", LittleFS, "/");

  server.begin();
}

void loop() {
  if (stepper.distanceToGo() == 0 && notifyStop == true){  
    direction = "stop";
    notifyClients(direction);
    notifyStop = false;
  }
  ws.cleanupClients();
  stepper.run();
}
