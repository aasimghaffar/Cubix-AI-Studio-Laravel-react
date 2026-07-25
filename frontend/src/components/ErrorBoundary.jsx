import { Component } from 'react'

/**
 * Catches any unexpected rendering error anywhere in the app.
 * Instead of React unmounting everything (blank screen), the user sees
 * a friendly message with a reload button.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App render error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen grid place-items-center p-6 bg-ink-950">
        <div className="card p-8 max-w-md text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="font-display font-semibold text-white text-lg mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 mb-6">
            An unexpected error occurred while showing this page. Reloading usually fixes it.
          </p>
          <button onClick={() => window.location.reload()} className="btn-brand w-full">
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
