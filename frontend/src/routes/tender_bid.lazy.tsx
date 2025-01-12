import { createLazyFileRoute } from '@tanstack/react-router'
export const Route = createLazyFileRoute('/tender_bid')({
  component: RouteComponent,
})

function RouteComponent() {
  return( 
    <>
    <div>Hello "/tender_bid"!</div>
    </>
  )
}
