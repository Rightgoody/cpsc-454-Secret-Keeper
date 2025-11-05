import json, boto3, base64, os, time, uuid
from boto3.dynamodb.conditions import Key

kms = boto3.client("kms")
dynamo = boto3.resource("dynamodb")
table = dynamo.Table(os.environ["TABLE_NAME"])
cloudwatch = boto3.client("cloudwatch")

def encrypt_secret(secret_text: str) -> str:
    resp = kms.encrypt(KeyId=os.environ["KMS_KEY_ID"], Plaintext=secret_text.encode())
    return base64.b64encode(resp["CiphertextBlob"]).decode()

def decrypt_secret(cipher_text: str) -> str:
    blob = base64.b64decode(cipher_text)
    resp = kms.decrypt(CiphertextBlob=blob)
    return resp["Plaintext"].decode()

def put_metric(name, value):
    cloudwatch.put_metric_data(
        Namespace="ServerlessSecretKeeper",
        MetricData=[{"MetricName": name, "Value": value, "Unit": "Count"}],
    )

def lambda_handler(event, context):
    route = event["resource"]
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    body = json.loads(event.get("body") or "{}")

    if route.endswith("/create"):
        secret_id = str(uuid.uuid4())
        cipher = encrypt_secret(body["secret"])
        ttl = int(time.time()) + int(body.get("ttl", 3600))
        table.put_item(
            Item={
                "secret_id": secret_id,
                "user_id": user_id,
                "cipher_text": cipher,
                "created_at": int(time.time()),
                "ttl": ttl,
            }
        )
        put_metric("SecretsCreated", 1)
        return {"statusCode": 200, "body": json.dumps({"secret_id": secret_id})}

    elif route.endswith("/get"):
        resp = table.get_item(Key={"secret_id": body["secret_id"]})
        item = resp.get("Item")
        if not item or item["user_id"] != user_id:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        plain = decrypt_secret(item["cipher_text"])
        if body.get("burn_after_read", False):
            table.delete_item(Key={"secret_id": body["secret_id"]})
            put_metric("SecretsDeleted", 1)
        return {"statusCode": 200, "body": json.dumps({"secret": plain})}

    elif route.endswith("/delete"):
        table.delete_item(Key={"secret_id": body["secret_id"]})
        put_metric("SecretsDeleted", 1)
        return {"statusCode": 200, "body": json.dumps({"deleted": True})}

    elif route.endswith("/list"):
        resp = table.query(
            IndexName="user_id-index", KeyConditionExpression=Key("user_id").eq(user_id)
        )
        return {"statusCode": 200, "body": json.dumps(resp.get("Items", []))}

    else:
        return {"statusCode": 400, "body": json.dumps({"error": "Unknown route"})}
