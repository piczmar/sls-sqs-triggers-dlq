The intent of this project was to demonstrate working Dead Letter Queue with Lambda function triggered from SQS. 

Unortunately, I could not make it work using the `DeadLetterConfig` property on function so I ended up using the `RedrivePolicy` on source queue.

This project contains sources for my original attempt with `DeadLetterConfig`.

In [the documentation](https://docs.aws.amazon.com/lambda/latest/dg/retries-on-errors.html) it's stated: 

```
Poll-based event sources that are not stream-based: This consists of Amazon Simple Queue Service. If you configure an Amazon SQS queue as an event source, AWS Lambda will poll a batch of records in the queue and invoke your Lambda function. If it fails, AWS Lambda will continue to process other messages in the batch. Meanwhile, AWS Lambda will continue to retry processing the failed message until one of the following happens:
The message is ultimately invoked successfully: In this case, the message is removed from the queue.
The message retention period expires: In this case, the message is either discarded or if you have configured an Amazon SQS Dead Letter Queue, the failure information will be directed there for you to analyze.

```

In my case message is not sent to DLQ after it expires in the original queue (as a result of failing Lambda).

If you look at the Lambda function in Amazon console it has configured error handling: 

![error handling config on Lambda](/images/receiver_lambda.png)


So why it does not work???

# Running the project
You neeed to have AWS CLI configured. I have configured pofile `sls`.

```
npm i -g serverless
sls deploy
```

# Testing

 To test this send message to SQS:
 ```
 export QUEUE_URL=`aws sqs get-queue-url --queue-name MyQueue --query 'QueueUrl' --output text --profile=sls`
 aws sqs send-message --queue-url ${QUEUE_URL} --message-body "test" --profile=sls
 ```
 
 or you can use the sender HTTP API

 ```
sls info
 ```
 Grab the sender URL and test with:

 ```
 curl <sender url> -d '{wrong: json}'
 ```

You can check then in logs that error happened in `receiver` lambda: 

```
sls logs -f receiver -t
```

would print

```
2018-07-27 17:10:31.999 (+02:00)        5f7551a7-7ba0-5f10-b60e-027243bab63b    SyntaxError: Unexpected token w in JSON at position 1
    at Object.parse (native)
    at exports.handler (/var/task/receiver.js:15:29)
END RequestId: 5f7551a7-7ba0-5f10-b60e-027243bab63b
REPORT RequestId: 5f7551a7-7ba0-5f10-b60e-027243bab63b  Duration: 58.52 ms      Billed Duration: 100 ms     Memory Size: 1024 MB    Max Memory Used: 20 MB
```

and then the message would expire in `MyQueue` because it has `MessageRetentionPeriod` of 60 sec.

If we go to AWS console and view content of DLQ we would not see any message there.