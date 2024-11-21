import clsx from 'clsx';
import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import b, { Mods, Mix } from 'bem-react-helper';

import type { Theme } from 'common/types';

export const ScrollWarning = forwardRef<HTMLDivElement, JSX.IntrinsicElements['div']>((props, ref) => (
  <div className={clsx(b('scroll-warning'))} ref={ref}>
    Scroll Warning!
    <div className="scroll-warning_text">
      If you scroll down further, posts are likely to become <b>more toxic</b> and <b>less informative</b>.
      <br /> <br />
      Why not take a break from scrolling until more high-quality content is available?
    </div>
  </div>
));
