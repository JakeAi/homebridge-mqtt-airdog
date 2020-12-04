"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirdogPlatform = void 0;
const md5_1 = require("ts-md5/dist/md5");
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class AirdogPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.id = '';
        this.token = '';
        this.userNo = '';
        this.language = 'en';
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
    configureAccessory(accessory) {
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
        rxjs_1.from(axios_1.default.post('http://app.us.beiangkeji.com:9011/challenger/app/login/appId/I0I000I000I00100', {
            loginName: this.config.email,
            password: md5_1.Md5.hashStr(this.config.password).toString().toUpperCase(),
            clientType: 'iOS',
            clientId: '7b741e1e24b2d4a024d42740173e365f',
            language: this.language,
        }))
            .pipe(operators_1.map((data) => data.data), operators_1.tap((d) => this.id = d.id), operators_1.tap((d) => this.userNo = d.userNo), operators_1.tap((d) => this.token = d.token), operators_1.mergeMap(d => rxjs_1.from(axios_1.default.get(`http://app.us.beiangkeji.com:9011/challenger/app/virifyToken/appId/I0I000I000I00100/token/${this.token}/language/${this.language}`))), operators_1.map((data) => data.data), operators_1.tap((d) => this.id = d.id), operators_1.mergeMap(() => rxjs_1.from(axios_1.default.post(`http://app.us.beiangkeji.com:9001/columbia/app/searchUserDevice/appId/I0I000I000I00100/token/${this.token}`, {
            userId: this.userNo,
            language: this.language,
        }))), operators_1.map((d) => d.data))
            .subscribe((d) => {
            // let devices = d.data;
            // for (const device of devices) {
            //
            //   // generate a unique id for the accessory this should be generated from
            //   // something globally unique, but constant, for example, the device serial
            //   // number or MAC address
            //   const uuid = this.api.hap.uuid.generate(device.deviceId);
            //
            //   // see if an accessory with the same uuid has already been registered and restored from
            //   // the cached devices we stored in the `configureAccessory` method above
            //   const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            //
            //   if (existingAccessory) {
            //     // the accessory already exists
            //     if (device) {
            //       this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            //
            //       // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
            //       // existingAccessory.context.device = device;
            //       // this.api.updatePlatformAccessories([existingAccessory]);
            //
            //       // create the accessory handler for the restored accessory
            //       // this is imported from `platformAccessory.ts`
            //       new ExamplePlatformAccessory(this, existingAccessory);
            //
            //       // update accessory cache with any changes to the accessory details and information
            //       this.api.updatePlatformAccessories([existingAccessory]);
            //     } else if (!device) {
            //       // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
            //       // remove platform accessories when no longer present
            //       this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
            //       this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
            //     }
            //   } else {
            //     // the accessory does not yet exist, so we need to create it
            //     this.log.info('Adding new accessory:', device.exampleDisplayName);
            //
            //     // create a new accessory
            //     const accessory = new this.api.platformAccessory(device.exampleDisplayName, uuid);
            //
            //     // store a copy of the device object in the `accessory.context`
            //     // the `context` property can be used to store any data about the accessory you may need
            //     accessory.context.device = device;
            //
            //     // create the accessory handler for the newly create accessory
            //     // this is imported from `platformAccessory.ts`
            //     new ExamplePlatformAccessory(this, accessory);
            //
            //     // link the accessory to your platform
            //     this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            //   }
            // }
            console.log(d.data);
        });
        return;
        /*
            // EXAMPLE ONLY
            // A real plugin you would discover accessories from the local network, cloud services
            // or a user-defined array in the platform config.
            const exampleDevices = [
              {
                exampleUniqueId: 'ABCD',
                exampleDisplayName: 'Bedroom',
              },
              {
                exampleUniqueId: 'EFGH',
                exampleDisplayName: 'Kitchen',
              },
            ];
    
            // loop over the discovered devices and register each one if it has not already been registered
            for (const device of exampleDevices) {
    
              // generate a unique id for the accessory this should be generated from
              // something globally unique, but constant, for example, the device serial
              // number or MAC address
              const uuid = this.api.hap.uuid.generate(device.exampleUniqueId);
    
              // see if an accessory with the same uuid has already been registered and restored from
              // the cached devices we stored in the `configureAccessory` method above
              const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
    
              if (existingAccessory) {
                // the accessory already exists
                if (device) {
                  this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
    
                  // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                  // existingAccessory.context.device = device;
                  // this.api.updatePlatformAccessories([existingAccessory]);
    
                  // create the accessory handler for the restored accessory
                  // this is imported from `platformAccessory.ts`
                  new ExamplePlatformAccessory(this, existingAccessory);
    
                  // update accessory cache with any changes to the accessory details and information
                  this.api.updatePlatformAccessories([existingAccessory]);
                } else if (!device) {
                  // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                  // remove platform accessories when no longer present
                  this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                  this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
              } else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.exampleDisplayName);
    
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.exampleDisplayName, uuid);
    
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
    
                // create the accessory handler for the newly create accessory
                // this is imported from `platformAccessory.ts`
                new ExamplePlatformAccessory(this, accessory);
    
                // link the accessory to your platform
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
            }*/
    }
}
exports.AirdogPlatform = AirdogPlatform;
//# sourceMappingURL=platform.js.map