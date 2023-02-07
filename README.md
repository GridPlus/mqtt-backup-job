# mqtt-backup-job
Describes an AWS ECS scheduled job for backing up MQTT definitions and saving them in an S3 (using AWS Copilot)

## TL;DR

 - This repo deploys a scheduled job that runs in Elastic Container Services as a Fargate instance.
 - The job:
   - runs daily,
   - creates a snapshot of the RabbitMQ instance
   - and stores it as a backup in S3 bucket
 - The job was defined using AWS Copilot (avoids touching Pulumi scripts; was **much** easier, too).
 - To start, deployment **runs on Thwip** to avoid any further issues, or possible disruptions, to GP's `PROD` (until I'm more familiar with how it works)

The job successfully fired on Feb 6th, 7PM EST (Feb 7th, 0AM GMT):

<img width="1840" alt="Screenshot 2023-02-06 at 7 20 37 PM" src="https://user-images.githubusercontent.com/276137/217116790-d9acf25c-8f9f-4bc2-b8d4-05e77e504841.png">

## Background
On Feb. 3rd, 2023, the RabbitMQ cloud instance experienced a failure. The metrics shown in ECS suggests that the CPU spiked to 100% and the instance crashed.

<img width="1468" alt="Screenshot 2023-02-06 at 11 11 36 AM" src="https://user-images.githubusercontent.com/276137/217108674-efa60e90-381c-41c9-8797-007e13ac223a.png">

On Feb 4th, 2023, it was determined that the RabbitMQ instance restarted.  

 - The recovery plan was always intended to be: re-upload a recent snapshot of the service.
 - Unfortunately, only a few minutes into investigating the problem, the most recent backup was overwritten.
 - Losing the backup meant devices that registered with the broker between Oct '22 and Feb '23 required resetting their `deviceId`.
 
## Analysis
What caused the instance to crash is still unknown. While reviewing RabbitMQ docs for clues, there's sombering warnings that suggests this will happen again:

<img width="1131" alt="Screenshot 2023-02-06 at 6 10 42 PM" src="https://user-images.githubusercontent.com/276137/217110620-74f6f2fe-3cb4-4193-9239-6e7fa046fc24.png">

Indeed, as expected: the service's logs is currently being flooded with authentication failures, and will continue to do so until affected users become aware that their devices aren't connected to the broker, and manually reset their `deviceId`:

<img width="1286" alt="Screenshot 2023-02-06 at 6 37 30 PM" src="https://user-images.githubusercontent.com/276137/217111423-5c6f59a6-a4fc-4c3a-ad7c-54bbcd5b476c.png">

The team knew that if a restart ever happened, it would result in some data loss. Thus, ever since deploying in October, as a precaution:

 - Kevin peformed **manual backups** on a _semi-regular_ basis; about 2-3 a week.
 - This done using a bash script that could `curl` the backend sent to the `/api/definitions` endpoint.
 - This produced a snapshot of the server, and would then be stored locally.

The team was aware:

 - That the backups were occuring, and the process was manual.
 - It was acknowledged that eventually the process should be automated, which never was implemented.
 
## Solution
The purpose of this repo is to:
 - create an automated solution for generating daily snapshots of the RabbitMQ instance; and,
 - store every generated snapshot in an AWS S3 bucket (eliminating the potential of accidentally losing backups to human-error).
 
At the time of creating this `README`:
 - This solution is currently deployed and scheduled to run daily;
 - The infrastructure was put on Kevin's personal AWS account (aka, _Thwip_) first, lessening the risk of further disrupting GP's `PROD`.

The solution uses AWS Copilot to define a scheduled job that runs in Elastic Container Services as a Fargate instance.



