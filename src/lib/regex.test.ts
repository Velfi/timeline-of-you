import { TZ_REGEX } from './regex';

const VALID_TZ_OFFSETS = [
  // Signed offsets
  '-12:00',
  '-11:00',
  '-10:30',
  '-10:00',
  '-09:30',
  '-09:00',
  '-08:30',
  '-08:00',
  '-07:00',
  '-06:00',
  '-05:00',
  '-04:30',
  '-04:00',
  '-03:30',
  '-03:00',
  '-02:30',
  '-02:00',
  '-01:00',
  '+00:00',
  '+00:20',
  '+00:30',
  '+01:00',
  '+01:30',
  '+02:00',
  '+02:30',
  '+03:00',
  '+03:30',
  '+04:00',
  '+04:30',
  '+05:00',
  '+05:30',
  '+05:40',
  '+05:45',
  '+06:00',
  '+06:30',
  '+07:00',
  '+07:20',
  '+07:30',
  '+08:00',
  '+08:30',
  '+08:45',
  '+09:00',
  '+09:30',
  '+09:45',
  '+10:00',
  '+10:30',
  '+11:00',
  '+11:30',
  '+12:00',
  '+12:45',
  '+13:00',
  '+13:45',
  '+14:00',
  // Unsigned offsets
  '00:00',
  '00:20',
  '00:30',
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '05:40',
  '05:45',
  '06:00',
  '06:30',
  '07:00',
  '07:20',
  '07:30',
  '08:00',
  '08:30',
  '08:45',
  '09:00',
  '09:30',
  '09:45',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:45',
  '13:00',
  '13:45',
  '14:00',
  // Signed short offsets
  '-12',
  '-11',
  '-10',
  '-09',
  '-08',
  '-07',
  '-06',
  '-05',
  '-04',
  '-03',
  '-02',
  '-01',
  '-00',
  '+00',
  '+01',
  '+02',
  '+03',
  '+04',
  '+05',
  '+06',
  '+07',
  '+08',
  '+09',
  '+10',
  '+11',
  '+12',
  '+13',
  '+14',
  // Unsigned short offsets
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  // Signed really short offsets
  '-9',
  '-8',
  '-7',
  '-6',
  '-5',
  '-4',
  '-3',
  '-2',
  '-1',
  '-0',
  '+0',
  '+1',
  '+2',
  '+3',
  '+4',
  '+5',
  '+6',
  '+7',
  '+8',
  '+9',
  // Unsigned really short offsets
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
];

describe('timezone regex', () => {
  it('should match on valid tz offsets', () => {
    for (const tz of VALID_TZ_OFFSETS) {
      expect(tz).toMatch(TZ_REGEX);
    }
  });
});