vi.mock('electron', () => {
  return {
    app: {
      getPath: () => '/mock/userData'
    }
  };
});

const { getLocalIP, startLANServer, stopLANServer } = require('./lanServer');

describe('LAN Server Service', () => {
  afterEach(() => {
    stopLANServer();
  });

  it('should retrieve a valid local IP address', () => {
    const ip = getLocalIP();
    expect(ip).toBeDefined();
    expect(typeof ip).toBe('string');
    expect(ip.length).toBeGreaterThan(0);
  });

  it('should start and stop the LAN Express server successfully', () => {
    // Mock mainWindow object
    const mockWindow = {
      isDestroyed: () => false,
      webContents: {
        send: vi.fn()
      }
    };

    const result = startLANServer(mockWindow);
    expect(result.success).toBe(true);
    expect(result.port).toBe(5001);
    expect(result.ip).toBeDefined();

    // Verify calling it again returns same server info
    const secondResult = startLANServer(mockWindow);
    expect(secondResult.port).toBe(5001);

    // Stop server
    expect(() => stopLANServer()).not.toThrow();
  });
});
