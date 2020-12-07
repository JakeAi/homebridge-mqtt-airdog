import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, Logger } from 'homebridge';
import { AirdogPlatform, DevicePlatformAccessory } from './platform';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class ExamplePlatformAccessory {
    private platform;
    private accessory;
    readonly log: Logger;
    private airPurifierService;
    private airQualityservice;
    private mqtt;
    private powerState;
    private powerState$;
    private fanState;
    private fanState$;
    private sleepSwitchService;
    private sleepSwitchState;
    private sleepSwitchState$;
    private lockSwitchService;
    private lockSwitchState;
    private lockSwitchState$;
    private lockState;
    private lockState$;
    private pm;
    private pm$;
    private airQuality;
    private airQuality$;
    private fanSpeed;
    private fanSpeed$;
    constructor(platform: AirdogPlatform, accessory: DevicePlatformAccessory, log: Logger);
    getLockSwitchState(callback: CharacteristicGetCallback): void;
    setLockSwitchState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getSleepSwitchState(callback: CharacteristicGetCallback): void;
    setSleepSwitchState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getRotationSpeed(callback: CharacteristicGetCallback): void;
    setRotationSpeed(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getAirQuality(callback: CharacteristicGetCallback): void;
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    /**
     * Handle the "GET" requests from HomeKit
     * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * If your device takes time to respond you should update the status of your device
     * asynchronously instead using the `updateCharacteristic` method instead.
  
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    getOn(callback: CharacteristicGetCallback): void;
    getPm(callback: CharacteristicGetCallback): void;
}
//# sourceMappingURL=platformAccessory.d.ts.map