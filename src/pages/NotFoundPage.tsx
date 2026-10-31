import { Link } from 'react-router-dom'

interface NotFoundPageProps {
  message?: string
}

export function NotFoundPage({ message = "This page doesn't exist." }: NotFoundPageProps) {
  return (
    <div className="card empty">
      <h1>Not found</h1>
      <p className="muted">{message}</p>
      <Link to="/" className="btn">
        Back to your classes
      </Link>
    </div>
  )
}
