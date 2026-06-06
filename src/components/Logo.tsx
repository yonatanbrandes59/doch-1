import { useState } from 'react';
import { cx } from '@/lib/utils';

/**
 * סמל תנועת הנוער של האיחוד החקלאי.
 *
 * המנגנון: מנסה לטעון קובץ אמיתי מ-public/logo.png (או logo.svg).
 * אם הקובץ אינו קיים — נופל אוטומטית לאמבלם המעוצב שמגיע עם הפרויקט.
 *
 * כדי להציג את הסמל הרשמי: שים את קובץ הלוגו בשם logo.png בתיקיית public/.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  const [src, setSrc] = useState('/logo.png');

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="תנועת הנוער של האיחוד החקלאי"
      className={cx('object-contain', className)}
      onError={() => {
        // אם logo.png לא קיים → נסה logo.svg (האמבלם המצורף)
        if (!src.endsWith('logo.svg')) setSrc('/logo.svg');
      }}
    />
  );
}
