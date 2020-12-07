export declare enum PowerState {
    OFF = "00",
    ON = "01"
}
export declare const LockState: typeof PowerState;
export declare enum SwitchState {
    OFF = 0,
    ON = 1
}
export declare enum FanState {
    AUTO = "0A",
    SLEEP = "0B",
    LOW = "01",
    MED = "02",
    HIGH = "03",
    MAX = "04"
}
export interface SendPm {
    productId: string;
    contentData: string;
    children: string;
    openId: string;
    topic: string;
    deviceNo: string;
    power: string;
    pm: string;
    speed: string;
}
export interface SendPower {
    deviceNo: string;
    language: string;
    openId: string;
    order: string;
    paramCode: number;
    smartCode: number;
    productId: string;
}
export interface AllDeviceInfo {
    deviceNo: string;
    language: string;
    openId: string;
    order: string;
    paramCode: number;
    productId: string;
}
export interface SendCommand {
    deviceNo: string;
    language: string;
    openId: string;
    order: string;
    paramCode: number;
    smartCode: number;
    productId: string;
}
export interface ApiResponse {
    code?: string;
    msg?: string;
    data?: any;
}
export interface AuthResponse extends ApiResponse {
    token: string;
    id: string;
    userNo: string;
}
export interface AuthVerifyResponse extends ApiResponse {
}
export interface Device {
    id: string;
    deviceId: string;
    deviceName: string;
    userId: string;
    productId: string;
    factoryId: string;
    gmtCreate: string;
    dvcModel: string;
}
export interface ListDevicesResponse extends ApiResponse {
    data: Device[];
}
export declare enum Commands {
    'sendPower' = "sendPower",
    'changeSpeed' = "changeSpeed",
    'sendSpeed' = "sendSpeed",
    'getAll' = "getAll",
    'sendChildrenLock' = "sendChildrenLock"
}
//# sourceMappingURL=common.d.ts.map