interface PickProps {
  label: string
  /** Width in px; the pick is a little taller than it is wide. */
  size?: number
}

const PICK_PATH = 'M20 1.5C31.5 1.5 38.5 7.5 38.5 16.5C38.5 26 29 36.5 20 42.5C11 36.5 1.5 26 1.5 16.5C1.5 7.5 8.5 1.5 20 1.5Z'
const SHINE_PATH = 'M11 7C14 4.8 18 4 21.5 4.3C16.5 5.8 12.8 9 10.8 13.5C9.5 11.5 9.4 8.6 11 7Z'

/** A guitar pick with a short label, used for class numbers and the logo. */
export function Pick({ label, size = 40 }: PickProps) {
  return (
    <span className="pick" style={{ width: size, height: size * 1.1 }} aria-hidden="true">
      <svg viewBox="0 0 40 44">
        <path className="pick-body" d={PICK_PATH} />
        <path className="pick-shine" d={SHINE_PATH} />
      </svg>
      <span className="pick-label" style={{ fontSize: size * 0.42 }}>
        {label}
      </span>
    </span>
  )
}

const STRING_COUNT = 6
const FRETBOARD_FRETS = 12
const SINGLE_INLAYS = [3, 5, 7, 9]
const DOUBLE_INLAY = 12

/** Where fret n sits on a real neck, as a share of the distance from the nut to the 12th fret. */
function fretPosition(fret: number): number {
  return (1 - 2 ** (-fret / 12)) / (1 - 2 ** (-FRETBOARD_FRETS / 12))
}

function percent(share: number): string {
  return `${(share * 100).toFixed(2)}%`
}

function inlayCenter(fret: number): string {
  return percent((fretPosition(fret - 1) + fretPosition(fret)) / 2)
}

/** A strip of fretboard up to the 12th fret: real fret spacing, inlay dots and six strings, thicker at the bottom. */
export function Fretboard() {
  const frets = Array.from({ length: FRETBOARD_FRETS }, (_, index) => index + 1)
  return (
    <svg className="fretboard" aria-hidden="true" role="presentation">
      <rect className="fretboard-nut" x="0" y="0" width="4" height="100%" rx="1" />
      {frets.map((fret) => (
        <line key={fret} className="fretboard-fret" x1={percent(fretPosition(fret))} x2={percent(fretPosition(fret))} y1="0" y2="100%" />
      ))}
      {SINGLE_INLAYS.map((fret) => (
        <circle key={fret} className="fretboard-inlay" cx={inlayCenter(fret)} cy="50%" r="3" />
      ))}
      <circle className="fretboard-inlay" cx={inlayCenter(DOUBLE_INLAY)} cy="28%" r="3" />
      <circle className="fretboard-inlay" cx={inlayCenter(DOUBLE_INLAY)} cy="72%" r="3" />
      {Array.from({ length: STRING_COUNT }, (_, index) => {
        const y = percent((index + 0.5) / STRING_COUNT)
        return <line key={index} className="fretboard-string" x1="0" x2="100%" y1={y} y2={y} strokeWidth={0.6 + index * 0.3} />
      })}
    </svg>
  )
}

// Both guitars stand upright: nut at y=170, saddles at y=880, so the 22 frets sit where they would on a real neck.
const NUT_Y = 170
const SADDLE_Y = 880
const SCALE_LENGTH = SADDLE_Y - NUT_Y
const NECK_FRETS = 22
const NECK_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]
const DOUBLE_NECK_INLAY = 12
const NECK_CENTER_X = 200
const NUT_HALF_WIDTH = 20
const HEEL_HALF_WIDTH = 23

function neckFretY(fret: number): number {
  return NUT_Y + SCALE_LENGTH * (1 - 2 ** (-fret / 12))
}

function neckHalfWidthAt(y: number): number {
  return NUT_HALF_WIDTH + ((HEEL_HALF_WIDTH - NUT_HALF_WIDTH) * (y - NUT_Y)) / (neckFretY(NECK_FRETS) - NUT_Y)
}

const NECK_END_Y = neckFretY(NECK_FRETS) + 14

// Two straight wings sweeping down from the neck, with the notch between them.
const FLYING_V_BODY = [
  'M200 585',
  'C214 585 226 596 232 612',
  'L362 1000',
  'C366 1012 356 1018 346 1014',
  'L212 950',
  'C204 946 196 946 188 950',
  'L54 1014',
  'C44 1018 34 1012 38 1000',
  'L168 612',
  'C174 596 186 585 200 585',
  'Z',
].join(' ')

// Open-book headstock with three tuners a side.
const HEADSTOCK_PATH = 'M181 172L172 140L162 60C175 48 190 52 200 58C210 52 225 48 238 60L228 140L219 172Z'
const TUNER_YS = [132, 108, 84]

function headstockEdgeOffset(y: number): number {
  // How far the headstock's side sits from the centre line at height y.
  return 28 + ((140 - y) / 80) * 10
}

