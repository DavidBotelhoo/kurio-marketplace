import { createCn } from 'cn/config'

/**
 * Class merging aware of the custom theme scales declared in src/index.css.
 * Without this, `text-15` would be classified as a text color and dropped
 * when merged with `text-primary`.
 */
export const cn = createCn({
  extend: {
    theme: {
      text: [
        '9',
        '10',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '20',
        '22',
        '24',
        '28',
        '32',
        '43',
      ],
      tracking: ['brand'],
      container: ['content'],
    },
  },
})
