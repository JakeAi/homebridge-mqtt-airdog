"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamplePlatformAccessory = void 0;
const settings_1 = require("./settings");
const mqtt_1 = require("./mqtt");
const common_1 = require("./common");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class ExamplePlatformAccessory {
    constructor(platform, accessory, log) {
        this.platform = platform;
        this.accessory = accessory;
        this.log = log;
        this.mqtt = new mqtt_1.MQTT('mqtt://47.89.244.17');
        this.powerState = common_1.SwitchState.OFF;
        this.powerState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.fanState = common_1.FanState.AUTO;
        this.fanState$ = new rxjs_1.BehaviorSubject(common_1.FanState.AUTO);
        this.sleepState = common_1.SwitchState.OFF;
        this.sleepState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.lockState = common_1.SwitchState.OFF;
        this.lockState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.pm = 0;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, settings_1.MANUFACTURER)
            .setCharacteristic(this.platform.Characteristic.Model, 'X5')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'X5');
        // get the LightBulb service if it exists, otherwise create a new LightBulb service
        // you can create multiple services for each accessory
        this.airPurifierService = this.accessory.getService(this.platform.Service.AirPurifier) || this.accessory.addService(this.platform.Service.AirPurifier);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.airPurifierService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.setOn.bind(this))
            .on('get', this.getOn.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
            .on('set', this.setOn.bind(this))
            .on('get', this.getOn.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
            .on('set', this.setOn.bind(this))
            .on('get', this.getOn.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
            .on('set', this.setOn.bind(this))
            .on('get', this.getOn.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.Name)
            .on('set', this.setOn.bind(this))
            .on('get', this.getOn.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .on('set', this.setOn.bind(this))
            .on('get', this.getOn.bind(this));
        this.mqtt.register('purifier/server/app/sendPm/' + this.accessory.context.device.deviceId)
            .pipe(operators_1.debounceTime(1000), operators_1.tap(date => console.log({ date })))
            .subscribe((d) => {
            var _a, _b, _c;
            this.powerState = ((_a = d === null || d === void 0 ? void 0 : d.power) === null || _a === void 0 ? void 0 : _a.indexOf('open')) !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.lockState = ((_b = d === null || d === void 0 ? void 0 : d.children) === null || _b === void 0 ? void 0 : _b.indexOf('open')) !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.fanState = ((_c = d === null || d === void 0 ? void 0 : d.speed) === null || _c === void 0 ? void 0 : _c.indexOf('auto')) !== -1 ? common_1.FanState.AUTO : common_1.FanState.LOW;
            this.pm = parseFloat(d === null || d === void 0 ? void 0 : d.pm);
            this.powerState$.next(this.powerState);
            this.lockState$.next(this.lockState);
            this.fanState$.next(this.fanState);
            this.airQualityservice.updateCharacteristic(this.platform.Characteristic.PM2_5Density, this.pm);
            if (this.pm >= 200) {
                this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, 5);
            }
            if (this.pm >= 120 && this.pm < 200) {
                this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, 3);
            }
            if (this.pm >= 65 && this.pm < 120) {
                this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, 2);
            }
            if (this.pm > 0 && this.pm < 65) {
                this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, 1);
            }
            if (this.pm === 0) {
                this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, 0);
            }
        });
        // this.airPurifierService.getCharacteristic(this.platform.Characteristic.Active)
        //   .on('get', this.handleActiveGet.bind(this))
        //   .on('set', this.handleActiveSet.bind(this));
        //
        // this.airPurifierService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
        //   .on('get', this.handleActiveGet.bind(this))
        //   .on('set', this.handleActiveSet.bind(this));
        //
        // this.airPurifierService.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
        //   .on('get', this.handleCurrentAirPurifierStateGet.bind(this));
        //
        // this.airPurifierService.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
        //   .on('get', this.handleTargetAirPurifierStateGet.bind(this))
        //   .on('set', this.handleTargetAirPurifierStateSet.bind(this));
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Lightbulb
        // register handlers for the On/Off Characteristic
        this.airQualityservice = this.accessory.getService(this.platform.Service.AirQualitySensor) || this.accessory.addService(this.platform.Service.AirQualitySensor);
        this.airQualityservice.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);
        this.airQualityservice.getCharacteristic(this.platform.Characteristic.AirQuality)
            .on('get', this.getPm.bind(this));
        this.powerState$
            .subscribe((state) => {
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState, state * 2);
        });
    }
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(value, callback) {
        this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
            deviceNo: this.accessory.context.device.deviceId,
            language: 'en',
            openId: '4CA90DA0',
            order: common_1.Commands.sendPower,
            paramCode: value === common_1.SwitchState.ON ? common_1.PowerState.ON : common_1.PowerState.OFF,
            smartCode: '00',
            productId: '92AD88F0',
        });
        console.log('Set Characteristic On ->', value);
        this.powerState$.next(this.powerState = value * 2);
        // you must call the callback function
        callback(null);
    }
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
    getOn(callback) {
        // implement your own code to check if the device is on
        this.platform.log.debug('Get Characteristic On ->', this.powerState);
        // you must call the callback function
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, this.powerState);
    }
    getPm(callback) {
        this.platform.log.debug('Get Characteristic On ->', this.powerState);
        callback(null, this.pm);
    }
    /**
     * Handle requests to get the current value of the "Active" characteristic
     */
    handleActiveGet(callback) {
        this.log.debug('Triggered GET Active');
        // set this to a valid value for Active
        const currentValue = 1;
        callback(null, currentValue);
    }
    /**
     * Handle requests to set the "Active" characteristic
     */
    handleActiveSet(value, callback) {
        this.log.debug('Triggered SET Active:', value);
        callback(null);
    }
    /**
     * Handle requests to get the current value of the "Current Air Purifier State" characteristic
     */
    handleCurrentAirPurifierStateGet(callback) {
        this.log.debug('Triggered GET CurrentAirPurifierState');
        // set this to a valid value for CurrentAirPurifierState
        const currentValue = 1;
        callback(null, currentValue);
    }
    /**
     * Handle requests to get the current value of the "Target Air Purifier State" characteristic
     */
    handleTargetAirPurifierStateGet(callback) {
        this.log.debug('Triggered GET TargetAirPurifierState');
        // set this to a valid value for TargetAirPurifierState
        const currentValue = 1;
        callback(null, currentValue);
    }
    /**
     * Handle requests to set the "Target Air Purifier State" characteristic
     */
    handleTargetAirPurifierStateSet(value, callback) {
        this.log.debug('Triggered SET TargetAirPurifierState:', value);
        callback(null);
    }
}
exports.ExamplePlatformAccessory = ExamplePlatformAccessory;
//# sourceMappingURL=platformAccessory.js.map