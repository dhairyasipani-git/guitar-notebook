import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// GitHub's build machines are slower than a laptop; give screens a little longer to appear.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
})
