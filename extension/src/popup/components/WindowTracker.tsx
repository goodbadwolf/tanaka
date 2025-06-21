import { useWindowTracking } from '../hooks/useWindowTracking';

export function WindowTracker() {
  const { isTracked, isLoading, error, toggleTracking } = useWindowTracking();

  return (
    <>
      <div className="window-control">
        <label>
          <input
            type="checkbox"
            checked={isTracked}
            onChange={toggleTracking}
            disabled={isLoading}
          />
          <span>Sync this window</span>
        </label>
      </div>

      <div className="status" id="status">
        {error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : isTracked ? (
          <p style={{ color: 'green' }}>✓ This window is being synced</p>
        ) : (
          <p>This window is not being synced</p>
        )}
      </div>
    </>
  );
}