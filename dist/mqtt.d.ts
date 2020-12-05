import { Subject } from 'rxjs';
export interface MqttMessage<T = any> {
    topic: string;
    message: T;
}
export declare class MQTT {
    subscriptions: {
        [x: string]: Subject<any>;
    };
    private _mqtt;
    constructor(host: string, port?: number, username?: string, password?: string);
    publish(topic: MqttMessage['topic'], message: MqttMessage['message']): any;
    register<T>(channel: string): Subject<T>;
    private onMessage;
}
//# sourceMappingURL=mqtt.d.ts.map