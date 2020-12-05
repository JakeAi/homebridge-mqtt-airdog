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
    private sleepState;
    private sleepState$;
    private lockState;
    private lockState$;
    private pm;
    constructor(platform: AirdogPlatform, accessory: DevicePlatformAccessory, log: Logger);
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
    /**
     * Handle requests to get the current value of the "Active" characteristic
     */
    handleActiveGet(callback: any): void;
    /**
     * Handle requests to set the "Active" characteristic
     */
    handleActiveSet(value: any, callback: any): void;
    /**
     * Handle requests to get the current value of the "Current Air Purifier State" characteristic
     */
    handleCurrentAirPurifierStateGet(callback: any): void;
    /**
     * Handle requests to get the current value of the "Target Air Purifier State" characteristic
     */
    handleTargetAirPurifierStateGet(callback: any): void;
    /**
     * Handle requests to set the "Target Air Purifier State" characteristic
     */
    handleTargetAirPurifierStateSet(value: any, callback: any): void;
}
//# sourceMappingURL=platformAccessory.d.ts.map