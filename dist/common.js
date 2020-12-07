"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = exports.FanState = exports.SwitchState = exports.LockState = exports.PowerState = void 0;
var PowerState;
(function (PowerState) {
    PowerState["OFF"] = "00";
    PowerState["ON"] = "01";
})(PowerState = exports.PowerState || (exports.PowerState = {}));
exports.LockState = PowerState;
var SwitchState;
(function (SwitchState) {
    SwitchState[SwitchState["OFF"] = 0] = "OFF";
    SwitchState[SwitchState["ON"] = 1] = "ON";
})(SwitchState = exports.SwitchState || (exports.SwitchState = {}));
var FanState;
(function (FanState) {
    FanState["AUTO"] = "0A";
    FanState["SLEEP"] = "0B";
    FanState["LOW"] = "01";
    FanState["MED"] = "02";
    FanState["HIGH"] = "03";
    FanState["MAX"] = "04";
})(FanState = exports.FanState || (exports.FanState = {}));
var Commands;
(function (Commands) {
    Commands["sendPower"] = "sendPower";
    Commands["changeSpeed"] = "changeSpeed";
    Commands["sendSpeed"] = "sendSpeed";
    Commands["getAll"] = "getAll";
    Commands["sendChildrenLock"] = "sendChildrenLock";
})(Commands = exports.Commands || (exports.Commands = {}));
let topics = [
    'purifier/server/app/sendPm/C8:93:46:31:8F:8A',
    'purifier/app/switch/9426896433',
    'purifier/app/changeSpeed/1058',
];
//# sourceMappingURL=common.js.map