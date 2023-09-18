import { SSOClient, GetRoleCredentialsCommand } from '@aws-sdk/client-sso';
import { readFileSync } from 'fs';

const region = process.env.AWS_REGION ?? 'ap-southeast-2';
const accountId = process.env.AWS_ACCOUNT;
const roleName = process.env.ROLE_NAME;
const token = readFileSync('./token.json', 'utf-8')
console.log(token)

const { accessToken, _expires } = JSON.parse(token);

const sso = new SSOClient({ region });
const grcc = new GetRoleCredentialsCommand({
  accessToken,
  accountId,
  roleName,
});

sso.send(grcc).then(creds => {
  console.log(creds)
})