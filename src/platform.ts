import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { Md5 } from 'ts-md5/dist/md5';
import axios from 'axios';
import { from } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { AuthResponse, AuthVerifyResponse, Device, ListDevicesResponse } from './common';
import { ExamplePlatformAccessory } from './platformAccessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

export type DevicePlatformAccessory = PlatformAccessory<{ device: Device }>

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class AirdogPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private url: string = 'http://app.us.beiangkeji.com:9011';
  // this is used to track restored cached accessories
  public readonly accessories: DevicePlatformAccessory[] = [];


  public id: string = '';
  public token: string = '';
  public userNo: string = '';
  public language: string = 'en';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    console.log(this.config);
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: DevicePlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    from(axios.post<AuthResponse>(this.url + 'http://app.us.beiangkeji.com:9011/challenger/app/login/appId/I0I000I000I00100', {
      loginName: this.config.email,
      password: Md5.hashStr(this.config.password as string).toString().toUpperCase(),
      clientType: 'iOS',
      clientId: '7b741e1e24b2d4a024d42740173e365f',
      language: this.language,
    }))
      .pipe(
        tap((d) => console.log(d.data)),
        map((data) => data.data),
        tap((d: AuthResponse) => this.id = d.id),
        tap((d: AuthResponse) => this.userNo = d.userNo),
        tap((d: AuthResponse) => this.token = d.token),
        tap(d => console.log(d)),
        mergeMap(d => from(axios.get<AuthVerifyResponse>(`http://app.us.beiangkeji.com:9011/challenger/app/virifyToken/appId/I0I000I000I00100/token/${this.token}/language/${this.language}`))),
        tap((d) => console.log(d.data)),
        map((data: AuthVerifyResponse) => data.data),
        tap((d: AuthResponse) => this.id = d.id),
        mergeMap(() => from(axios.post<ListDevicesResponse>(`http://app.us.beiangkeji.com:9001/columbia/app/searchUserDevice/appId/I0I000I000I00100/token/${this.token}`, {
          userId: this.userNo,
          language: this.language,
        }))),
        tap((d) => console.log(d.data)),
        map((d) => d.data),
      )
      // @ts-ignore
      .subscribe((d: ListDevicesResponse) => {
        let devices = d.data;
        for (const device of devices) {
          const uuid = this.api.hap.uuid.generate(device.deviceId);

          // see if an accessory with the same uuid has already been registered and restored from
          // the cached devices we stored in the `configureAccessory` method above
          const existingAccessory: DevicePlatformAccessory | undefined = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            if (device) {
              this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

              // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
              // existingAccessory.context.device = device;
              // this.api.updatePlatformAccessories([existingAccessory]);

              // create the accessory handler for the restored accessory
              // this is imported from `platformAccessory.ts`
              new ExamplePlatformAccessory(this, existingAccessory, this.log);

              // update accessory cache with any changes to the accessory details and information
              this.api.updatePlatformAccessories([existingAccessory]);
            } else if (!device) {
              this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
              this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
            }
          } else {
            this.log.info('Adding new accessory:', device.deviceName);
            const accessory: DevicePlatformAccessory = new this.api.platformAccessory(device.deviceName, uuid);

            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;

            // create the accessory handler for the newly create accessory
            new ExamplePlatformAccessory(this, accessory, this.log);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      },(err)=>{console.error({ err })});
  }
}
