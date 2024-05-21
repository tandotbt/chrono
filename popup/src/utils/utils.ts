import moment from 'moment'

export default {
    equalsHex: (a: string, b: string): boolean => {
        let _a = a.toLowerCase()
        if (_a && !_a.startsWith('0x')) {
            _a = '0x' + _a
        }
        let _b = b.toLowerCase()
        if (_b && !_b.startsWith('0x')) {
            _b = '0x' + _b
        }

        return _a === _b
    },
    timeFormat(ts: moment.Moment) {
        return moment(ts).format('ll, LT')
    },
    shortAddress(address: string, left = 4, right = 4): string {
        return address.substr(0, left + 2)
            + '..'
            + address.substr(address.length - right, right)
    }
}
