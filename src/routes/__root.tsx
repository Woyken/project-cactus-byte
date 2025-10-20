import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'
// import { lazy } from 'solid-js'
// import { createSignal, onMount } from 'solid-js'

// React query dev tools generate some weird css with goober, it contains not classnames but keyframes
// const TanStackRouterDevtools = lazy(() =>
//   import('@tanstack/solid-router-devtools').then(module => ({
//     default: module.TanStackRouterDevtools
//   }))
// )
import TanStackQueryProvider from '../integrations/tanstack-query/provider.tsx'

import '@fontsource/inter'

import Header from '../components/Header'

// import styleCss from '../styles.css?url'

export const Route = createRootRouteWithContext()({
  head: () => ({
    // links: [{ rel: 'stylesheet', href: styleCss }],
  }),
  shellComponent: RootComponent,
})

function RootComponent() {
  // const [showDevtools, setShowDevtools] = createSignal(false)

  // onMount(() => {
  //   const timer = setTimeout(() => {
  //     setShowDevtools(true)
  //   }, 10000) // 10 seconds

  //   return () => clearTimeout(timer)
  // })

  return (
    <>
      <TanStackQueryProvider>
        <HeadContent />

        <Header />

        <Outlet />
        {/* {showDevtools() && <TanStackRouterDevtools />} */}
      </TanStackQueryProvider>

      <Scripts />
    </>
  )
}
