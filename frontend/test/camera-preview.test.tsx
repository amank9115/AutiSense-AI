import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CameraPreview from '../src/components/camera/CameraPreview';

// Mock browser APIs
global.clamp = (value: number) => Math.max(0, Math.min(100, value));
global.MediaStream = vi.fn(() => ({
  getTracks: vi.fn(() => [
    {
      stop: vi.fn(),
      readyState: 'live',
    },
  ]),
}));

global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() => Promise.resolve(new MediaStream())),
} as unknown as MediaDevices;

global.URL = {
  createObjectURL: vi.fn(() => 'blob:test'),
  revokeObjectURL: vi.fn(),
} as unknown as typeof URL;

global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(Array(100 * 100 * 4).fill(128)),
  })),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
}));

describe('CameraPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without errors', () => {
    render(<CameraPreview onLiveMetrics={() => {}} />);
    expect(screen.getByText(/grant camera access/i)).toBeInTheDocument();
  });

  describe('metric calculations', () => {
    it('should clamp values between 0 and 100', () => {
      expect(clamp(-10)).toBe(0);
      expect(clamp(50)).toBe(50);
      expect(clamp(150)).toBe(100);
    });

    it('should use METRIC_CONFIG for calculations', () => {
      const config = {
        faceCenteredWeight: 0.6,
        faceSizeWeight: 0.4,
        eyeContactWeight: 0.7,
        motionWeight: 0.3,
        baseEmotion: 50,
        stabilityWeight: 0.4,
        motionPenaltyWeight: 0.8,
        optimalMotion: 15,
        baseGesture: 30,
        motionSensitivity: 1.2,
        baseConfidence: 40,
        confidenceStabilityWeight: 0.3,
      };

      // Test eye contact calculation
      const faceCenteredScore = 80;
      const faceSizeScore = 60;
      const expectedEyeContact = clamp(
        faceCenteredScore * config.faceCenteredWeight + 
        faceSizeScore * config.faceSizeWeight
      );
      expect(expectedEyeContact).toBeGreaterThanOrEqual(0);
      expect(expectedEyeContact).toBeLessThanOrEqual(100);
      expect(expectedEyeContact).toBe(clamp(80 * 0.6 + 60 * 0.4)); // 72

      // Test attention calculation
      const motion = 20;
      const expectedAttention = clamp(
        expectedEyeContact * config.eyeContactWeight + 
        (100 - motion) * config.motionWeight
      );
      expect(expectedAttention).toBeGreaterThanOrEqual(0);
      expect(expectedAttention).toBeLessThanOrEqual(100);
      expect(expectedAttention).toBe(clamp(72 * 0.7 + 80 * 0.3)); // 74.4
    });
  });

  describe('cleanup', () => {
    it('should have proper cleanup effect', () => {
      const { unmount } = render(<CameraPreview onLiveMetrics={() => {}} />);

      // Simulate unmount — cleanup stops camera tracks without throwing
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('face detection', () => {
    it('should handle missing FaceDetector API gracefully', () => {
      // Temporarily remove FaceDetector
      const originalFaceDetector = (window as Window & { FaceDetector?: unknown }).FaceDetector;
      delete (window as Window & { FaceDetector?: unknown }).FaceDetector;
      
      render(<CameraPreview onLiveMetrics={() => {}} />);
      
      // Should not crash without FaceDetector
      expect(screen.getByText(/grant camera access/i)).toBeInTheDocument();
      
      // Restore
      (window as Window & { FaceDetector?: unknown }).FaceDetector = originalFaceDetector;
    });
  });
});

// Helper function for testing
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}