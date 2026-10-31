import { isMac } from '../lib/hotkeys'

interface Shortcut {
  keys: string
  action: string
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

function keyboardGroups(mod: string): ShortcutGroup[] {
  return [
    {
      title: 'Classes',
      shortcuts: [
        { keys: 'N', action: 'New class' },
        { keys: '/', action: 'Search tags' },
        { keys: 'D', action: 'Write a doubt' },
      ],
    },
    {
      title: 'In a class',
      shortcuts: [
        { keys: 'Space', action: 'Start or stop the metronome' },
        { keys: '+  −', action: 'Metronome faster or slower' },
        { keys: 'T', action: 'New tab' },
        { keys: 'N', action: 'New note' },
        { keys: 'P', action: 'Add photos' },
        { keys: 'V', action: 'Add videos' },
      ],
    },
    {
      title: 'Writing a tab',
      shortcuts: [
        { keys: `${mod} S`, action: 'Save the tab' },
        { keys: 'Arrows', action: 'Move around the grid' },
        { keys: '0–24', action: 'Type a fret' },
      ],
    },
    {
      title: 'Anywhere',
      shortcuts: [
        { keys: 'Enter', action: 'Add a tag or doubt' },
        { keys: 'Esc', action: 'Go back' },
      ],
    },
  ]
}

const TOUCH_GESTURES: Shortcut[] = [
  { keys: 'Swipe left', action: 'Delete a class, tab, note or video' },
  { keys: 'Swipe left', action: 'Clear a doubt' },
  { keys: 'Swipe from the left edge', action: 'Go back (in the installed app)' },
]

function ShortcutTable({ title, shortcuts }: ShortcutGroup) {
  return (
    <div className="shortcut-group">
      <h3 className="shortcut-title">{title}</h3>
      <dl className="shortcut-list">
        {shortcuts.map(({ keys, action }) => (
          <div key={`${keys}-${action}`} className="shortcut-row">
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** The keyboard shortcuts and touch gestures, listed on the settings page. */
export function ShortcutsList() {
  return (
    <div className="stack-lg">
      {keyboardGroups(isMac() ? '⌘' : 'Ctrl').map((group) => (
        <ShortcutTable key={group.title} {...group} />
      ))}
      <ShortcutTable title="On a phone" shortcuts={TOUCH_GESTURES} />
    </div>
  )
}
