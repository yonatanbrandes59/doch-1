import { useState } from 'react';
import { cx } from '@/lib/utils';

/**
 * סמל תנועת הנוער של האיחוד החקלאי.
 * טוען קובץ logo.png/logo.gif מ-public/, עם נפילה לאמבלם SVG אם לא קיים.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  const [src, setSrc] = useState('/logo.gif');

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="תנועת הנוער של האיחוד החקלאי"
      className={cx('object-contain', className)}
      onError={() => {
        if (!src.endsWith('logo.svg')) setSrc('/logo.svg');
      }}
    />
  );
}
