import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/another-demo-page')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/another-demo-page"!</div>
}
