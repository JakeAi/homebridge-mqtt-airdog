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
  // private airQualityservice: Service;

  private mqtt: MQTT = new MQTT('mqtt://47.89.244.17');

  private powerState = SwitchState.OFF;
  private powerState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

  private fanState = FanState.AUTO;
  private fanState$: BehaviorSubject<FanState> = new BehaviorSubject<FanState>(FanState.AUTO);

  private sleepState = SwitchState.OFF;
  private sleepState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

  private lockState = SwitchState.OFF;
  private lockState$: BehaviorSubject<SwitchState> = new BehaviorSubject<SwitchState>(SwitchState.OFF);

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
      .on('set', this.setOn.bind(this))
      .on('get', this.getOn.bind(this));

    this.mqtt.register<SendPm>('purifier/server/app/sendPm/' + this.accessory.context.device.deviceId)
      .pipe(
        debounceTime(1000),
        tap(date => console.log({ date })),
      )
      .subscribe((d) => {
        this.powerState = d?.power?.indexOf('open') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.lockState = d?.children?.indexOf('open') !== -1 ? SwitchState.ON : SwitchState.OFF;
        this.fanState = d?.speed?.indexOf('auto') !== -1 ? FanState.AUTO : FanState.LOW;
        this.powerState$.next(this.powerState);
        this.lockState$.next(this.lockState);
        this.fanState$.next(this.fanState);
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
    // this.airQualityservice = this.accessory.getService(this.platform.Service.AirQualitySensor) || this.accessory.addService(this.platform.Service.AirQualitySensor);
    // this.airQualityservice.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.deviceName);
    this.powerState$
      .subscribe((state) => {
        this.airPurifierService.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState, state*2);
      });
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    console.log({ value });
    this.mqtt.publish('purifier/app/switch/' + this.platform.userNo, {
      deviceNo: this.accessory.context.device.deviceId,
      language: 'en',
      openId: '4CA90DA0',
      order: Commands.sendPower,
      paramCode: value === SwitchState.ON ? PowerState.ON : PowerState.OFF,
      smartCode: '00',
      productId: '92AD88F0',
    });
    this.platform.log.debug('Set Characteristic On ->', value);
    // you must call the callback function
    callback(null, value);
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
    callback(null, this.powerState);
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
