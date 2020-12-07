import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, Logger, Service } from 'homebridge';
import { AirdogPlatform, DevicePlatformAccessory } from './platform';
import { MANUFACTURER } from './settings';
import { MQTT } from './mqtt';
import { Commands, FanState, LockState, PowerState, SendPm, SwitchState } from './common';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private airPurifierService: Service;
  private airQualityservice: Service;

  private mqtt: MQTT = new MQTT('mqtt://47.89.244.17');


  private fanState = FanState.AUTO;
  private fanState$: BehaviorSubject<FanState> = new BehaviorSubject<FanState>(FanState.AUTO);


  private sleepSwitchService: Service;
  private sleepSwitchState = SwitchState.OFF;
  private sleepSwitchState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);


  private pm: number = 0;
  private pm$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private airQuality: number = 0;
  private airQuality$: BehaviorSubject<number> = new BehaviorSubject<number>(0);


  private fanSpeed: number = 0;
  private fanSpeed$: BehaviorSubject<string> = new BehaviorSubject<string>('speed auto');

  private activeState: number = 0;
  private activeState$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private currentAirPurifierState: number = 0;
  private currentAirPurifierState$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private targetAirPurifierState: number = 0;
  private targetAirPurifierState$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private lockPhysicalControlsService: Service;
  private lockPhysicalControlsState: SwitchState = SwitchState.OFF;
  private lockPhysicalControlsState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

  constructor(
    private  platform: AirdogPlatform,
    private  accessory: DevicePlatformAccessory,
    public readonly log: Logger,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, 'X5')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'X5');


    this.airPurifierService = this.accessory.getService(this.platform.Service.AirPurifier) || this.accessory.addService(this.platform.Service.AirPurifier);


    this.sleepSwitchService = <Service>this.accessory.getServiceById(this.platform.Service.Switch, 'Sleep');
    if (!this.sleepSwitchService) {
      this.sleepSwitchService = new this.platform.Service.Switch('Sleep', 'Sleep');
      this.sleepSwitchService = this.accessory.addService(this.sleepSwitchService);
    }

    this.lockPhysicalControlsService = <Service>this.accessory.getServiceById(this.platform.Service.Switch, 'Lock');
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

  getActive(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Get Characteristic On ->', this.activeState);
    callback(null, this.currentAirPurifierState);
  }

  setActive(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    console.log('Set Characteristic Active ->', value);
    if (this.currentAirPurifierState && value && this.airPurifierService.getCharacteristic(this.platform.Characteristic.Active).value) { return callback(); }
    this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
      deviceNo: this.accessory.context.device.deviceId,
      language: this.platform.language,
      openId: this.accessory.context.device.factoryId,
      order: Commands.sendPower,
      paramCode: value === SwitchState.ON ? PowerState.ON : PowerState.OFF,
      smartCode: '00',
      productId: this.accessory.context.device.productId,
    });
    this.activeState = value as number;
    this.activeState$.next(this.activeState);
    // you must call the callback function
    callback(null);
  }

  getCurrentAirPurifierState(callback: CharacteristicGetCallback) { return callback(null, this.currentAirPurifierState * 2); }

  setCurrentAirPurifierState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    console.log('Set Characteristic CurrentAirPurifierState ->', value);
  }

  getTargetAirPurifierState(callback: CharacteristicGetCallback) { return callback(null, this.targetAirPurifierState); }

  setTargetAirPurifierState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    console.log('Set Characteristic TargetAirPurifierState ->', value);
  }

  getLockPhysicalControls(callback: CharacteristicGetCallback) { return callback(null, this.lockPhysicalControlsState); }

  setLockPhysicalControls(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    console.log('Set Characteristic LockPhysicalControls ->', value);

    this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
      deviceNo: this.accessory.context.device.deviceId,
      language: this.platform.language,
      openId: this.accessory.context.device.factoryId,
      order: Commands.sendChildrenLock,
      paramCode: value === SwitchState.ON ? LockState.ON : LockState.OFF,
      smartCode: '00',
      productId: this.accessory.context.device.productId,
    });
    callback(null);
  }

  getAirQuality(callback: CharacteristicGetCallback) { return callback(null, this.airQuality); }

  getPM2_5Density(callback: CharacteristicGetCallback) { return callback(null, this.pm); }

  getSleepSwitchState(callback: CharacteristicGetCallback) { return callback(null, this.sleepSwitchState); }

  setSleepSwitchState(value: CharacteristicValue, callback: CharacteristicSetCallback) {}

  getRotationSpeed(callback: CharacteristicGetCallback) {
    callback(null, this.fanSpeed);
  }

  setRotationSpeed(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    let fanState;

    if (value === 0) {fanState = FanState.LOW;}
    if (value === 1) {fanState = FanState.MED;}
    if (value === 2) {fanState = FanState.HIGH;}
    if (value === 3) {fanState = FanState.MAX;}

    console.log('Set Characteristic RotationSpeed ->', value);
    this.mqtt.publish('purifier/app/changeSpeed/1058' + this.platform.userNo, {
      deviceNo: this.accessory.context.device.deviceId,
      language: this.platform.language,
      openId: this.accessory.context.device.factoryId,
      order: Commands.sendSpeed,
      paramCode: fanState,
      smartCode: '00',
      productId: this.accessory.context.device.productId,
    });
    // you must call the callback function
    callback(null);
  }

  private setupSubscribers() {

    this.activeState$
      .subscribe((state) => this.airPurifierService.updateCharacteristic(this.platform.Characteristic.Active, state));

    this.currentAirPurifierState$
      .subscribe((state) => this.airPurifierService.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState, state * 2));

    this.targetAirPurifierState$
      .subscribe((target) => this.airPurifierService.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState, target));

    this.lockPhysicalControlsState$
      .subscribe((switchState) => this.airPurifierService.updateCharacteristic(this.platform.Characteristic.LockPhysicalControls, switchState));


    this.fanSpeed$
      .subscribe((state) => {

        let targetState = this.platform.Characteristic.TargetAirPurifierState.MANUAL, fanSpeed;

        if (state.indexOf('one') !== -1) {
          fanSpeed = 0;
        } else if (state.indexOf('two') !== -1) {
          fanSpeed = 1;
        } else if (state.indexOf('three') !== -1) {
          fanSpeed = 2;
        } else if (state.indexOf('four') !== -1) {
          fanSpeed = 3;
        } else if (state.indexOf('auto') !== -1) {
          targetState = this.platform.Characteristic.TargetAirPurifierState.AUTO;
        } else if (state.indexOf('sleep') !== -1) {
          targetState = this.platform.Characteristic.TargetAirPurifierState.AUTO;
        }

        this.fanSpeed = fanSpeed;
        this.airPurifierService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.fanSpeed);
        this.airPurifierService.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState, targetState);

      });


    this.pm$
      .subscribe((pm) => {
        let airQualityLevel = 0;
        if (pm >= 200) { airQualityLevel = 5;}
        if (pm >= 120 && pm < 200) { airQualityLevel = 3; }
        if (pm >= 65 && pm < 120) { airQualityLevel = 2;}
        if (pm > 0 && pm < 65) { airQualityLevel = 1;}
        if (pm === 0) { airQualityLevel = 0;}

        this.airQuality = airQualityLevel;
        this.pm = pm;

        this.airQualityservice.updateCharacteristic(this.platform.Characteristic.AirQuality, this.airQuality);
        this.airQualityservice.updateCharacteristic(this.platform.Characteristic.PM2_5Density, this.pm);
      });

  }

  private setupRegisters() {

    this.mqtt.register<SendPm>('purifier/server/app/sendPm/' + this.accessory.context.device.deviceId)
      .pipe(
        debounceTime(3000),
        tap(date => console.log({ date })),
      )
      .subscribe((d) => {

        this.currentAirPurifierState = (d.power || '').indexOf('open') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.currentAirPurifierState$.next(this.currentAirPurifierState * 2);

        this.targetAirPurifierState = (d.speed || '').indexOf('auto') !== -1 ? this.platform.Characteristic.TargetAirPurifierState.AUTO : this.platform.Characteristic.TargetAirPurifierState.MANUAL;
        this.targetAirPurifierState$.next(this.targetAirPurifierState);

        this.lockPhysicalControlsState = (d.children || '').indexOf('open') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.lockPhysicalControlsState$.next(this.lockPhysicalControlsState);

        this.sleepSwitchState = (d.speed || '').indexOf('sleep') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.sleepSwitchState$.next(this.sleepSwitchState);

        this.fanState = (d.speed || '').indexOf('auto') !== -1 ? FanState.AUTO : FanState.LOW;
        this.fanSpeed$.next(d?.speed);
        this.fanState$.next(this.fanState);

        this.pm = parseFloat(d?.pm);
        this.pm$.next(this.pm);
      });
  }


}
