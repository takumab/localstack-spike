import { SQSEvent, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log('Notifications Lambda triggered');
  console.log('Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    console.log('Processing SQS message:', record.body);

    // Parse S3 event notification if needed
    try {
      const s3Event = JSON.parse(record.body);
      console.log('S3 Event:', s3Event);
    } catch (error) {
      console.log('Not an S3 event or parsing failed:', error);
    }
  }

  return;
};
