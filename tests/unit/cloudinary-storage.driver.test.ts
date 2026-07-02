import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudinaryStorageDriver } from '#infrastructure/storage/drivers/cloudinary-storage.driver';
import { v2 as cloudinary } from 'cloudinary';

vi.mock('cloudinary', () => {
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: vi.fn((options, callback) => {
          const mockResult = {
            secure_url:
              'https://res.cloudinary.com/test-cloud/image/upload/v1234/plants/monstera.jpg',
          };
          return {
            end: vi.fn(() => {
              callback(null, mockResult);
            }),
          };
        }),
        destroy: vi.fn((publicId, callback) => {
          callback(null, { result: 'ok' });
        }),
      },
      url: vi.fn(
        (publicId) =>
          `https://res.cloudinary.com/test-cloud/image/upload/${publicId}`
      ),
    },
  };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CloudinaryStorageDriver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures cloudinary correctly in constructor', () => {
    new CloudinaryStorageDriver();
    expect(cloudinary.config).toHaveBeenCalled();
  });

  it('uploads a file buffer to cloudinary', async () => {
    const driver = new CloudinaryStorageDriver();
    const mockFile = {
      filename: 'monstera.jpg',
      buffer: Buffer.from('test-buffer'),
      mimeType: 'image/jpeg',
      size: 11,
    };

    const url = await driver.put('plants/monstera.jpg', mockFile);
    expect(url).toBe('plants/monstera.jpg');
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'plants',
        public_id: 'monstera',
        overwrite: true,
      }),
      expect.any(Function)
    );
  });

  it('deletes a file from cloudinary', async () => {
    const driver = new CloudinaryStorageDriver();
    await driver.delete('plants/monstera.jpg');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'plants/monstera',
      expect.any(Function)
    );
  });

  it('gets a file buffer from cloudinary', async () => {
    const mockBuffer = Buffer.from('mocked-binary-content');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () =>
        mockBuffer.buffer.slice(
          mockBuffer.byteOffset,
          mockBuffer.byteOffset + mockBuffer.byteLength
        ),
    });

    const driver = new CloudinaryStorageDriver();
    const result = await driver.get('plants/monstera.jpg');
    expect(result.toString()).toBe('mocked-binary-content');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://res.cloudinary.com/test-cloud/image/upload/plants/monstera'
    );
  });
});
