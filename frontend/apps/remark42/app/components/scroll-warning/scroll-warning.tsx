import clsx from 'clsx';
import { h, JSX } from 'preact';

import b from 'bem-react-helper';
interface ScrollWarningProps {
  setShowAboveThreshold: (value: boolean) => void;
  showAboveThreshold: boolean;
}

export function ScrollWarning({ setShowAboveThreshold, showAboveThreshold }: ScrollWarningProps): JSX.Element {
  return (
    <div className={clsx(b('scroll-warning'))}>
      Scroll Warning!
      <div className="scroll-warning_text">
        If you scroll down further, posts are likely to become <b>more toxic</b> and <b>less informative</b>.
        <br /> <br />
        Why not take a break from scrolling until more high-quality content is available?
      </div>
      <button
        onClick={() => setShowAboveThreshold && setShowAboveThreshold(!showAboveThreshold)}
        style={{ border: '1px solid #ccc', padding: '5px 10px', marginTop: '10px' }}
      >
        <div style={{ fontSize: '0.8em', color: '#666' }}>
          {showAboveThreshold
            ? 'Click to hide the comments above the warning threshold.'
            : 'Click to show the hidden comments anyway'}
        </div>
      </button>
    </div>
  );
}
