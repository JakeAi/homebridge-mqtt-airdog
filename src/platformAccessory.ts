import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, Logger, Service } from 'homebridge';
import { AirdogPlatform, DevicePlatformAccessory } from './platform';
import { MANUFACTURER } from './settings';
import { MQTT } from './mqtt';
import { Commands, FanState, PowerState, SendPm, SwitchState } from './common';
import { debounceTime, tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private airPurifierService: Service;
  private airQualityservice: Service;

  private mqtt: MQTT = new MQTT('mqtt://47.89.244.17');

  private powerState = SwitchState.OFF;
  private powerState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

  private fanState = FanState.AUTO;
  private fanState$: BehaviorSubject<FanState> = new BehaviorSubject<FanState>(FanState.AUTO);

  private sleepState = SwitchState.OFF;
  private sleepState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

  private lockState = SwitchState.OFF;
  private lockState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

  private pm: number = 0;
  private pm$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private airQuality: number = 0;
  private airQuality$: BehaviorSubject<number> = new BehaviorSubject<number>(0);


  private fanSpeed: number = 0;
  private fanSpeed$: BehaviorSubject<string> = new BehaviorSubject<string>('speed auto');

  constructor(
    private  platform: AirdogPlatform,
    private  accessory: DevicePlatformAccessory,
    public readonly log: Logger,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
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
      .setProps({
        maxValue: 4,
        minValue: 0,
        minStep: 1,
      })
      .on('set', this.setRotationSpeed.bind(this))
      .on('get', this.getRotationSpeed.bind(this));

    this.mqtt.register<SendPm>('purifier/server/app/sendPm/' + this.accessory.context.device.deviceId)
      .pipe(
        debounceTime(3000),
        tap(date => console.log({ date })),
      )
      .subscribe((d) => {
        this.powerState = d?.power?.indexOf('open') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.lockState = d?.children?.indexOf('open') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.fanState = d?.speed?.indexOf('auto') !== -1 ? FanState.AUTO : FanState.LOW;

        this.fanSpeed$.next(d?.speed);
        this.powerState$.next(this.powerState);
        this.lockState$.next(this.lockState);
        this.fanState$.next(this.fanState);

        this.pm$.next(parseFloat(d?.pm));
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
        if (state.indexOf('one') !== -1) { this.fanSpeed = 0; }
        if (state.indexOf('two') !== -1) { this.fanSpeed = 1; }
        if (state.indexOf('three') !== -1) { this.fanSpeed = 2; }
        if (state.indexOf('four') !== -1) { this.fanSpeed = 3; }

        this.fanSpeed = 0;
        this.airPurifierService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.fanSpeed);
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

  getRotationSpeed(callback: CharacteristicGetCallback) {
    callback(null, this.fanSpeed);
  }

  setRotationSpeed(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    callback(null);
  }

  getAirQuality(callback: CharacteristicGetCallback) {
    callback(null, this.airQuality);
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
      deviceNo: this.accessory.context.device.deviceId,
      language: this.platform.language,
      openId: this.accessory.context.device.factoryId,
      order: Commands.sendPower,
      paramCode: value === SwitchState.ON ? PowerState.ON : PowerState.OFF,
      smartCode: '00',
      productId: this.accessory.context.device.productId,
    });
    console.log('Set Characteristic On ->', value);
    this.powerState$.next(this.powerState = value as number * 2);
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
  getOn(callback: CharacteristicGetCallback) {
    // implement your own code to check if the device is on

    this.platform.log.debug('Get Characteristic On ->', this.powerState);

    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, this.powerState * 2);
  }

  getPm(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Get Characteristic On ->', this.powerState);
    callback(null, this.pm);
  }


}
