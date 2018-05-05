const moment = require('moment');

const log = {};

log.info = function () {
    const args = Array.prototype.slice.call(arguments);
    const prefix = `[INFO] ${moment().format('YYYY/MM/DD HH:mm:ss.SSS')}`;
    args.unshift(prefix + " ");
    console.log.apply(undefined, args);

};

log.degug = function () {
    const args = Array.prototype.slice.call(arguments);
    const prefix = `[DEBUG] ${moment().format('YYYY/MM/DD HH:mm:ss.SSS')} `;
    args.unshift(prefix + " ");
    console.log.apply(undefined, args);
};

log.error = function () {
    const args = Array.prototype.slice.call(arguments);
    const prefix = `[ERROR] ${moment().format('YYYY/MM/DD HH:mm:ss.SSS')} `;
    args.unshift(prefix + " ");
    console.log.apply(undefined, args);
};

module.exports = log;
