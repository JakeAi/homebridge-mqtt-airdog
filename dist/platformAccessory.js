"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamplePlatformAccessory = void 0;
const settings_1 = require("./settings");
const mqtt_1 = require("./mqtt");
const common_1 = require("./common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
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
        this.pm = 0;
        this.pm$ = new rxjs_1.BehaviorSubject(0);
        this.airQuality = 0;
        this.airQuality$ = new rxjs_1.BehaviorSubject(0);
        this.fanSpeed = 0;
        this.fanSpeed$ = new rxjs_1.BehaviorSubject('speed auto');
        this.currentAirPurifierState = 0;
        this.currentAirPurifierState$ = new rxjs_1.BehaviorSubject('speed auto');
        this.targetAirPurifierState = 0;
        this.targetAirPurifierState$ = new rxjs_1.BehaviorSubject(0);
        this.lockPhysicalControlsState = common_1.SwitchState.OFF;
        this.lockPhysicalControlsState$ = new rxjs_1.BehaviorSubject(common_1.SwitchState.OFF);
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, settings_1.MANUFACTURER)
            .setCharacteristic(this.platform.Characteristic.Model, 'X5')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'X5');
        this.airPurifierService = this.accessory.getService(this.platform.Service.AirPurifier) || this.accessory.addService(this.platform.Service.AirPurifier);
        this.sleepSwitchService = this.accessory.getServiceById(this.platform.Service.Switch, 'Sleep');
        if (!this.sleepSwitchService) {
            this.sleepSwitchService = new this.platform.Service.Switch('Sleep', 'Sleep');
            this.sleepSwitchService = this.accessory.addService(this.sleepSwitchService);
        }
        this.lockPhysicalControlsService = this.accessory.getServiceById(this.platform.Service.Switch, 'Lock');
        if (!this.lockPhysicalControlsService) {
            this.lockPhysicalControlsService = new this.platform.Service.Switch('Lock', 'Lock');
            this.lockPhysicalControlsService = this.accessory.addService(this.lockPhysicalControlsService);
        }
        // create handlers for required characteristics
        this.sleepSwitchService.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.getSleepSwitchState.bind(this))
            .on('set', this.setSleepSwitchState.bind(this));
        this.lockPhysicalControlsService.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.getLockPhysicalControls.bind(this))
            .on('set', this.setLockPhysicalControls.bind(this));
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.airPurifierService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.setActive.bind(this))
            .on('get', this.getActive.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
            .on('set', this.setCurrentAirPurifierState.bind(this))
            .on('get', this.getCurrentAirPurifierState.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
            .on('set', this.setTargetAirPurifierState.bind(this))
            .on('get', this.getTargetAirPurifierState.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
            .on('set', this.setLockPhysicalControls.bind(this))
            .on('get', this.getLockPhysicalControls.bind(this));
        this.airPurifierService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .setProps({
            maxValue: 4,
            minValue: 0,
            minStep: 1,
        })
            .on('set', this.setRotationSpeed.bind(this))
            .on('get', this.getRotationSpeed.bind(this));
        this.airQualityservice = this.accessory.getService(this.platform.Service.AirQualitySensor) || this.accessory.addService(this.platform.Service.AirQualitySensor);
        this.airQualityservice.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);
        this.airQualityservice.getCharacteristic(this.platform.Characteristic.AirQuality)
            .on('get', this.getAirQuality.bind(this));
        this.airQualityservice.getCharacteristic(this.platform.Characteristic.PM2_5Density)
            .on('get', this.getPM2_5Density.bind(this));
        this.setupSubscribers();
        this.setupRegisters();
    }
    getActive(callback) {
        this.platform.log.debug('Get Characteristic On ->', this.powerState);
        callback(null, this.powerState * 2);
    }
    setActive(value, callback) {
        console.log('Set Characteristic Active ->', value);
        if (this.powerState && value && this.airPurifierService.getCharacteristic(this.platform.Characteristic.Active).value) {
            return callback();
        }
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
    getCurrentAirPurifierState(callback) { return callback(null, this.currentAirPurifierState * 2); }
    setCurrentAirPurifierState(value, callback) {
        console.log('Set Characteristic CurrentAirPurifierState ->', value);
    }
    getTargetAirPurifierState(callback) { return callback(null, this.targetAirPurifierState); }
    setTargetAirPurifierState(value, callback) {
        console.log('Set Characteristic TargetAirPurifierState ->', value);
    }
    getLockPhysicalControls(callback) { return callback(null, this.lockPhysicalControlsState); }
    setLockPhysicalControls(value, callback) {
        console.log('Set Characteristic LockPhysicalControls ->', value);
        this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
            deviceNo: this.accessory.context.device.deviceId,
            language: this.platform.language,
            openId: this.accessory.context.device.factoryId,
            order: common_1.Commands.sendChildrenLock,
            paramCode: value === common_1.SwitchState.ON ? common_1.LockState.ON : common_1.LockState.OFF,
            smartCode: '00',
            productId: this.accessory.context.device.productId,
        });
        callback(null);
    }
    getAirQuality(callback) { return callback(null, this.airQuality); }
    getPM2_5Density(callback) { return callback(null, this.pm); }
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
    setupSubscribers() {
        this.powerState$
            .subscribe((state) => {
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState, state * 2);
        });
        this.fanSpeed$
            .subscribe((state) => {
            let targetState = this.platform.Characteristic.TargetAirPurifierState.MANUAL, fanSpeed;
            if (state.indexOf('one') !== -1) {
                fanSpeed = 0;
            }
            else if (state.indexOf('two') !== -1) {
                fanSpeed = 1;
            }
            else if (state.indexOf('three') !== -1) {
                fanSpeed = 2;
            }
            else if (state.indexOf('four') !== -1) {
                fanSpeed = 3;
            }
            else if (state.indexOf('auto') !== -1) {
                targetState = this.platform.Characteristic.TargetAirPurifierState.AUTO;
            }
            else if (state.indexOf('sleep') !== -1) {
                targetState = this.platform.Characteristic.TargetAirPurifierState.AUTO;
            }
            this.fanSpeed = fanSpeed;
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.fanSpeed);
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState, targetState);
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
        this.targetAirPurifierState$
            .subscribe((target) => this.airPurifierService.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState, target));
        this.lockPhysicalControlsState$
            .subscribe((switchState) => this.airPurifierService.updateCharacteristic(this.platform.Characteristic.LockPhysicalControls, switchState));
    }
    setupRegisters() {
        this.mqtt.register('purifier/server/app/sendPm/' + this.accessory.context.device.deviceId)
            .pipe(operators_1.debounceTime(3000), operators_1.tap(date => console.log({ date })))
            .subscribe((d) => {
            this.powerState = (d.power || '').indexOf('open') !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.powerState$.next(this.powerState);
            this.targetAirPurifierState = (d.speed || '').indexOf('auto') !== -1 ? this.platform.Characteristic.TargetAirPurifierState.AUTO : this.platform.Characteristic.TargetAirPurifierState.MANUAL;
            this.targetAirPurifierState$.next(this.targetAirPurifierState);
            this.lockPhysicalControlsState = (d.children || '').indexOf('open') !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.lockPhysicalControlsState$.next(this.lockPhysicalControlsState);
            this.sleepSwitchState = (d.speed || '').indexOf('sleep') !== -1 ? common_1.SwitchState.ON : common_1.SwitchState.OFF;
            this.sleepSwitchState$.next(this.sleepSwitchState);
            this.fanState = (d.speed || '').indexOf('auto') !== -1 ? common_1.FanState.AUTO : common_1.FanState.LOW;
            this.fanSpeed$.next(d === null || d === void 0 ? void 0 : d.speed);
            this.fanState$.next(this.fanState);
            this.pm = parseFloat(d === null || d === void 0 ? void 0 : d.pm);
            this.pm$.next(this.pm);
        });
    }
}
exports.ExamplePlatformAccessory = ExamplePlatformAccessory;
//# sourceMappingURL=platformAccessory.js.map