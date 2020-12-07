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
    private lockState;
    private lockState$;
    private pm;
    private pm$;
    private airQuality;
    private airQuality$;
    private fanSpeed;
    private fanSpeed$;
    private currentAirPurifierState;
    private currentAirPurifierState$;
    private targetAirPurifierState;
    private targetAirPurifierState$;
    private lockPhysicalControlsService;
    private lockPhysicalControlsState;
    private lockPhysicalControlsState$;
    constructor(platform: AirdogPlatform, accessory: DevicePlatformAccessory, log: Logger);
    getActive(callback: CharacteristicGetCallback): void;
    setActive(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getCurrentAirPurifierState(callback: CharacteristicGetCallback): void;
    setCurrentAirPurifierState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getTargetAirPurifierState(callback: CharacteristicGetCallback): void;
    setTargetAirPurifierState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getLockPhysicalControls(callback: CharacteristicGetCallback): void;
    setLockPhysicalControls(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getAirQuality(callback: CharacteristicGetCallback): void;
    getPM2_5Density(callback: CharacteristicGetCallback): void;
    getSleepSwitchState(callback: CharacteristicGetCallback): void;
    setSleepSwitchState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getRotationSpeed(callback: CharacteristicGetCallback): void;
    setRotationSpeed(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    private setupSubscribers;
    private setupRegisters;
}
//# sourceMappingURL=platformAccessory.d.ts.map