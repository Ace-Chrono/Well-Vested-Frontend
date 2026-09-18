import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Example Page</h1>
      <Button onClick={() => setCount((value) => value + 1)}>
        Count is {count}
      </Button>
    </main>
  )
}

export default App
