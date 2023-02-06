import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import https from 'node:https';

const url = new URL('https://connect.gridpl.us');
const path = '/api/definitions';
const port = 15672;
const auth = `${process.env.ADMIN_USER}:${process.env.ADMIN_PASS}`

const options = {
  auth: auth,
  port: port,
  path: path,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

(async () => {
  let body = '';  

  const promise = new Promise((resolve, reject) => {
    // https://nodejs.org/api/http.html#http_http_request_options_callback
    const req = https.request(url, options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve(body);
      });
    })

    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
      reject(e);
    });

    req.end();
  })

  await promise;

  const bucketName = process.env.BACKUPS3_NAME;
  const bucketParams = {
    Bucket: bucketName,
    Key: `mqtt-${new Date()}.json`,
    Body: body,
  };
  const s3Client = new S3Client({ region: 'us-east-1' });

  try {
    const data = await s3Client.send(new PutObjectCommand(bucketParams))
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }
})();

