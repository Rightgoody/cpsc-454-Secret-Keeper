import json, boto3, base64, os, time, uuid
from boto3.dynamodb.conditions import Key

kms = boto3.client('kms')
dynamo = boto3.resource('dynamodb')
table = dynamo.Table('SecretsTable')

def encrypt_secret(secret_text):
    key_id = os.environ['KMS_KEY_ID']
    response = kms.encrypt(KeyId=key_id, Plaintext=secret_text.encode('utf-8'))
    return base64.b64encode(response['CiphertextBlob']).decode('utf-8')

def decrypt_secret(cipher_text):
    blob = base64.b64decode(cipher_text)
    response = kms.decrypt(CiphertextBlob=blob)
    return response['Plaintext'].decode('utf-8')

def lambda_handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    route = event['resource']
    body = json.loads(event.get('body', '{}'))

    if route == '/create':
        secret_id = str(uuid.uuid4())
        cipher = encrypt_secret(body['secret'])
        ttl = int(time.time()) + int(body.get('ttl', 3600))
        table.put_item(Item={
            'secret_id': secret_id,
            'user_id': user_id,
            'cipher_text': cipher,
            'created_at': int(time.time()),
            'ttl': ttl
        })
        return {'statusCode': 200, 'body': json.dumps({'secret_id': secret_id})}

    elif route == '/get':
        resp = table.get_item(Key={'secret_id': body['secret_id']})
        item = resp.get('Item')
        if item and item['user_id'] == user_id:
            plain = decrypt_secret(item['cipher_text'])
            return {'statusCode': 200, 'body': json.dumps({'secret': plain})}
        return {'statusCode': 404, 'body': 'Not found'}

    elif route == '/delete':
        table.delete_item(Key={'secret_id': body['secret_id']})
        return {'statusCode': 200, 'body': json.dumps({'deleted': True})}

    elif route == '/list':
        resp = table.query(
            IndexName='user_id-index',
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        return {'statusCode': 200, 'body': json.dumps(resp['Items'])}

    return {'statusCode': 400, 'body': 'Unknown route'}