function stringX(index: number, y: number): number {
  const share = (y - NUT_Y) / SCALE_LENGTH
  const halfSpread = 15 + share * 10
  return NECK_CENTER_X - halfSpread + (index * 2 * halfSpread) / 5
}

// Single cutaway on the treble side, rounded upper bout on the bass side.
const LES_PAUL_BODY = [
  'M178 650',
  'C160 618 128 604 104 612',
  'C70 624 56 664 60 706',
  'C64 748 84 768 80 798',
  'C76 830 36 850 38 906',
  'C40 972 116 1010 200 1010',
  'C284 1010 360 972 362 906',
  'C364 850 324 830 320 798',
  'C316 770 338 744 334 704',
  'C330 668 312 640 296 626',
  'C290 621 284 624 284 632',
  'C284 660 262 700 222 704',
  'L222 650',
  'Z',
].join(' ')
const LES_PAUL_BINDING = 'M104 626C76 636 70 668 74 706C78 748 96 770 94 800C90 834 52 852 54 906C56 960 124 994 200 994C276 994 344 960 346 906C348 852 310 834 306 800C302 770 322 744 320 706C318 680 308 660 298 648'
const LES_PAUL_PICKGUARD = 'M244 700C276 708 296 742 294 790C292 812 286 830 280 842L244 842Z'

interface GuitarNeckProps {
  /** Where the strings end on the body: a tailpiece or string-through ferrules. */
  stringEndY: number
}

/** The parts both guitars share: open-book headstock, 22-fret neck and six strings. */
function GuitarNeck({ stringEndY }: GuitarNeckProps) {
  const frets = Array.from({ length: NECK_FRETS }, (_, index) => index + 1)
  const neck =
    `M${NECK_CENTER_X - NUT_HALF_WIDTH} ${NUT_Y}L${NECK_CENTER_X + NUT_HALF_WIDTH} ${NUT_Y}` +
    `L${NECK_CENTER_X + HEEL_HALF_WIDTH} ${NECK_END_Y}L${NECK_CENTER_X - HEEL_HALF_WIDTH} ${NECK_END_Y}Z`
  const twelfth = (neckFretY(DOUBLE_NECK_INLAY - 1) + neckFretY(DOUBLE_NECK_INLAY)) / 2
  return (
    <>
      <path className="guitar-solid" d={HEADSTOCK_PATH} />
      {TUNER_YS.flatMap((y) => {
        const offset = headstockEdgeOffset(y)
        return [-1, 1].map((side) => (
          <g key={`${y}${side}`}>
            <rect className="guitar-line" x={NECK_CENTER_X + side * (offset + 10) - 6} y={y - 4} width="12" height="8" rx="2" />
            <circle className="guitar-dot" cx={NECK_CENTER_X + side * (offset - 10)} cy={y} r="4" />
          </g>
        ))
      })}
      <path className="guitar-neck" d={neck} />
      <rect className="guitar-nut" x={NECK_CENTER_X - NUT_HALF_WIDTH} y={NUT_Y - 4} width={NUT_HALF_WIDTH * 2} height="5" />
      {frets.map((fret) => {
        const y = neckFretY(fret)
        const half = neckHalfWidthAt(y)
        return <line key={fret} className="guitar-line" x1={NECK_CENTER_X - half} x2={NECK_CENTER_X + half} y1={y} y2={y} />
      })}
      {NECK_INLAYS.map((fret) => (
        <circle key={fret} className="guitar-dot" cx={NECK_CENTER_X} cy={(neckFretY(fret - 1) + neckFretY(fret)) / 2} r="4" />
      ))}
      <circle className="guitar-dot" cx={NECK_CENTER_X - 9} cy={twelfth} r="3.5" />
      <circle className="guitar-dot" cx={NECK_CENTER_X + 9} cy={twelfth} r="3.5" />
      <rect className="guitar-part" x="164" y="716" width="72" height="32" rx="5" />
      <rect className="guitar-part" x="164" y="806" width="72" height="32" rx="5" />
      <rect className="guitar-part" x="166" y="866" width="68" height="10" rx="3" />
      {Array.from({ length: 6 }, (_, index) => (
        <line
          key={index}
          className="guitar-string"
          x1={stringX(index, NUT_Y)}
          y1={NUT_Y}
          x2={stringX(index, SADDLE_Y)}
          y2={stringEndY}
          strokeWidth={0.7 + index * 0.25}
        />
      ))}
    </>
  )
}

/** An upright Flying V: two humbuckers, string-through body, three knobs. Original artwork, decorative only. */
function FlyingV() {
  return (
    <svg className="backdrop-guitar flying-v" viewBox="20 20 360 1010">
      <path className="guitar-solid" d={FLYING_V_BODY} />
      {Array.from({ length: 6 }, (_, index) => (
        <circle key={index} className="guitar-dot" cx={stringX(index, SADDLE_Y)} cy="908" r="2.6" />
      ))}
      <line className="guitar-line" x1="262" y1="790" x2="280" y2="772" />
      <circle className="guitar-part" cx="292" cy="922" r="11" />
      <circle className="guitar-part" cx="318" cy="958" r="11" />
      <circle className="guitar-part" cx="268" cy="958" r="11" />
      <GuitarNeck stringEndY={908} />
    </svg>
  )
}

