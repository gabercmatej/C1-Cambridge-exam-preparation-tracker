import type { ReactNode } from 'react'
import type { Basis, Label } from '../data/scores'

/** Official, unofficial and tutor results are told apart by shape as well as by words. */
export const BasisMark = ({ basis, children }: { basis: Basis; children: ReactNode }) => (
  <span className={`basis ${basis}`}><i aria-hidden="true" />{children}</span>
)

export const StatusMark = ({ label, provisional }: { label: Label; provisional?: boolean }) => (
  <span className={`status ${label.toLowerCase()}`}>{label}{provisional && <span className="prov">&nbsp;(provisional)</span>}</span>
)

/** Five band circles, half-filled for .5 values. */
export const BandPips = ({ v }: { v: number }) => (
  <span className="bp" aria-hidden="true">{[1, 2, 3, 4, 5].map((k) => <i key={k} className={v >= k ? 'on' : v >= k - 0.5 ? 'half' : ''} />)}</span>
)

/** Review steps: three short bars, completed steps in the secure colour. */
export const StepPips = ({ box }: { box: number }) => (
  <span className="pips" aria-hidden="true">{[0, 1, 2].map((k) => <i key={k} className={box > k ? 'on' : ''} />)}</span>
)
