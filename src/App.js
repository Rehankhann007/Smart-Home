import React, { useState, useRef } from "react";
import { db, ref, set } from "./firebase";
import {
  FaLightbulb,
  FaFan,
  FaTv,
  FaSnowflake,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPlug,
  FaTemperatureHigh,
  FaTshirt,
} from "react-icons/fa";
import "./App.css";

const deviceList = [
  { id: "light_living", name: "living room light", type: "light", room: "Living Room", icon: FaLightbulb },
  { id: "tv_living", name: "living room tv", type: "tv", room: "Living Room", icon: FaTv },
  { id: "light_kitchen", name: "kitchen light", type: "light", room: "Kitchen", icon: FaLightbulb },
  { id: "outlet_kitchen", name: "kitchen outlet", type: "outlet", room: "Kitchen", icon: FaPlug },
  { id: "light_bedroom", name: "bedroom light", type: "light", room: "Bedroom", icon: FaLightbulb },
  { id: "fan_bedroom", name: "bedroom fan", type: "fan", room: "Bedroom", icon: FaFan },
  { id: "thermostat_home", name: "home thermostat", type: "thermostat", room: "Home", icon: FaTemperatureHigh },
  { id: "fridge_kitchen", name: "refrigerator", type: "fridge", room: "Kitchen", icon: FaSnowflake },
  { id: "washer_laundry", name: "washing machine", type: "washing_machine", room: "Laundry Room", icon: FaTshirt },
  { id: "ac_bedroom", name: "bedroom ac", type: "ac", room: "Bedroom", icon: FaSnowflake },
  { id: "ac_living", name: "living room ac", type: "ac", room: "Living Room", icon: FaSnowflake },
];

const rooms = ["All", "Living Room", "Kitchen", "Bedroom", "Home", "Laundry Room"];

function App() {
  const [deviceStates, setDeviceStates] = useState({});
  const [transcript, setTranscript] = useState("Say a command...");
  const [isListening, setIsListening] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("All");

  const recognitionRef = useRef(null);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
  
    // Choose voice (you can specify a more clear voice if you want)
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(voice => voice.lang === 'en-IN'); // You can try other languages like 'en-US'
    utterance.voice = voice || voices[0]; // Default to first available voice
  
    // Adjust pitch and rate for better clarity
    utterance.pitch = 1.5;  // Increase pitch for better clarity
    utterance.rate = 1;     // Default rate, adjust if needed
  
    window.speechSynthesis.speak(utterance);
  };
  

  const startListening = () => {
    if (!recognitionRef.current) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // English + Hindi

      recognition.onresult = (event) => {
        let command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Command:", command);
        setTranscript(command);

        handleVoiceCommand(command);
      };

      recognition.onerror = (err) => {
        console.error("Speech error:", err.error);
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleVoiceCommand = (command) => {
    let matched = false;
    let feedback = "";

    deviceList.forEach((device) => {
      const deviceName = device.name.toLowerCase(); // Jaise "bedroom ac"

      // English matching
      if (
        command.includes(`turn on ${deviceName}`) ||
        command.includes(`switch on ${deviceName}`)
      ) {
        updateDeviceState(device.id, true);
        feedback = `${device.name} turned on`;
        matched = true;
      } else if (
        command.includes(`turn off ${deviceName}`) ||
        command.includes(`switch off ${deviceName}`)
      ) {
        updateDeviceState(device.id, false);
        feedback = `${device.name} turned off`;
        matched = true;
      }

      // Hindi matching (only if English match nahi hua)
      if (!matched) {
        if (
          command.includes(`${deviceName} chalu karo`) ||
          command.includes(`${deviceName} on karo`) ||
          command.includes(`${deviceName} चालू करो`)
        ) {
          updateDeviceState(device.id, true);
          feedback = `${device.name} चालू हो गया`;
          matched = true;
        } else if (
          command.includes(`${deviceName} band karo`) ||
          command.includes(`${deviceName} off karo`) ||
          command.includes(`${deviceName} बंद करो`)
        ) {
          updateDeviceState(device.id, false);
          feedback = `${device.name} बंद हो गया`;
          matched = true;
        }
      }
    });

    // Speak the feedback
    if (feedback) {
      speak(feedback);
    }
  };

  const updateDeviceState = (id, state) => {
    set(ref(db, `/devices/${id}`), state);
    setDeviceStates((prev) => ({ ...prev, [id]: state }));
  };

  const toggleDevice = (id) => {
    const currentState = deviceStates[id] || false;
    updateDeviceState(id, !currentState);
  };

  const filteredDevices = selectedRoom === "All"
    ? deviceList
    : deviceList.filter((device) => device.room === selectedRoom);

  return (
    <div className="container">
      <h1 className="heading">🏠 Home Harmony</h1>

      <div className="room-tabs">
        {rooms.map((room) => (
          <button
            key={room}
            className={`room-button ${selectedRoom === room ? "active" : ""}`}
            onClick={() => setSelectedRoom(room)}
          >
            {room}
          </button>
        ))}
      </div>

      <div className="devices">
        {filteredDevices.map((device) => {
          const Icon = device.icon;
          const isOn = deviceStates[device.id] || false;
          const iconClass =
            device.id.includes("fan") && isOn
              ? "icon-rotate"
              : device.id.includes("light") && isOn
              ? "icon-glow"
              : (device.id.includes("fridge") || device.id.includes("ac")) && isOn
              ? "icon-glowac"
              : device.id.includes("thermostat") && isOn
              ? "icon-glowred"
              : "";

          return (
            <div key={device.id} className={`device-card ${isOn ? "on" : "off"}`} onClick={() => toggleDevice(device.id)}>
              <Icon className={iconClass} size={50} />
              <p>{device.name}</p>
              <p>Status: {isOn ? "ON" : "OFF"}</p>
            </div>
          );
        })}
      </div>

      <div className="transcript-box">
        🎤 You said: <strong>{transcript}</strong>
      </div>

      <div className="mic-controls">
        <button
          className={`mic-button ${isListening ? "active" : ""}`}
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}{" "}
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>

      <p className="command-info">
        Try saying: <em>"Light chalu karo", "Fan band karo", "AC chalu karo", "Refrigerator band karo" etc.</em>
      </p>
    </div>
  );
}

export default App;
