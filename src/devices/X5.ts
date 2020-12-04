import { ExamplePlatformAccessory } from '../platformAccessory';
import { AirdogPlatform } from '../platform';
import { PlatformAccessory } from 'homebridge';

export class X5 extends ExamplePlatformAccessory {
  constructor(
    private  platform: AirdogPlatform,
    private  accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
  }
}
