const AWS = require('aws-sdk');
const { handler } = require('./index'); // Assuming index.js is your Lambda file

jest.mock('aws-sdk', () => {
  const pinpointMock = {
    updateEndpoint: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return {
    Pinpoint: jest.fn(() => pinpointMock),
  };
});

describe('Lambda Pinpoint Endpoint Handler for SQS', () => {
  const pinpointMock = new AWS.Pinpoint();

  beforeEach(() => {
    pinpointMock.updateEndpoint.mockClear();
    pinpointMock.promise.mockClear();
  });

  it('should successfully process SQS messages and update endpoints', async () => {
    // Mock successful update
    pinpointMock.promise.mockResolvedValue({ MessageBody: 'Success' });

    const event = {
      Records: [
        {
          messageId: '1',
          body: JSON.stringify({
            UserId: 'vendor1-recipient1',
            Email: 'vishalyc@gmail.com',
            Attributes: { recipientName: ['Vishal Inc'], vendorName: ['TestVendor1'], vendorId: ['1234'], attestationUrl: 'http://www.google.com' }
          })
        },
        {
          messageId: '2',
          body: JSON.stringify({
            UserId: 'vendor1-recipient2',
            Email: 'vishalyc@hotmail.com',
            Attributes: { recipientName: ['Vishal Inc'], vendorName: ['TestVendor1'], vendorId: ['1234'], attestationUrl: 'http://www.google.com' }
          })
        }
      ]
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success.length).toBe(2);
    expect(body.error.length).toBe(0);
    expect(pinpointMock.updateEndpoint).toHaveBeenCalledTimes(2);
  });

  it('should handle errors for invalid messages', async () => {
    // Mock failure for one message
    pinpointMock.promise.mockRejectedValueOnce(new Error('Test error'));

    const event = {
      Records: [
        {
          messageId: '1',
          body: JSON.stringify({
            UserId: 'vendor1-recipient2',
            Email: 'vishalyc@hotmail.com',
            Attributes: { recipientNames: ['Vishal Inc'], vendorName: ['TestVendor1'], vendorId: ['1234'], attestationUrl: 'http://www.google.com' }
          })
        },
        {
          messageId: '2',
          body: 'Invalid JSON'
        }
      ]
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success.length).toBe(1);
    expect(body.error.length).toBe(1);
    expect(body.error[0].messageId).toBe('2');
    expect(pinpointMock.updateEndpoint).toHaveBeenCalledTimes(1);
  });
});
