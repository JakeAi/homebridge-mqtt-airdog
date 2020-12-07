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
        this.sleepSwitchState = common_1.SwitchState.OFF;
        this.sleepSwitchState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.lockSwitchState = common_1.SwitchState.OFF;
        this.lockSwitchState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.lockState = common_1.SwitchState.OFF;
        this.lockState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.pm = 0;
        this.pm$ = new rxjs_1.BehaviorSubject(0);
        this.airQuality = 0;
        this.airQuality$ = new rxjs_1.BehaviorSubject(0);
        this.fanSpeed = 0;
        this.fanSpeed$ = new rxjs_1.BehaviorSubject('speed auto');
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, settings_1.MANUFACTURER)
            .setCharacteristic(this.platform.Characteristic.Model, 'X5')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'X5');
        // get the LightBulb service if it exists, otherwise create a new LightBulb service
        // you can create multiple services for each accessory
        this.airPurifierService = this.accessory.getService(this.platform.Service.AirPurifier) || this.accessory.addService(this.platform.Service.AirPurifier);
        this.sleepSwitchService = this.accessory.getServiceById(this.platform.Service.Switch, 'Sleep');
        if (!this.sleepSwitchService) {
            this.sleepSwitchService = new this.platform.Service.Switch('SleepSwitch', 'Sleep');
            if (this.sleepSwitchService) {
                this.sleepSwitchService = this.accessory.addService(this.sleepSwitchService);
                console.log('New Open Switch Service');
            }
            else {
                console.log('New Open Switch Service -- Failed!');
            }
        }
        this.lockSwitchService = this.accessory.getServiceById(this.platform.Service.Switch, 'Lock');
        if (!this.lockSwitchService) {
            this.lockSwitchService = new this.platform.Service.Switch('LockSwitch', 'Lock');
            if (this.lockSwitchService) {
                this.lockSwitchService = this.accessory.addService(this.lockSwitchService);
                console.log('New Open Switch Service');
            }
            else {
                console.log('New Open Switch Service -- Failed!');
            }
        }
        // create handlers for required characteristics
        this.sleepSwitchService.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.getSleepSwitchState.bind(this))
            .on('set', this.setSleepSwitchState.bind(this));
        this.lockSwitchService.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.getLockSwitchState.bind(this))
            .on('set', this.setLockSwitchState.bind(this));
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
            .setProps({
            maxValue: 4,
            minValue: 0,
            minStep: 1,
        })
            .on('set', this.setRotationSpeed.bind(this))
            .on('get', this.getRotationSpeed.bind(this));
        this.mqtt.register('purifier/server/app/sendPm/' + this.accessory.context.device.deviceId)
            .pipe(operators_1.debounceTime(3000), operators_1.tap(date => console.log({ date })))
            .subscribe((d) => {
            this.powerState = (d.power || '').indexOf('open') !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.lockState = (d.children || '').indexOf('open') !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.fanState = (d.speed || '').indexOf('auto') !== -1 ? common_1.FanState.AUTO : common_1.FanState.LOW;
            this.fanSpeed$.next(d === null || d === void 0 ? void 0 : d.speed);
            this.powerState$.next(this.powerState);
            this.lockState$.next(this.lockState);
            this.fanState$.next(this.fanState);
            this.pm$.next(parseFloat(d === null || d === void 0 ? void 0 : d.pm));
        });
        this.airQualityservice = this.accessory.getService(this.platform.Service.AirQualitySensor) || this.accessory.addService(this.platform.Service.AirQualitySensor);
        this.airQualityservice.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);
        this.airQualityservice.getCharacteristic(this.platform.Characteristic.AirQuality)
            .on('get', this.getAirQuality.bind(this));
        this.airQualityservice.getCharacteristic(this.platform.Characteristic.PM2_5Density)
            .on('get', this.getPm.bind(this));
        this.powerState$
            .subscribe((state) => {
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState, state * 2);
        });
        this.fanSpeed$
            .subscribe((state) => {
            if (state.indexOf('one') !== -1) {
                this.fanSpeed = 0;
            }
            if (state.indexOf('two') !== -1) {
                this.fanSpeed = 1;
            }
            if (state.indexOf('three') !== -1) {
                this.fanSpeed = 2;
            }
            if (state.indexOf('four') !== -1) {
                this.fanSpeed = 3;
            }
            this.fanSpeed = 0;
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.fanSpeed);
        });
        this.pm$
            .subscribe((pm) => {
            let airQualityLevel = 0;
            if (pm >= 200) {
                airQualityLevel = 5;
            }
            if (pm >= 120 && pm < 200) {
                airQualityLevel = 3;
            }
            if (pm >= 65 && pm < 120) {
                airQualityLevel = 2;
            }
            if (pm > 0 && pm < 65) {
                airQualityLevel = 1;
            }
            if (pm === 0) {
                airQualityLevel = 0;
            }
            this.airQuality = airQualityLevel;
            this.pm = pm;
            this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, this.airQuality);
            this.airQualityservice.updateCharacteristic(this.platform.Characteristic.PM2_5Density, this.pm);
        });
    }
    getLockSwitchState(callback) { return callback(null, this.lockSwitchState); }
    setLockSwitchState(value, callback) { }
    getSleepSwitchState(callback) { return callback(null, this.sleepSwitchState); }
    setSleepSwitchState(value, callback) { }
    getRotationSpeed(callback) {
        callback(null, this.fanSpeed);
    }
    setRotationSpeed(value, callback) {
        let fanState;
        if (value === 0) {
            fanState = common_1.FanState.LOW;
        }
        if (value === 1) {
            fanState = common_1.FanState.MED;
        }
        if (value === 2) {
            fanState = common_1.FanState.HIGH;
        }
        if (value === 3) {
            fanState = common_1.FanState.MAX;
        }
        console.log('Set Characteristic RotationSpeed ->', value);
        this.mqtt.publish('purifier/app/changeSpeed/1058' + this.platform.userNo, {
            deviceNo: this.accessory.context.device.deviceId,
            language: this.platform.language,
            openId: this.accessory.context.device.factoryId,
            order: common_1.Commands.sendSpeed,
            paramCode: fanState,
            smartCode: '00',
            productId: this.accessory.context.device.productId,
        });
        this.powerState$.next(this.powerState = value * 2);
        // you must call the callback function
        callback(null);
    }
    getAirQuality(callback) {
        callback(null, this.airQuality);
    }
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(value, callback) {
        if (this.powerState && value && this.airPurifierService.getCharacteristic(this.platform.Characteristic.Active).value) {
            return callback();
        }
        console.log('Set Characteristic On ->', value);
        this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
            deviceNo: this.accessory.context.device.deviceId,
            language: this.platform.language,
            openId: this.accessory.context.device.factoryId,
            order: common_1.Commands.sendPower,
            paramCode: value === common_1.SwitchState.ON ? common_1.PowerState.ON : common_1.PowerState.OFF,
            smartCode: '00',
            productId: this.accessory.context.device.productId,
        });
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
        callback(null, this.powerState * 2);
    }
    getPm(callback) {
        this.platform.log.debug('Get Characteristic On ->', this.powerState);
        callback(null, this.pm);
    }
}
exports.ExamplePlatformAccessory = ExamplePlatformAccessory;
//# sourceMappingURL=platformAccessory.js.map