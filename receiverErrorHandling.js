'use strict';

exports.handler = (event, context, callback) => {

  try{
	  const response = {
	    statusCode: 200,
	    body: JSON.stringify({
	      message: 'Go Serverless v1.0! Your function executed successfully!',
	      input: event,
	    }),
	  };

	  console.log('event: ',JSON.stringify(event));

	  var body = event.Records[0].body;
  
  	console.log("text: ",JSON.parse(body).text);	
  } catch(e){
  	console.log('Handled error',e);
  	// depends what you'd like to do in case of error, e.g. we can return successfully from Lambda
  	// or we could increment the errors counter within the message body like that:



  	// still there is a chance that sth failed here, e.g. sending new message to the queue failed
  	// so DLQ solution is a good backup point anyway.
  }
  

  callback(null, response);
};
