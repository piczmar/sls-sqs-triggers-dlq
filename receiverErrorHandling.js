'use strict';
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({
	region: 'us-east-1'
});


exports.handler = (event, context, callback) => {

	const NUM_OF_RETRIES = 3;
	try {
		console.log('event: ', JSON.stringify(event));

		// you can e.g. sent request to external services here
		// if service is not available you would like to catch error and retry
		// this is what we're going to simulate here
		throw new Error("simulated error");

		// this will never be reached in our demo
		callback(null, "How did you get here??");

	} catch (e) {
		console.log('Handled error', e);

		// we will send new message with incremented count, if below retry limit, otherwise exit with status code 200
		// to allow AWS to remove SQS message, but return status message.
		var message = JSON.parse(event.Records[0].body); // message boody arrives as string JSON
		var retried =  message.retryCount | 0; // we've sat batchSize=1 in sls config so it's save to get by index.
		if (retried > NUM_OF_RETRIES-1) {
			const response = "Failed after retries";
			console.log(response);
			callback(null, response);
		} else {
			retried++;
			message.retryCount = retried;
			// send a new message which is a copy of received message but with incremender retry counter.
			var accountId = context.invokedFunctionArn.split(":")[4];
			var queueUrl = 'https://sqs.us-east-1.amazonaws.com/' + accountId + '/MyQueue';

			// the "DelaySeconds" is important because we do not want to immediately invoke another Lambda after we completed this one.
			// let's give external services time to heal :) so that another Lambda call can reach them (in our demo it will never happen)
			var params = {
				MessageBody: JSON.stringify(message),
				QueueUrl: queueUrl,
				DelaySeconds: 10
			};

			// let's simulate sending error - putting wrong message format, body should be string
			// if(retried === 2){
			// 	params.MessageBody = message
			// }
			sqs.sendMessage(params, function (err, data) {
				if (err) {
					// what would happen if we cannot retry is that the same message will arrive to Lambda with initial retry count not incremented
					// until the Lambda succeeds or the message expires in the queue.
					// To allow the same message we should not return success
					console.log(err);
					callback( "Failed to retry after error" );
				} else {
					const response =  "Failed, but will retry " + retried + " time";
					console.log(response);
					callback(null,response);
				}
				
			});
		}
	}
};
