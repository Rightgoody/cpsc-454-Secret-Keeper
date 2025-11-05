import boto3, time
sns = boto3.client('sns')
dynamo = boto3.resource('dynamodb')
table = dynamo.Table('SecretsTable')

def lambda_handler(event, context):
    now = int(time.time())
    items = table.scan()['Items']
    total = len(items)
    expired = len([i for i in items if i['ttl'] < now])
    avg_ttl = sum([i['ttl'] - i['created_at'] for i in items]) / max(1,total)
    msg = f"Serverless Secret Keeper Summary:\n" \
          f"- Total secrets: {total}\n" \
          f"- Expired: {expired}\n" \
          f"- Avg TTL: {avg_ttl/60:.2f} min"
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Subject='Daily Secret Keeper Summary',
        Message=msg
    )

