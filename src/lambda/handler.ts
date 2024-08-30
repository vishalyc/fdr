import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        console.log('Processing message:', record.body);
        // Add your processing logic here
    }
};
