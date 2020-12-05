import mqtt, { MqttClient } from 'mqtt';
import { Subject } from 'rxjs';
import * as MQTTPattern from 'mqtt-pattern';

export interface MqttMessage<T = any> {
  topic: string;
  message: T;
}

export class MQTT {
  public subscriptions: { [x: string]: Subject<any> } = {};
  private _mqtt: MqttClient;

  constructor(host: string, port?: number, username?: string, password?: string) {
    this._mqtt = mqtt.connect(host, {
      username: username,
      password: password,
      port: port,
    });

    this._mqtt.on('message', (topic, message) => this.onMessage({ topic: topic, message: message }));
    this._mqtt.on('error', (error) => console.log(error));
  }

  publish(topic: MqttMessage['topic'], message: MqttMessage['message']): any {
    this._mqtt.publish(topic, JSON.stringify(message));
  }

  register<T>(channel: string): Subject<T> {
    if (this.subscriptions[channel] === undefined) {
      this._mqtt.subscribe(channel);
      this.subscriptions[channel] = new Subject<T>();
    }
    return this.subscriptions[channel];
  }


  private onMessage(mqttMessage: MqttMessage) {
    for (let registration in this.subscriptions) {
      if (MQTTPattern.matches(registration, mqttMessage.topic)) {
        let msg = JSON.parse(mqttMessage.message.toString());
        this.subscriptions[registration].next(msg);
      }
    }
  }
}
