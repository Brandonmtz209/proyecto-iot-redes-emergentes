var gateway = `ws://${window.location.hostname}/ws`;
var websocket;
window.addEventListener('load', onload);
var direction;

function onload(event) {
  initWebSocket();
}

function initWebSocket() {
  console.log('Trying to open a WebSocket connection…');
  websocket = new WebSocket(gateway);
  websocket.onopen = onOpen;
  websocket.onclose = onClose;
  websocket.onmessage = onMessage;
}

function onOpen(event) {
  console.log('Connection opened');
}

function onClose(event) {
  console.log('Connection closed');
  document.getElementById("estado-de-motor").innerHTML = "motor detenido";
  setTimeout(initWebSocket, 2000);
}

function submitForm() {
  const rbs = document.querySelectorAll('input[name="steps"]');
  var steps = 0;
  for (const rb of rbs) {
    if (rb.checked) {
      steps = rb.value;
      break;
    }
  }

  document.getElementById("estado-de-motor").innerHTML = "motor girando...";
  document.getElementById("estado-de-motor").style.color = "blue";
  document.getElementById("gear").classList.add("spin");
  websocket.send(steps + "&" + "CW");
}

function onMessage(event) {
  console.log(event.data);
  direction = event.data;
  if (direction == "stop") {
    document.getElementById("estado-de-motor").innerHTML = "motor detenido";
    document.getElementById("estado-de-motor").style.color = "red";
    document.getElementById("gear").classList.remove("spin", "spin-back");
  } else if (direction == "CW" || direction == "CCW") {
    document.getElementById("estado-de-motor").innerHTML = "motor girando...";
    document.getElementById("estado-de-motor").style.color = "blue";
    if (direction == "CW") {
      document.getElementById("gear").classList.add("spin");
    } else {
      document.getElementById("gear").classList.add("spin-back");
    }
  }
}

const display = document.getElementById('clock');
const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
audio.loop = true;
let alarmTime = null;
let alarmTimeout = null;
const myList = document.querySelector('#myList');
const addAlarm = document.querySelector('.setAlarm');
const alarmList = [];

function ringing(now) {
    submitForm();
  audio.play();
  alert(`Hey! it is ${now}`);
}

function updateTime() {
  var today = new Date();
  const hour = formatTime(today.getHours());
  const minutes = formatTime(today.getMinutes());
  const seconds = formatTime(today.getSeconds());
  const now = `${hour}:${minutes}:${seconds}`;
  display.innerText = `${hour}:${minutes}:${seconds}`;

  if (alarmList.includes(now)) {
    ringing(now);
  }
}

function formatTime(time) {
  if (time < 10 && time.toString().length != 2) {
    return '0' + time;
  }
  return time;
}

function clearAlarm() {
  audio.pause();
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alert('Alarm cleared');
  }
}

myList.addEventListener('click', e => {
  console.log("removing element");
  if (e.target.classList.contains("deleteAlarm")) {
    e.target.parentElement.remove();
    const value = e.target.value;
    remove(value);
  }
});

function remove(value) {
  let newList = alarmList.filter((time) => time != value);
  alarmList.length = 0;
  alarmList.push(...newList);
  console.log("newList", newList);
  console.log("alarmList", alarmList);
}

function showNewAlarm(newAlarm) {
  const html = `
    <li class="time-list">        
        <span class="time">${newAlarm}</span>
        <button class="deleteAlarm time-control" id="delete-button" onclick="remove(this.value)" value=${newAlarm}>Delete Alarm</button>       
    </li>`;
  myList.innerHTML += html;
}

addAlarm.addEventListener('submit', e => {
  e.preventDefault();
  let new_h = formatTime(addAlarm.a_hour.value);
  if (new_h === '0') {
    new_h = '00';
  }
  let new_m = formatTime(addAlarm.a_min.value);
  if (new_m === '0') {
    new_m = '00';
  }
  let new_s = formatTime(addAlarm.a_sec.value);
  if (new_s === '0') {
    new_s = '00';
  }

  const newAlarm = `${new_h}:${new_m}:${new_s}`;

  if (isNaN(newAlarm)) {
    if (!alarmList.includes(newAlarm)) {
      alarmList.push(newAlarm);
      console.log(alarmList);
      console.log(alarmList.length);
      showNewAlarm(newAlarm);
      addAlarm.reset();
    } else {
      alert(`Alarm for ${newAlarm} already set.`);
    }
  } else {
    alert("Invalid Time Entered");
  }
});

setInterval(updateTime, 1000);
