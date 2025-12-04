import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Fångar fel i React-komponenter och visar felmeddelande
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ color: '#f44336', marginBottom: '20px' }}>
            Något gick fel
          </h1>
          <div style={{
            padding: '20px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
              Felmeddelande:
            </h2>
            <pre style={{
              fontSize: '14px',
              overflow: 'auto',
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '4px'
            }}>
              {this.state.error?.message || 'Okänt fel'}
            </pre>
            {this.state.error?.stack && (
              <>
                <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '10px' }}>
                  Stack trace:
                </h3>
                <pre style={{
                  fontSize: '12px',
                  overflow: 'auto',
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '4px',
                  maxHeight: '300px'
                }}>
                  {this.state.error.stack}
                </pre>
              </>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#644ff7',
              color: 'white',
              border: 'none',
              borderRadius: '100vw',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Ladda om sidan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
