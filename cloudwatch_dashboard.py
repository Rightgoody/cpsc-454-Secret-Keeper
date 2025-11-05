import boto3
cloudwatch = boto3.client('cloudwatch')

def put_metric(name, value):
    cloudwatch.put_metric_data(
        Namespace='ServerlessSecretKeeper',
        MetricData=[{
            'MetricName': name,
            'Value': value,
            'Unit': 'Count'
        }]
    )
