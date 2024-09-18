import { SQSEvent } from 'aws-lambda';
import { getApplicationIdByName, updateOrCreateEndpoint } from './pinpoint';

export const handler = async (event: SQSEvent) => {
    try {
        console.info('Creating/Updating Pinpoint Endpoint:', JSON.stringify(event, null, 2));
        // Step 1: Get the applicationId from the project name
        const projectName = "fdr";
        
        const appId = await getApplicationIdByName(projectName);

        for (const record of event.Records) {
            const body = JSON.parse(record.body);
            const recipientId = body.recipientId;
            const vendorId = body.vendorId;
            const endpointId = `${recipientId}-${vendorId}`; // Unique identifier
            const eventType = body.type;
            // Step 2: Create or update the endpoint
            await updateOrCreateEndpoint(
                appId,
                endpointId,
                recipientId,
                body.recipientEmail,
                body.recipientName,
                body.vendorName,
                vendorId,
                body.attestationUrl,
                eventType
            );
            console.info(`Creating/Updating Pinpoint Endpoint for User: ${body.recipientEmail}`);
        }
    } catch (error) {
        console.error("Error handling endpoint:", error);
        throw new Error(`Failed to process the message from SQS`);
    }
};
