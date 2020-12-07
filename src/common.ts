export enum PowerState {
  OFF = '00',
  ON = '01'
}

export const LockState = PowerState;


export enum SwitchState {
  OFF,
  ON
}

export enum FanState {
  AUTO = '0A',
  SLEEP = '0B',
  LOW = '01',
  MED = '02',
  HIGH = '03',
  MAX = '04',
}


export interface SendPm {
  productId: string
  contentData: string
  children: string
  openId: string
  topic: string
  deviceNo: string
  power: string
  pm: string
  speed: string
}

export interface SendPower {
  deviceNo: string
  language: string
  openId: string
  order: string
  paramCode: number
  smartCode: number
  productId: string
}

export interface AllDeviceInfo {
  deviceNo: string
  language: string
  openId: string
  order: string
  paramCode: number
  productId: string
}

export interface SendCommand {
  deviceNo: string
  language: string
  openId: string
  order: string
  paramCode: number
  smartCode: number
  productId: string
}

export interface ApiResponse {
  code?: string
  msg?: string
  data?: any
}

// 12/4/2020, 5:26:40 PM code: '8001',
// 12/4/2020, 5:26:40 PM msg: 'operation succeeded',
// 12/4/2020, 5:26:40 PM data: null,
// 12/4/2020, 5:26:40 PM token: '4024a7201df4482e9e8eb89d2684556c',
// 12/4/2020, 5:26:40 PM id: '1058',
// 12/4/2020, 5:26:40 PM userNo: '9426896433'
export interface AuthResponse extends ApiResponse {
  token: string
  id: string
  userNo: string
}

// {
//   "code": "8001",
//   "msg": "operation succeeded",
//   "data": null
// }
export interface AuthVerifyResponse extends ApiResponse {}

export interface Device {
  id: string,
  deviceId: string
  deviceName: string,
  userId: string,
  productId: string
  factoryId: string
  gmtCreate: string,
  dvcModel: string
}

export interface ListDevicesResponse extends ApiResponse {
  data: Device []
}

export enum Commands {
  'sendPower' = 'sendPower',
  'changeSpeed' = 'changeSpeed',
  'sendSpeed' = 'sendSpeed',
  'getAll' = 'getAll',
  'sendChildrenLock' = 'sendChildrenLock'
}

let topics = [
  'purifier/server/app/sendPm/C8:93:46:31:8F:8A',
  'purifier/app/switch/9426896433',
  'purifier/app/changeSpeed/1058',
];
