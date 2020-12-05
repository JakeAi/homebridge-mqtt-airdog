"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTT = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const rxjs_1 = require("rxjs");
const MQTTPattern = __importStar(require("mqtt-pattern"));
class MQTT {
    constructor(host, port, username, password) {
        this.subscriptions = {};
        this._mqtt = mqtt_1.default.connect(host, {
            username: username,
            password: password,
            port: port,
        });
        this._mqtt.on('message', (topic, message) => this.onMessage({ topic: topic, message: message }));
        this._mqtt.on('error', (error) => console.log(error));
    }
    publish(topic, message) {
        this._mqtt.publish(topic, JSON.stringify(message));
    }
    register(channel) {
        if (this.subscriptions[channel] === undefined) {
            this._mqtt.subscribe(channel);
            this.subscriptions[channel] = new rxjs_1.Subject();
        }
        return this.subscriptions[channel];
    }
    onMessage(mqttMessage) {
        for (let registration in this.subscriptions) {
            if (MQTTPattern.matches(registration, mqttMessage.topic)) {
                let msg = JSON.parse(mqttMessage.message.toString());
                this.subscriptions[registration].next(msg);
            }
        }
    }
}
exports.MQTT = MQTT;
//# sourceMappingURL=mqtt.js.map