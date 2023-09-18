# aws sample sso flaw with OIDC

Demo for AWS to see if we've got something fundamentally wrong.

## Run code

Set a relevant `START_URL` environment variable which is your SSO landing
page.

The URL generated needs to be clicked and then once done you'll have an access
token generated to this directory.

```bash

npm install
export START_URL=<your SSO URL>
npm run token-gen

cat token.json

```

The session token above can be used to generate a set of AWS credentials
which can be used by the AWS CLI for example, you'll need a few more
environment variables set for the role assume to happen:

```bash

export AWS_ACCOUNT=<your AWS account ID>
export ROLE_NAME=<role in the above account to use>

npm run creds-gen
```

## Why is this an issue?

The URL generated in the `npm run token-gen` command is held by the node
process with AWS until it's clicked by a user and they accept the request.

This is a problem because if an attacker knows the `START_URL` of an org (can
be guessed for some companies and likely an easy thing to accidentally leak)
they can generate this URL and use it to phish employees to click on the AWS
looking link like so:

`https://device.sso.ap-southeast-2.amazonaws.com/?user_code=DRVJ-ZNVP`
