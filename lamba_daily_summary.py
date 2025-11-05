import boto3, os, time

sns = boto3.client("sns")
dynamo = boto3.resource("dynamodb")
table = dynamo.Table(os.environ["TABLE_NAME"])

def lambda_handler(event, context):
    now = int(time.time())
    resp = table.scan()
    items = resp.get("Items", [])
    total = len(items)
    expired = sum(1 for i in items if i["ttl"] < now)
    avg_ttl = (
        sum(i["ttl"] - i["created_at"] for i in items) / total / 60 if total else 0
    )
    msg = (
        "📊 Serverless Secret Keeper Summary\n"
        f"Total secrets: {total}\n"
        f"Expired: {expired}\n"
        f"Avg TTL: {avg_ttl:.2f} min"
    )

    sns.publish(
        TopicArn=os.environ["SNS_TOPIC_ARN"],
        Subject="Daily Secret Keeper Summary",
        Message=msg,
    )
    return {"statusCode": 200, "body": "Summary sent"}