/** An upright Les Paul: carved top with binding, two humbuckers, stopbar tailpiece, four knobs. Original artwork. */
function LesPaul() {
  return (
    <svg className="backdrop-guitar les-paul" viewBox="20 20 360 1010">
      <path className="guitar-solid" d={LES_PAUL_BODY} />
      <path className="guitar-line" d={LES_PAUL_BINDING} />
      <path className="guitar-part" d={LES_PAUL_PICKGUARD} />
      <rect className="guitar-part" x="158" y="900" width="84" height="12" rx="6" />
      <circle className="guitar-part" cx="104" cy="676" r="7" />
      <line className="guitar-line" x1="104" y1="676" x2="116" y2="662" />
      <circle className="guitar-part" cx="272" cy="900" r="12" />
      <circle className="guitar-part" cx="310" cy="920" r="12" />
      <circle className="guitar-part" cx="264" cy="946" r="12" />
      <circle className="guitar-part" cx="302" cy="966" r="12" />
      <GuitarNeck stringEndY={906} />
    </svg>
  )
}

const PICK_PATH_SMALL = 'M20 1.5C31.5 1.5 38.5 7.5 38.5 16.5C38.5 26 29 36.5 20 42.5C11 36.5 1.5 26 1.5 16.5C1.5 7.5 8.5 1.5 20 1.5Z'

interface Placement {
  top: string
  left: string
  rotate: number
  size: number
}

// Hand-placed so nothing lines up too neatly; percentages keep them spread on any screen.
const PICKS: Placement[] = [
  { top: '6%', left: '4%', rotate: -18, size: 34 },
  { top: '40%', left: '28%', rotate: 22, size: 26 },
  { top: '58%', left: '8%', rotate: 38, size: 30 },
  { top: '84%', left: '40%', rotate: -30, size: 28 },
]
const NOTES: Placement[] = [
  { top: '14%', left: '30%', rotate: -8, size: 46 },
  { top: '44%', left: '2%', rotate: 10, size: 40 },
  { top: '64%', left: '22%', rotate: -12, size: 42 },
]
const TAB_SNIPPETS: Array<Placement & { frets: string[] }> = [
  { top: '22%', left: '6%', rotate: -5, size: 190, frets: ['', '', '5h7', '', '', ''] },
  { top: '90%', left: '4%', rotate: 4, size: 210, frets: ['12', '', '', '14p12', '', ''] },
]

function placementStyle({ top, left, rotate, size }: Placement) {
  return { top, left, width: size, transform: `rotate(${rotate}deg)` }
}

function BackdropTab({ frets }: { frets: string[] }) {
  return (
    <svg viewBox="0 0 200 70">
      {frets.map((fret, index) => {
        const y = 6 + index * 11.5
        return (
          <g key={index}>
            <line className="guitar-string" x1="0" x2="200" y1={y} y2={y} />
            {fret && (
              <text className="backdrop-fret" x={40 + index * 22} y={y + 3.5}>
                {fret}
              </text>
            )}
          </g>
        )
      })}
      <line className="guitar-line" x1="1" x2="1" y1="6" y2="63.5" />
      <line className="guitar-line" x1="199" x2="199" y1="6" y2="63.5" />
    </svg>
  )
}

/** The guitar-shop wall behind every page: a Les Paul and a Flying V on stands, plus scattered picks, notes and bits of tab. */
export function GuitarBackdrop() {
  return (
    <div className="guitar-backdrop" aria-hidden="true">
      <LesPaul />
      <FlyingV />
      {PICKS.map((placement) => (
        <svg key={`${placement.top}${placement.left}`} className="backdrop-item" style={placementStyle(placement)} viewBox="0 0 40 44">
          <path className="guitar-solid" d={PICK_PATH_SMALL} />
        </svg>
      ))}
      {NOTES.map((placement) => (
        <svg key={`${placement.top}${placement.left}`} className="backdrop-item" style={placementStyle(placement)} viewBox="0 0 50 50">
          <ellipse className="guitar-dot" cx="12" cy="42" rx="8" ry="5.5" transform="rotate(-20 12 42)" />
          <ellipse className="guitar-dot" cx="38" cy="36" rx="8" ry="5.5" transform="rotate(-20 38 36)" />
          <path className="guitar-dot" d="M18 41V9L45 3V35H43V8L20 13V41Z" />
        </svg>
      ))}
      {TAB_SNIPPETS.map(({ frets, ...placement }) => (
        <div key={`${placement.top}${placement.left}`} className="backdrop-item" style={placementStyle(placement)}>
          <BackdropTab frets={frets} />
        </div>
      ))}
    </div>
  )
}
