import * as AWS from 'aws-sdk';

const pinpoint = new AWS.Pinpoint({ region: 'us-east-1' }); // Set your region

export async function getApplicationIdByName(projectName: string): Promise<string> {
    const apps = await pinpoint.getApps({}).promise();
    
    // Check if ApplicationsResponse and Item are defined
    if (!apps.ApplicationsResponse || !apps.ApplicationsResponse.Item) {
        throw new Error('No applications found or ApplicationsResponse is undefined');
    }

    const app = apps.ApplicationsResponse.Item.find(app => app.Name === projectName);

    if (!app) {
        throw new Error(`Application with name ${projectName} not found`);
    }

    return app.Id;
}

export async function getEndpoint(appId: string, endpointId: string) {
    try {
        const endpointResponse = await pinpoint.getEndpoint({
            ApplicationId: appId,
            EndpointId: endpointId
        }).promise();
        return endpointResponse.EndpointResponse;
    } catch (error) {
        if (error instanceof Error) {
            if ((error as AWS.AWSError).code === 'NotFoundException') {
                return null;
            } else {
                throw error;
            }
        } else {
            throw new Error('An unknown error occurred');
        }
    }
}

export async function updateOrCreateEndpoint(
    appId: string,
    endpointId: string,
    recipientId: string,
    recipientEmail: string,
    recipientName: string,
    vendorName: string,
    vendorId: string,
    attestationUrl: string,
    eventType: string
) {
    const endpointRequest: AWS.Pinpoint.EndpointRequest = {
        Address: recipientEmail,
        ChannelType: 'EMAIL',
        Attributes: {
            recipientName: [recipientName],
            vendorName: [vendorName],
            vendorId: [vendorId],
            attestationUrl: [attestationUrl],
        },
        User: {
            UserId: recipientId,
            UserAttributes: {
                recipientName: [recipientName],
                vendorName: [vendorName],
            }
        }
    };

    // Add OptOut property if the eventType is 'deleted'
    if (eventType === 'deleted') {
        endpointRequest.OptOut = 'ALL';
    }

    const existingEndpoint = await getEndpoint(appId, endpointId);

    if (existingEndpoint) {
        await pinpoint.updateEndpoint({
            ApplicationId: appId,
            EndpointId: endpointId,
            EndpointRequest: endpointRequest
        }).promise();
        console.log(`Endpoint ${endpointId} updated.`);
    } else {
        await pinpoint.updateEndpoint({
            ApplicationId: appId,
            EndpointId: endpointId,
            EndpointRequest: endpointRequest
        }).promise();
        console.log(`Endpoint ${endpointId} created.`);
    }
}
