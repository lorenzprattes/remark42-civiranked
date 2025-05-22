import { h, Fragment, FunctionComponent } from 'preact';
import { shallowEqual } from 'react-redux';
import { useCallback, useState } from 'preact/hooks';
import b from 'bem-react-helper';
import { useIntl } from 'react-intl';

import { Comment as CommentInterface } from 'common/types';
import { getHandleClickProps } from 'common/accessibility';
import { StoreState, useAppDispatch, useAppSelector } from 'store';
import { setCollapse } from 'store/thread/actions';
import { getThreadIsCollapsed } from 'store/thread/getters';
import { InView } from 'components/root/in-view/in-view';
import { ConnectedComment as Comment } from 'components/comment/connected-comment';
import { CommentForm } from 'components/comment-form';
interface Props {
  id: CommentInterface['id'];
  childs?: CommentInterface['id'][];
  level: number;
  mix?: string;
  scrollWarning?: number;
  getPreview(text: string): Promise<string>;
}

const commentSelector = (id: string) => (state: StoreState) => {
  const { theme, comments } = state;
  const { allComments, childComments } = comments;
  const comment = allComments[id];
  const childs = childComments[id];
  const collapsed = getThreadIsCollapsed(comment)(state);

  return { comment, childs, collapsed, theme, comments };
};

export const Thread: FunctionComponent<Props> = ({ id, level, mix, getPreview, scrollWarning }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { collapsed, comment, childs, theme, comments } = useAppSelector(commentSelector(id), shallowEqual);
  const collapse = useCallback(() => {
    dispatch(setCollapse(id, !collapsed));
  }, [id, collapsed, dispatch]);
  const [showAboveThreshold, setShowAboveThreshold] = useState(false);

  let childsWithRanking;

  if (childs) {
    childsWithRanking = childs.map((childId) => {
      let rank = comments.allComments[childId].rank;
      return { id: childId, rank };
    });
  }

  const belowThreshold = scrollWarning
    ? (childsWithRanking || []).filter((child) => child.rank !== undefined && child.rank < scrollWarning)
    : undefined;
  const aboveThreshold = scrollWarning
    ? (childsWithRanking || []).filter((child) => child.rank !== undefined && child.rank >= scrollWarning)
    : undefined;

  if (comment.hidden) return null;

  const indented = level > 0;
  const repliesCount = childs ? childs.length : 0;

  return (
    <div
      className={b('thread', { mix }, { level, theme, indented })}
      role={['listitem'].concat(!collapsed && !!repliesCount ? 'list' : []).join(' ')}
      aria-expanded={!collapsed}
    >
      <InView>
        {(inviewProps) => (
          <Comment
            CommentForm={CommentForm}
            ref={inviewProps.ref}
            key={`comment-${id}`}
            view="main"
            intl={intl}
            data={comment}
            repliesCount={repliesCount}
            level={level}
            inView={inviewProps.inView}
          />
        )}
      </InView>
      {!scrollWarning ? (
        <Fragment>
          {!collapsed &&
            childs &&
            !!childs.length &&
            childs.map((currentId) => (
              <Thread
                key={`thread-${currentId}`}
                id={currentId}
                level={Math.min(level + 1, 6)}
                getPreview={getPreview}
              />
            ))}
          {level < 6 && (
            <div className={b('thread__collapse', { mods: { collapsed } })} {...getHandleClickProps(collapse)}>
              <div />
            </div>
          )}
        </Fragment>
      ) : (
        <Fragment>
          {!collapsed &&
            (belowThreshold ?? []).map(({ id }) => (
              <Thread key={`thread-${id}`} id={id} level={Math.min(level + 1, 6)} getPreview={getPreview} />
            ))}
          {level < 6 && (
            <div className={b('thread__collapse', { mods: { collapsed } })} {...getHandleClickProps(collapse)}>
              <div />
            </div>
          )}

          {!collapsed && (aboveThreshold ?? []).length > 0 && (
            <div>
              <button
                className={b('thread', { mix: undefined }, { level: level + 1, theme, indented: true })}
                aria-expanded={!collapsed}
                onClick={() => setShowAboveThreshold(!showAboveThreshold)}
                style={{ border: '1px solid #ccc', padding: '5px 10px', marginTop: '10px' }}
              >
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {showAboveThreshold
                    ? 'Click to hide the comments above the warning threshold.'
                    : 'Click to show the hidden comments'}
                </div>
              </button>
              {showAboveThreshold &&
                (aboveThreshold ?? []).map(({ id }) => (
                  <Thread key={`thread-${id}`} id={id} level={Math.min(level + 1, 6)} getPreview={getPreview} />
                ))}
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
